type FailureBucket = {
  failures: number;
  resetAt: number;
};

export type AttemptResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export class FixedWindowFailureLimiter {
  private readonly buckets = new Map<string, FailureBucket>();
  private readonly windowMs: number;
  private readonly maxFailures: number;
  private readonly maxBuckets: number;

  constructor(windowMs: number, maxFailures: number, maxBuckets = 10_000) {
    this.windowMs = windowMs;
    this.maxFailures = maxFailures;
    this.maxBuckets = maxBuckets;
  }

  check(key: string, now = Date.now()): AttemptResult {
    const bucket = this.activeBucket(key, now);
    if (!bucket || bucket.failures < this.maxFailures) {
      return { allowed: true, retryAfterSeconds: 0 };
    }

    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  recordFailure(key: string, now = Date.now()) {
    this.prune(now);
    const bucket = this.activeBucket(key, now);
    this.buckets.set(key, {
      failures: (bucket?.failures ?? 0) + 1,
      resetAt: bucket?.resetAt ?? now + this.windowMs,
    });
  }

  clear(key: string) {
    this.buckets.delete(key);
  }

  private activeBucket(key: string, now: number) {
    const bucket = this.buckets.get(key);
    if (bucket && bucket.resetAt > now) return bucket;
    if (bucket) this.buckets.delete(key);
    return null;
  }

  private prune(now: number) {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }

    while (this.buckets.size >= this.maxBuckets) {
      const oldestKey = this.buckets.keys().next().value;
      if (oldestKey === undefined) break;
      this.buckets.delete(oldestKey);
    }
  }
}
