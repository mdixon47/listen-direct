import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const port = 41_000 + (process.pid % 1_000);
const origin = `http://127.0.0.1:${port}`;

async function waitForServer(child) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null)
      throw new Error(`Production server exited with code ${child.exitCode}`);
    try {
      const response = await fetch(`${origin}/`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  throw new Error("Production server did not become ready");
}

test("guest rendering stays page-only and protected APIs stay private", async (context) => {
  const child = spawn(process.execPath, [".output/server/index.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      NUXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NUXT_PUBLIC_SUPABASE_KEY: "sb_publishable_test_placeholder",
    },
    stdio: "ignore",
  });

  context.after(async () => {
    if (child.exitCode !== null) return;
    child.kill("SIGTERM");
    await Promise.race([
      once(child, "exit"),
      new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000)),
    ]);
    if (child.exitCode === null) child.kill("SIGKILL");
  });

  await waitForServer(child);

  const guest = await fetch(`${origin}/dashboard?demo=1`, {
    redirect: "manual",
  });
  assert.equal(guest.status, 200);

  const privateDashboard = await fetch(`${origin}/dashboard`, {
    redirect: "manual",
  });
  assert.equal(privateDashboard.status, 302);
  assert.match(
    privateDashboard.headers.get("location") ?? "",
    /^\/login\?redirect=/,
  );

  for (const path of [
    "/api/auth/me",
    "/api/voice/turns",
    "/api/data-policy",
    "/api/admin/users",
  ]) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(
      response.status,
      401,
      `${path} should reject anonymous requests`,
    );
  }

  const createTurn = await fetch(`${origin}/api/voice/turns`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  assert.equal(createTurn.status, 401);

  const updatePolicy = await fetch(`${origin}/api/data-policy`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  assert.equal(updatePolicy.status, 401);
});
