import type { H3Event } from 'h3'

type LoginBucket = {
  failures: number
  resetAt: number
}

const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 5
const MAX_BUCKETS = 10_000
const buckets = new Map<string, LoginBucket>()

function keyFor(event: H3Event, email: string) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  return `${ip}:${email.trim().toLowerCase()}`
}

function activeBucket(key: string, now = Date.now()) {
  const bucket = buckets.get(key)

  if (bucket && bucket.resetAt > now) return bucket
  if (bucket) buckets.delete(key)
  return null
}

function pruneBuckets(now = Date.now()) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }

  if (buckets.size >= MAX_BUCKETS) {
    const oldestKey = buckets.keys().next().value
    if (oldestKey) buckets.delete(oldestKey)
  }
}

export function assertLoginAllowed(event: H3Event, email: string) {
  const bucket = activeBucket(keyFor(event, email))
  if (!bucket || bucket.failures < MAX_FAILURES) return

  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - Date.now()) / 1000))
  setResponseHeader(event, 'Retry-After', retryAfter)
  throw createError({
    statusCode: 429,
    statusMessage: 'Too many sign-in attempts. Try again later.',
  })
}

export function recordLoginFailure(event: H3Event, email: string) {
  const now = Date.now()
  pruneBuckets(now)

  const key = keyFor(event, email)
  const bucket = activeBucket(key, now)
  buckets.set(key, {
    failures: (bucket?.failures ?? 0) + 1,
    resetAt: bucket?.resetAt ?? now + WINDOW_MS,
  })
}

export function clearLoginFailures(event: H3Event, email: string) {
  buckets.delete(keyFor(event, email))
}
