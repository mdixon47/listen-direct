import type { H3Event } from "h3";
import { FixedWindowFailureLimiter } from "./failure-window";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const MAX_BUCKETS = 10_000;
const limiter = new FixedWindowFailureLimiter(
  WINDOW_MS,
  MAX_FAILURES,
  MAX_BUCKETS,
);

function keyFor(event: H3Event, email: string) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown";
  return `${ip}:${email.trim().toLowerCase()}`;
}

export function assertLoginAllowed(event: H3Event, email: string) {
  const result = limiter.check(keyFor(event, email));
  if (result.allowed) return;

  setResponseHeader(event, "Retry-After", result.retryAfterSeconds);
  throw createError({
    statusCode: 429,
    statusMessage: "Too many sign-in attempts. Try again later.",
  });
}

export function recordLoginFailure(event: H3Event, email: string) {
  limiter.recordFailure(keyFor(event, email));
}

export function clearLoginFailures(event: H3Event, email: string) {
  limiter.clear(keyFor(event, email));
}
