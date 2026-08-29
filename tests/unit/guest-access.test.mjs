import assert from "node:assert/strict";
import test from "node:test";
import { isGuestDashboardRoute } from "../../app/utils/guest-access.ts";

test("allows only the explicit dashboard guest route", () => {
  assert.equal(isGuestDashboardRoute("/dashboard", { demo: "1" }), true);
  assert.equal(isGuestDashboardRoute("/dashboard", { demo: "true" }), false);
  assert.equal(isGuestDashboardRoute("/dashboard", {}), false);
  assert.equal(isGuestDashboardRoute("/admin", { demo: "1" }), false);
});

test("does not accept arrays or non-string query values", () => {
  assert.equal(isGuestDashboardRoute("/dashboard", { demo: ["1"] }), false);
  assert.equal(isGuestDashboardRoute("/dashboard", { demo: 1 }), false);
  assert.equal(isGuestDashboardRoute("/dashboard", { demo: true }), false);
});
