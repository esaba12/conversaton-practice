// Explicit coordinator-only integration check. Not imported by the application.
// Creates two confirmed fictional Auth users without email, tests with their JWTs,
// then deletes only those users and their session rows. Never prints credentials.
import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const capability = process.env.SESSION_SERVER_SECRET;
if (!url || !publishable || !capability) throw new Error("Required test configuration is missing.");
const ref = new URL(url).hostname.split(".")[0];
if ((await readFile("supabase/.temp/project-ref", "utf8")).trim() !== ref) throw new Error("Linked project and local environment differ.");
const keysResult = spawnSync("supabase", ["projects", "api-keys", "--project-ref", ref, "--reveal", "--output", "json"], { encoding: "utf8", timeout: 60_000 });
if (keysResult.status !== 0) throw new Error("Could not obtain isolated test administration access.");
const keys = JSON.parse(keysResult.stdout);
const adminKey = Array.isArray(keys) ? keys.find(key => key.name === "service_role")?.api_key : undefined;
if (!adminKey) throw new Error("Administrative test key unavailable. No test users created.");
const options = { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } };
const admin = createClient(url, adminKey, options);
const fixtures = [], clients = [], credentials = [];
const ledger = "artifacts/local/auth-fixtures.json";
const assert = (condition, name) => { if (!condition) throw new Error(`Assertion failed: ${name}`); };
const rpc = (client, name, args) => client.rpc(name, { p_secret: capability, ...args });
try {
  await mkdir("artifacts/local", { recursive: true });
  for (let index = 0; index < 2; index++) {
    const email = `g1-${randomUUID()}@example.invalid`, password = randomBytes(32).toString("hex");
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    assert(!created.error && created.data.user, "create fictional confirmed user");
    fixtures.push(created.data.user.id);
    await writeFile(ledger, JSON.stringify({ ownerIds: fixtures }), { mode: 0o600 });
    const client = createClient(url, publishable, options);
    const signedIn = await client.auth.signInWithPassword({ email, password });
    assert(!signedIn.error && signedIn.data.session, "real password sign-in");
    const identity = await client.auth.getUser();
    assert(!identity.error && identity.data.user?.id === created.data.user.id && !identity.data.user.is_anonymous, "server verified identity");
    clients.push(client);
    credentials.push({ email, password });
  }
  console.log("PASS: two real Auth password sign-ins and verified nonanonymous identities (fictional fixtures; no email sent).");
  if (process.argv.includes("--ui-only")) {
    const { chromium } = await import("@playwright/test");
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.goto("http://127.0.0.1:3000/auth/sign-in");
      await page.getByLabel("Email", { exact: true }).fill(credentials[0].email);
      await page.getByLabel("Password", { exact: true }).fill(credentials[0].password);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.waitForURL("**/practice", { timeout: 20_000 });
      assert(await page.getByRole("button", { name: "Start practice", exact: true }).isDisabled(), "verified workspace remains call-disabled");
      await page.getByRole("button", { name: "Sign out", exact: true }).click();
      await page.waitForURL("**/auth/sign-in", { timeout: 20_000 });
      await page.goto("http://127.0.0.1:3000/practice");
      await page.waitForURL("**/auth/sign-in", { timeout: 20_000 });
      console.log("PASS: real browser sign-in, SSR-protected workspace, integrated setup, sign-out and denied re-entry.");
    } finally { await browser.close(); }
  } else {
  const [first, second] = clients;
  const publicClient = createClient(url, publishable, options);
  const deniedPublic = await publicClient.rpc("practice_acquire", { p_secret: capability, p_key: randomUUID(), p_fingerprint: "public", p_duration: 180 });
  assert(deniedPublic.error, "unauthenticated RPC rejection");
  const deniedCapability = await first.rpc("practice_acquire", { p_secret: "incorrect-test-capability-value-32", p_key: randomUUID(), p_fingerprint: "wrong-secret", p_duration: 180 });
  assert(deniedCapability.error?.message === "FORBIDDEN", "browser alone cannot mutate trusted metadata");
  const attempts = [{ p_key: randomUUID(), p_fingerprint: "concurrent-a", p_duration: 180 }, { p_key: randomUUID(), p_fingerprint: "concurrent-b", p_duration: 180 }];
  const raced = await Promise.all(attempts.map(args => rpc(first, "practice_acquire", args)));
  assert(raced.filter(result => !result.error && result.data.created).length === 1, "one concurrent acquisition wins");
  assert(raced.filter(result => result.error?.message === "SESSION_ACTIVE").length === 1, "second concurrent acquisition conflicts");
  const winnerIndex = raced.findIndex(result => !result.error), winner = raced[winnerIndex].data.session;
  const replay = await rpc(first, "practice_acquire", attempts[winnerIndex]);
  assert(!replay.error && replay.data.created === false && replay.data.session.id === winner.id, "idempotent HTTP replay");
  const hidden = await second.from("practice_sessions").select("id").eq("id", winner.id);
  assert(!hidden.error && hidden.data.length === 0, "cross-owner REST reads hidden");
  const foreignEnd = await rpc(second, "practice_end", { p_id: winner.id, p_reason: "user" });
  assert(foreignEnd.error?.message === "FORBIDDEN", "cross-owner RPC denied even with server capability");
  const forged = await first.from("practice_sessions").update({ provider_conversation_id: "forged-fixture" }).eq("id", winner.id);
  assert(forged.error, "direct owner metadata writes denied");
  console.log("PASS: real-JWT owner isolation, capability/direct-write rejection, simultaneous lease conflict and idempotency.");
  const ended = await rpc(first, "practice_end", { p_id: winner.id, p_reason: "user" });
  assert(!ended.error && ended.data.status === "ended", "End before provider reply");
  const late = await rpc(first, "practice_bind", { p_id: winner.id, p_provider_id: `fictional-${randomUUID()}` });
  assert(!late.error && late.data.status === "ended", "late binding cannot reactivate");
  const acknowledged = await rpc(first, "practice_connected", { p_id: winner.id });
  assert(acknowledged.error?.message === "SESSION_CLOSED", "late acknowledgement rejection");
  console.log("PASS: terminal state survives late provider association and acknowledgement.");
  }
} finally {
  let cleanupSucceeded = true;
  for (const client of clients) await client.auth.signOut().catch(() => undefined);
  if (fixtures.length) {
    const deleted = await admin.from("practice_sessions").delete().in("owner_id", fixtures);
    cleanupSucceeded = !deleted.error;
    for (const id of fixtures) {
      const result = await admin.auth.admin.deleteUser(id);
      if (result.error) cleanupSucceeded = false;
    }
  }
  if (cleanupSucceeded) { await unlink(ledger).catch(() => undefined); console.log("CLEANUP: all created fixture users and session rows removed."); }
  else { console.error("CLEANUP PENDING: exact fixture IDs retained in ignored artifacts/local/auth-fixtures.json."); process.exitCode = 1; }
}
