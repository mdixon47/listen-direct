import assert from "node:assert/strict";
import test from "node:test";
import { FixedWindowFailureLimiter } from "../../server/utils/failure-window.ts";

test("blocks after the configured failure threshold", () => {
  const limiter = new FixedWindowFailureLimiter(60_000, 3);
  for (let attempt = 0; attempt < 3; attempt += 1)
    limiter.recordFailure("client", 1_000);

  assert.deepEqual(limiter.check("client", 1_000), {
    allowed: false,
    retryAfterSeconds: 60,
  });
});

test("expires the window and allows a new attempt", () => {
  const limiter = new FixedWindowFailureLimiter(1_000, 1);
  limiter.recordFailure("client", 10_000);

  assert.equal(limiter.check("client", 10_999).allowed, false);
  assert.deepEqual(limiter.check("client", 11_000), {
    allowed: true,
    retryAfterSeconds: 0,
  });
});

test("clears failures after a successful sign-in", () => {
  const limiter = new FixedWindowFailureLimiter(60_000, 1);
  limiter.recordFailure("client", 1_000);
  limiter.clear("client");

  assert.equal(limiter.check("client", 1_000).allowed, true);
});
