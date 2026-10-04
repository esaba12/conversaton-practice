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
  if (process.argv.includes("--g3")) {
    const [first, second] = clients;
    const marker = { shared: "g3 shared fixture fact", unshared: "g3 unshared fixture fact", prep: "g3 private prep fixture" };
    const person = { p_name: "Dana", p_relationship: "Your fictional manager", p_traits: { formality: "formal" }, p_style: "Calm.", p_public_context: "You manage a small team.", p_opening: "Hi, you wanted to talk?", p_constraints: [], p_challenge: "neutral", p_pace: "patient" };
    const shared = await first.rpc("about_me_create", { p_text: marker.shared });
    const unshared = await first.rpc("about_me_create", { p_text: marker.unshared });
    const prep = await first.rpc("private_prep_put", { p_notes: marker.prep });
    const dana = await first.rpc("person_create", person);
    assert(!shared.error && !unshared.error && !prep.error && !dana.error && dana.data.version === 1, "owner A creates facts, private prep and a person");
    const linked = await first.rpc("person_set_shared_facts", { p_id: dana.data.id, p_expected_version: 1, p_fact_ids: [shared.data.id] });
    assert(!linked.error && linked.data.version === 2, "owner A shares one fact");
    const context = await first.rpc("person_context", { p_id: dana.data.id, p_expected_version: 2 });
    const contextText = JSON.stringify(context.data);
    assert(!context.error && contextText.includes(marker.shared) && !contextText.includes(marker.unshared) && !contextText.includes(marker.prep), "context holds only the shared fact");
    const stale = await first.rpc("person_update", { p_id: dana.data.id, p_expected_version: 1, ...person, p_name: "Stale" });
    const after = await first.from("people").select("name, version").eq("id", dana.data.id).single();
    assert(stale.error?.message === "VERSION_CONFLICT" && after.data?.name === "Dana" && after.data.version === 2, "stale version rejected without partial write");
    for (const table of ["people", "about_me_facts", "person_shared_facts", "private_prep"]) {
      const read = await second.from(table).select("*");
      assert(!read.error && read.data.length === 0, `owner B cannot list ${table}`);
    }
    const foreignContext = await second.rpc("person_context", { p_id: dana.data.id, p_expected_version: 2 });
    const foreignEdit = await second.rpc("person_update", { p_id: dana.data.id, p_expected_version: 2, ...person, p_name: "Hijack" });
    const foreignShare = await second.rpc("person_set_shared_facts", { p_id: dana.data.id, p_expected_version: 2, p_fact_ids: [] });
    const foreignDelete = await second.rpc("person_delete", { p_id: dana.data.id });
    assert([foreignContext, foreignEdit, foreignShare, foreignDelete].every(result => result.error?.message === "NOT_FOUND"), "owner B cannot read context, edit, share into or delete A's person");
    const own = await second.rpc("person_create", { ...person, p_name: "Sam" });
    const crossShare = await second.rpc("person_set_shared_facts", { p_id: own.data?.id, p_expected_version: 1, p_fact_ids: [shared.data.id] });
    assert(!own.error && crossShare.error?.message === "INVALID_INPUT", "owner B cannot share A's fact into B's person");
    const direct = await first.from("person_shared_facts").insert({ owner_id: fixtures[0], person_id: dana.data.id, fact_id: unshared.data.id });
    assert(direct.error, "direct sharing writes denied");
    console.log("PASS: G3 real-JWT owner isolation, cross-owner sharing denied, stale version conflict, private prep and unshared facts absent from context.");
  } else if (process.argv.includes("--g3-ui")) {
    // Two signed-in browser sessions against the running app's routes. Only starts that fail before any provider call are attempted.
    const { chromium } = await import("@playwright/test");
    const browser = await chromium.launch();
    const base = "http://127.0.0.1:3000";
    try {
      const signIn = async ({ email, password }) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(`${base}/auth/sign-in`);
        await page.getByLabel("Email", { exact: true }).fill(email);
        await page.getByLabel("Password", { exact: true }).fill(password);
        await page.getByRole("button", { name: "Sign in", exact: true }).click();
        await page.waitForURL("**/practice", { timeout: 20_000 });
        return { context, page, api: context.request };
      };
      const a = await signIn(credentials[0]), b = await signIn(credentials[1]);
      const call = async (who, method, path, data) => {
        const response = await who.api.fetch(`${base}${path}`, { method, data, headers: { Origin: base } });
        return { status: response.status(), body: await response.json().catch(() => null) };
      };
      const fields = { name: "Dana", relationship: "Your fictional manager", traits: { formality: "formal" }, style: "Calm, asks clarifying questions.", publicContext: "You manage a small team.", opening: "Hi, you wanted to talk?", constraints: [], challenge: "neutral", pace: "patient" };
      const shared = await call(a, "POST", "/api/about-me", { text: "g3 shared fixture fact" });
      const unshared = await call(a, "POST", "/api/about-me", { text: "g3 unshared fixture fact" });
      const prep = await call(a, "PUT", "/api/private-prep", { notes: "g3 private prep fixture" });
      const created = await call(a, "POST", "/api/people", fields);
      assert(shared.status === 201 && unshared.status === 201 && prep.status === 200 && created.status === 201 && created.body.person.version === 1, "A creates facts, prep and person over HTTP");
      const id = created.body.person.id;
      const linked = await call(a, "PUT", `/api/people/${id}/shared-facts`, { factIds: [shared.body.fact.id], expectedVersion: 1 });
      assert(linked.status === 200 && linked.body.person.version === 2 && linked.body.person.sharedFactIds.join() === shared.body.fact.id, "A shares exactly one fact");
      const prepShare = await call(a, "PUT", `/api/people/${id}/shared-facts`, { factIds: [shared.body.fact.id], privatePrep: "g3 private prep fixture", expectedVersion: 2 });
      assert(prepShare.status === 400, "private prep cannot be sent to the sharing route");
      const stale = await call(a, "PATCH", `/api/people/${id}`, { ...fields, name: "Stale", expectedVersion: 1 });
      const fresh = await call(a, "GET", `/api/people/${id}`);
      assert(stale.status === 409 && stale.body.code === "VERSION_CONFLICT" && fresh.body.person.name === "Dana" && fresh.body.person.version === 2, "stale PATCH 409 without partial write");
      const staleStart = await call(a, "POST", "/api/sessions", { idempotencyKey: randomUUID(), personId: id, expectedVersion: 1, durationSeconds: 180 });
      assert(staleStart.status === 409 && staleStart.body.code === "VERSION_CONFLICT", "stale saved-person start 409 before any provider call");
      const leakStart = await call(a, "POST", "/api/sessions", { idempotencyKey: randomUUID(), personId: id, expectedVersion: 2, durationSeconds: 180, knownAboutUser: ["g3 unshared fixture fact"] });
      assert(leakStart.status === 400, "client cannot add facts to a saved-person start");
      const lists = await Promise.all(["/api/people", "/api/about-me", "/api/private-prep"].map(path => call(b, "GET", path)));
      assert(lists[0].body.people.length === 0 && lists[1].body.facts.length === 0 && lists[2].body.privatePrep.notes === "", "B lists none of A's people, facts or prep");
      const foreign = [
        await call(b, "GET", `/api/people/${id}`),
        await call(b, "PATCH", `/api/people/${id}`, { ...fields, name: "Hijack", expectedVersion: 2 }),
        await call(b, "PUT", `/api/people/${id}/shared-facts`, { factIds: [], expectedVersion: 2 }),
        await call(b, "DELETE", `/api/people/${id}`),
        await call(b, "PATCH", `/api/about-me/${shared.body.fact.id}`, { text: "hijack" }),
        await call(b, "DELETE", `/api/about-me/${unshared.body.fact.id}`),
        await call(b, "POST", "/api/sessions", { idempotencyKey: randomUUID(), personId: id, expectedVersion: 2, durationSeconds: 180 }),
      ];
      assert(foreign.every(result => result.status === 404 && result.body.code === "NOT_FOUND"), `B gets 404 for A's records and start (${foreign.map(r => r.status).join(",")})`);
      const own = await call(b, "POST", "/api/people", { ...fields, name: "Sam" });
      const cross = await call(b, "PUT", `/api/people/${own.body.person.id}/shared-facts`, { factIds: [shared.body.fact.id], expectedVersion: 1 });
      assert(cross.status === 400, "B cannot share A's fact into B's person");
      const after = await call(a, "GET", `/api/people/${id}`);
      assert(after.body.person.name === "Dana" && after.body.person.version === 2, "A's person unchanged by B");
      console.log("PASS: G3 two signed-in browser sessions over app routes: owner isolation (404), cross-owner sharing denied, stale version 409, private prep not shareable, saved-person start rejects stale/foreign/extra fields before any provider call.");

      // UI: About me, keyboard and drag-and-drop sharing, chip edit, Never shared, saved-person start body, B's view.
      const page = a.page;
      await page.goto(`${base}/practice/about-me`);
      await page.getByLabel("New fact about you").fill("g3 keyboard fixture fact");
      await page.getByRole("button", { name: "Add fact", exact: true }).click();
      await page.getByText("g3 keyboard fixture fact").first().waitFor({ timeout: 10_000 });
      await page.goto(`${base}/practice/people/${id}`);
      const knows = page.getByRole("region", { name: "Knows about Dana" }), about = page.getByRole("region", { name: "About me", exact: true });
      await knows.getByRole("button", { name: "Stop sharing with Dana: g3 shared fixture fact" }).waitFor({ timeout: 15_000 });
      await page.getByRole("button", { name: "Share with Dana: g3 keyboard fixture fact" }).focus();
      await page.keyboard.press("Enter");
      await knows.getByRole("button", { name: "Stop sharing with Dana: g3 keyboard fixture fact" }).waitFor({ timeout: 10_000 });
      await page.getByRole("button", { name: "Share with Dana: g3 unshared fixture fact" }).dragTo(knows);
      await knows.getByRole("button", { name: "Stop sharing with Dana: g3 unshared fixture fact" }).waitFor({ timeout: 10_000 });
      await knows.getByRole("button", { name: "Stop sharing with Dana: g3 unshared fixture fact" }).dragTo(about);
      await about.getByRole("button", { name: "Share with Dana: g3 unshared fixture fact" }).waitFor({ timeout: 10_000 });
      const notes = page.getByLabel("Private preparation notes");
      assert((await notes.inputValue()).includes("g3 private prep fixture"), "private prep shown in its own section");
      assert(await page.getByRole("button", { name: /g3 private prep fixture/ }).count() === 0 && await page.locator("[draggable=true]", { hasText: "g3 private prep fixture" }).count() === 0, "private prep is not a chip or draggable");
      await page.getByRole("group", { name: "Formality" }).getByRole("button", { name: "Casual", exact: true }).click();
      await page.getByRole("button", { name: "Save", exact: true }).click();
      let stored;
      for (let tries = 0; tries < 20; tries++) {
        stored = (await call(a, "GET", `/api/people/${id}`)).body.person;
        if (stored.traits.formality === "casual") break;
        await page.waitForTimeout(500);
      }
      await page.getByRole("button", { name: "Save", exact: true }).waitFor({ timeout: 10_000 });
      await mkdir("artifacts/local", { recursive: true });
      await page.screenshot({ path: "artifacts/local/g3-person.png", fullPage: true });
      const facts = (await call(a, "GET", "/api/about-me")).body.facts;
      const textOf = new Map(facts.map(fact => [fact.id, fact.text]));
      const sharedTexts = stored.sharedFactIds.map(factId => textOf.get(factId)).sort().join("|");
      assert(sharedTexts === "g3 keyboard fixture fact|g3 shared fixture fact", `UI sharing stored exactly the chosen facts (${sharedTexts})`);
      assert(stored.traits.formality === "casual" && stored.version > 2, "chip edit saved with a version bump");
      console.log("PASS: UI About me add, keyboard share (Enter), drag-and-drop share and unshare, chip edit + Save; Never shared notes are not chips or draggable.");
      let startBody;
      await page.route("**/api/sessions", async route => { startBody = route.request().postDataJSON(); await route.abort(); });
      await page.goto(`${base}/practice?person=${id}`);
      await page.getByRole("button", { name: "Start practice", exact: true }).click();
      await page.waitForTimeout(1500);
      await page.unroute("**/api/sessions");
      assert(startBody && Object.keys(startBody).sort().join() === "durationSeconds,expectedVersion,idempotencyKey,personId" && startBody.personId === id && startBody.expectedVersion === stored.version, "saved-person start sends only ID and current version");
      assert(!JSON.stringify(startBody).includes("g3 "), "no fact or prep text in the start body");
      await b.page.goto(`${base}/practice/people/${id}`);
      await b.page.waitForTimeout(2500);
      const bText = await b.page.locator("body").innerText();
      assert(!bText.includes("g3 shared fixture fact") && !bText.includes("g3 private prep fixture") && !bText.includes("You manage a small team."), "B's browser shows none of A's person, facts or prep");
      await b.page.screenshot({ path: "artifacts/local/g3-foreign.png", fullPage: true });
      console.log("PASS: UI saved-person start body is {durationSeconds, expectedVersion, idempotencyKey, personId} (browser-intercepted, no provider call); B's person page shows none of A's data.");
    } finally { await browser.close(); }
  } else if (process.argv.includes("--g5-ui")) {
    const { chromium } = await import("@playwright/test");
    const { runG5 } = await import("./g5-checks.mjs");
    await mkdir("artifacts/local", { recursive: true });
    await runG5({ chromium, credentials, clients, rpc, assert });
  } else if (process.argv.includes("--ui-only")) {
    const { chromium } = await import("@playwright/test");
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.goto("http://127.0.0.1:3000/auth/sign-in");
      await page.getByLabel("Email", { exact: true }).fill(credentials[0].email);
      await page.getByLabel("Password", { exact: true }).fill(credentials[0].password);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.waitForURL("**/practice", { timeout: 20_000 });
      // G2 setup flow with draft and start intercepted in the browser: no model or call-provider requests.
      const marker = "purple umbrella private marker";
      const draftRole = { name: "Jordan", role: "Your fictional shift lead", style: "Brisk but fair.", publicContext: "You schedule weekend shifts at a cafe.", opening: "Hey, got a minute? I'm finishing the schedule.", constraints: ["Has five minutes."], challenge: "neutral", pace: "conversational" };
      let draftBody, startBody;
      await page.route("**/api/scenarios/draft", async route => { draftBody = route.request().postDataJSON(); await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ role: draftRole, goal: "Ask to swap one Saturday shift.", assumptions: ["You work at the same cafe."] }) }); });
      await page.route("**/api/sessions", async route => { startBody = route.request().postDataJSON(); await route.abort(); });
      await page.getByLabel("The situation").fill("I want to ask my fictional shift lead to swap one Saturday shift.");
      await page.getByLabel(/Private preparation notes/).fill(`I get nervous. ${marker}`);
      await page.getByRole("button", { name: "Generate setup", exact: true }).click();
      await page.getByLabel("Name", { exact: true }).waitFor({ timeout: 10_000 });
      assert(draftBody?.privateNotes?.includes(marker), "private notes sent only to draft generation");
      assert(await page.getByLabel("Name", { exact: true }).inputValue() === "Jordan", "generated draft shown for review");
      await page.getByLabel("Name", { exact: true }).fill("Riley");
      await mkdir("artifacts/local", { recursive: true });
      await page.screenshot({ path: "artifacts/local/g2-review.png", fullPage: true });
      await page.getByRole("button", { name: "Start practice", exact: true }).click();
      await page.waitForFunction(() => document.body.innerText.includes("couldn"), null, { timeout: 10_000 }).catch(() => undefined);
      assert(startBody && startBody.role?.name === "Riley", "start carries the edited role");
      assert(Object.keys(startBody).sort().join() === "durationSeconds,idempotencyKey,role", "start body has only allowlisted keys");
      assert(!JSON.stringify(startBody).includes(marker) && !JSON.stringify(startBody).includes("Saturday shift."), "private notes and goal absent from start");
      await page.unroute("**/api/sessions");
      await page.unroute("**/api/scenarios/draft");
      console.log("PASS: signed-in describe → generated draft (browser-mocked) → edit → start body contains only the edited role.");
      await page.getByRole("button", { name: "Sign out", exact: true }).click();
      await page.waitForURL("**/auth/sign-in", { timeout: 20_000 });
      await page.goto("http://127.0.0.1:3000/practice");
      await page.waitForURL("**/auth/sign-in", { timeout: 20_000 });
      console.log("PASS: real browser sign-in, SSR-protected workspace, sign-out and denied re-entry.");
    } finally { await browser.close(); }
  } else {
  const [first, second] = clients;
  const publicClient = createClient(url, publishable, options);
  const deniedPublic = await publicClient.rpc("practice_acquire", { p_secret: capability, p_key: randomUUID(), p_fingerprint: "public", p_duration: 180, p_person_id: null, p_person_version: null });
  assert(deniedPublic.error, "unauthenticated RPC rejection");
  const deniedCapability = await first.rpc("practice_acquire", { p_secret: "incorrect-test-capability-value-32", p_key: randomUUID(), p_fingerprint: "wrong-secret", p_duration: 180, p_person_id: null, p_person_version: null });
  assert(deniedCapability.error?.message === "FORBIDDEN", "browser alone cannot mutate trusted metadata");
  const attempts = [{ p_key: randomUUID(), p_fingerprint: "concurrent-a", p_duration: 180, p_person_id: null, p_person_version: null }, { p_key: randomUUID(), p_fingerprint: "concurrent-b", p_duration: 180, p_person_id: null, p_person_version: null }];
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
    // People, facts, links and private prep cascade with the user; delete explicitly so a failure is visible.
    for (const table of ["person_shared_facts", "people", "about_me_facts", "private_prep"]) {
      const removed = await admin.from(table).delete().in("owner_id", fixtures);
      if (removed.error) cleanupSucceeded = false;
    }
    for (const id of fixtures) {
      const result = await admin.auth.admin.deleteUser(id);
      if (result.error) cleanupSucceeded = false;
    }
  }
  if (cleanupSucceeded) { await unlink(ledger).catch(() => undefined); console.log("CLEANUP: all created fixture users and session rows removed."); }
  else { console.error("CLEANUP PENDING: exact fixture IDs retained in ignored artifacts/local/auth-fixtures.json."); process.exitCode = 1; }
}
