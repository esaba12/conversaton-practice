// G5 automated checks, run by auth-database-check.mjs --g5-ui against the running dev server on port 3000.
// Real fixture users and routes; the call provider and the reflection model are never contacted:
// media runs through the development-only test controller and reflect/start/end are browser-intercepted in the UI flows.
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";

const base = "http://127.0.0.1:3000";
const fakeMedia = () => {
  window.__practiceTestMediaController = (onEvent) => {
    const state = window.__testMedia = { ended: 0, muted: false, cameraRequests: [], emit: onEvent };
    return {
      async connect() { onEvent({ type: "remote-stream", stream: new MediaStream() }); onEvent({ type: "ready" }); },
      setMuted(muted) { state.muted = muted; },
      async setCamera(enabled) { state.cameraRequests.push(enabled); return false; },
      async end() { state.ended++; },
    };
  };
};

export async function runG5({ chromium, credentials, clients, rpc, assert }) {
  const browser = await chromium.launch();
  let current = null;
  try {
    const signIn = async ({ email, password }, options = {}) => {
      const context = await browser.newContext(options);
      await context.addInitScript(fakeMedia);
      const page = await context.newPage();
      await page.goto(`${base}/auth/sign-in`);
      await page.getByLabel("Email", { exact: true }).fill(email);
      await page.getByLabel("Password", { exact: true }).fill(password);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.waitForURL("**/practice", { timeout: 20_000 });
      return { context, page, api: context.request };
    };
    const call = async (who, method, path, data) => {
      const response = await who.api.fetch(`${base}${path}`, { method, data, headers: { Origin: base } });
      return { status: response.status(), body: await response.json().catch(() => null) };
    };
    const a = await signIn(credentials[0]), b = await signIn(credentials[1]);

    // --- G4 routes, two signed-in users over HTTP ---
    const acquired = await rpc(clients[0], "practice_acquire", { p_key: randomUUID(), p_fingerprint: "g5-fixture", p_duration: 180 });
    assert(!acquired.error && acquired.data.created, "A holds a connecting fixture session (no provider call)");
    const sessionId = acquired.data.session.id;
    const turns = [{ speaker: "counterpart", text: "Hey, what's up?" }];
    const activeReflect = await call(a, "POST", `/api/sessions/${sessionId}/reflect`, { turns });
    assert(activeReflect.status === 409 && activeReflect.body.code === "SESSION_ACTIVE", `reflect while active is 409 (${activeReflect.status})`);
    const foreignActive = await call(b, "POST", `/api/sessions/${sessionId}/reflect`, { turns });
    assert(foreignActive.status === 404 && foreignActive.body.code === "NOT_FOUND", `B reflecting on A's session is 404 (${foreignActive.status})`);
    const listA = await call(a, "GET", "/api/sessions"), listB = await call(b, "GET", "/api/sessions");
    assert(listA.status === 200 && listA.body.sessions.some(s => s.id === sessionId), "A lists own session");
    assert(listB.status === 200 && listB.body.sessions.length === 0, "B lists none of A's sessions");
    const foreignEnd = await call(b, "POST", `/api/sessions/${sessionId}/end`, { reason: "user" });
    assert(foreignEnd.status >= 400, `B cannot end A's session (${foreignEnd.status})`);
    const ended = await rpc(clients[0], "practice_end", { p_id: sessionId, p_reason: "user" });
    assert(!ended.error && ended.data.status === "ended", "A's fixture session ended without a provider ID");
    const foreignEnded = await call(b, "POST", `/api/sessions/${sessionId}/reflect`, { turns });
    assert(foreignEnded.status === 404, `B reflecting on A's ended session is 404 (${foreignEnded.status})`);
    const silent = await call(a, "POST", `/api/sessions/${sessionId}/reflect`, { turns });
    assert(silent.status === 200 && silent.body.reflection.evidence === "insufficient" && silent.body.reflection.takeaway === null, "no user speech → insufficient, no model call");
    const extra = await call(a, "POST", `/api/sessions/${sessionId}/reflect`, { turns, privateNotes: "g5 private marker" });
    assert(extra.status === 400, "reflect rejects private notes in the body");

    const factA = await call(a, "POST", "/api/about-me", { text: "g5 A fact" });
    const personA = await call(a, "POST", "/api/people", { name: "Alex", relationship: "Your fictional roommate", traits: {}, style: "Friendly.", publicContext: "You share a kitchen.", opening: "Hey!", constraints: [], challenge: "neutral", pace: "patient" });
    const factB = await call(b, "POST", "/api/about-me", { text: "g5 B fact" });
    assert(factA.status === 201 && personA.status === 201 && factB.status === 201, "fixture data created");
    const noPhrase = await call(b, "DELETE", "/api/practice-data", { confirm: "yes" });
    assert(noPhrase.status === 400, "delete-all without the exact phrase is 400");
    const deletedB = await call(b, "DELETE", "/api/practice-data", { confirm: "delete my practice data" });
    assert(deletedB.status === 200 && deletedB.body.deleted.aboutMeFacts === 1 && deletedB.body.deleted.people === 0 && deletedB.body.remaining.aboutMeFacts === 0 && deletedB.body.sessions.total === 0, `B delete-all reports only B's data (${JSON.stringify(deletedB.body?.deleted)})`);
    const stillA = [await call(a, "GET", "/api/about-me"), await call(a, "GET", "/api/people"), await call(a, "GET", "/api/sessions")];
    assert(stillA[0].body.facts.length === 1 && stillA[1].body.people.length === 1 && stillA[2].body.sessions.length === 1, "A's facts, person and session survive B's delete-all");
    console.log("PASS: G4 routes with two signed-in users: reflect 409 while active, 404 cross-owner (active and ended), B lists none of A's sessions, B cannot end A's session, empty transcript → insufficient without a model call, private notes rejected, delete-all needs the phrase and removes only the caller's data with truthful counts.");

    const anon = await browser.newContext();
    const anonCalls = await Promise.all([
      anon.request.fetch(`${base}/api/sessions`), anon.request.fetch(`${base}/api/sessions/${sessionId}/reflect`, { method: "POST", data: { turns }, headers: { Origin: base } }),
      anon.request.fetch(`${base}/api/practice-data`, { method: "DELETE", data: { confirm: "delete my practice data" }, headers: { Origin: base } }),
      anon.request.fetch(`${base}/api/scenarios/draft`, { method: "POST", data: { situation: "x" }, headers: { Origin: base } }),
    ]);
    assert(anonCalls.every(r => r.status() === 401), `signed-out G4/G2 routes are 401 (${anonCalls.map(r => r.status()).join(",")})`);
    const anonPage = await anon.newPage();
    for (const path of ["/practice", "/practice/data", "/practice/about-me"]) {
      await anonPage.goto(`${base}${path}`);
      assert(anonPage.url().includes("/auth/sign-in"), `signed-out ${path} redirects to sign-in`);
    }
    await anon.close();
    console.log("PASS: signed out: GET /api/sessions, reflect, delete-all and draft are 401; /practice, /practice/data, /practice/about-me redirect to sign-in.");

    // --- Workspace flows with the test media controller ---
    const page = current = a.page;
    const fakeId = randomUUID();
    const session = (status, cleanup) => ({ session: { id: fakeId, status, expiresAt: new Date(Date.now() + 600_000).toISOString(), cleanup } });
    const routes = { start: [], end: [], reflect: [], connected: 0, endMode: "ok", connectedMode: "ok" };
    const errorBody = (code, message) => JSON.stringify({ code, message, retryable: false, request_id: randomUUID() });
    const installRoutes = async (target) => {
      await target.route("**/api/sessions", async route => {
        if (route.request().method() !== "POST") return route.continue();
        routes.start.push(route.request().postDataJSON());
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ...session("connecting", "not_started"), credential: { provider: "tavus", roomUrl: "https://fixture.daily.co/g5-test", meetingToken: "g5-test-token", expiresAt: new Date(Date.now() + 600_000).toISOString() } }) });
      });
      await target.route("**/api/sessions/*/connected", async route => {
        routes.connected++;
        if (routes.connectedMode === "expired") await route.fulfill({ status: 409, contentType: "application/json", body: errorBody("SESSION_EXPIRED", "This practice session expired.") });
        else await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(session("active", "not_started")) });
      });
      await target.route("**/api/sessions/*/end", async route => {
        routes.end.push(route.request().postDataJSON().reason);
        if (routes.endMode === "unreachable") await route.abort();
        else await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(session("ended", "confirmed")) });
      });
      await target.route("**/api/sessions/*/reflect", async route => {
        routes.reflect.push(route.request().postDataJSON());
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ reflection: { evidence: "complete", observedAction: "You named the dishes directly.", takeaway: "Being specific helped.", nextStep: "Propose a schedule next time.", supportExit: false } }) });
      });
    };
    await installRoutes(page);
    const notesMarker = "g5 purple umbrella private marker";
    const startExample = async (target) => {
      await target.goto(`${base}/practice`);
      await target.getByLabel(/Private preparation notes/).fill(`I get nervous. ${notesMarker}`);
      await target.getByRole("button", { name: "Use roommate example", exact: true }).click();
      await target.getByRole("button", { name: "Start practice", exact: true }).click();
      await target.getByText("Test media — no live call").waitFor({ timeout: 10_000 });
      await target.getByRole("button", { name: "End practice", exact: true }).waitFor({ timeout: 10_000 });
    };
    const media = (target) => target.evaluate(() => ({ ended: window.__testMedia.ended, cameraRequests: window.__testMedia.cameraRequests }));
    const waitFor = async (predicate, name) => { for (let i = 0; i < 40; i++) { if (await predicate()) return; await page.waitForTimeout(250); } assert(false, name); };

    // 1. End by the user, then reflection with Done.
    await startExample(page);
    await waitFor(async () => routes.connected === 1, "connected acknowledged once");
    await page.getByRole("button", { name: "Turn camera on" }).click();
    await page.evaluate(() => { const emit = window.__testMedia.emit; emit({ type: "utterance", speaker: "counterpart", text: "Hey! What's up?" }); emit({ type: "utterance", speaker: "user", text: "Can we talk about the dishes?" }); });
    await page.getByRole("button", { name: "End practice", exact: true }).click();
    await page.getByRole("button", { name: "Get a short reflection", exact: true }).waitFor({ timeout: 10_000 });
    await waitFor(async () => routes.end.length === 1, "End route called once");
    assert(routes.end[0] === "user" && (await media(page)).ended >= 1, "End releases local media and calls End with reason user");
    assert(JSON.stringify((await media(page)).cameraRequests) === "[true]", "camera toggle went only to the local controller (no route involved)");
    const startBody = routes.start[0];
    assert(Object.keys(startBody).sort().join() === "durationSeconds,idempotencyKey,role" && !JSON.stringify(startBody).includes(notesMarker), "start body has only the role; no private notes");
    await page.getByLabel(/What did you notice/).fill("I was direct.");
    await page.getByRole("button", { name: "Get a short reflection", exact: true }).click();
    await page.getByRole("heading", { name: "Takeaway" }).waitFor({ timeout: 10_000 });
    const reflectBody = routes.reflect[0];
    assert(Object.keys(reflectBody).every(key => ["turns", "goal", "selfReflection"].includes(key)), `reflect body keys are only turns/goal/selfReflection (${Object.keys(reflectBody).join(",")})`);
    assert(reflectBody.turns.length === 2 && reflectBody.turns[1].speaker === "user" && !JSON.stringify(reflectBody).includes(notesMarker), "reflect body carries the captured turns and no private notes");
    await page.getByRole("button", { name: "Done", exact: true }).click();
    assert(await page.getByRole("heading", { name: "Reflect (optional)" }).count() === 0, "Done clears the reflection panel");
    console.log("PASS: workspace (test media): End releases media first and calls End once (user); camera stays with the local controller; start body is role-only; reflect body is only turns/goal/selfReflection without private notes; Done clears the panel.");

    // 2. End with the server unreachable, Retry, then Skip.
    await page.getByRole("button", { name: "Back to setup", exact: true }).click();
    await page.getByRole("button", { name: "Start practice", exact: true }).click();
    await page.getByText("Test media — no live call").waitFor({ timeout: 10_000 });
    await page.getByRole("button", { name: "End practice", exact: true }).waitFor({ timeout: 10_000 });
    routes.endMode = "unreachable";
    await page.getByRole("button", { name: "End practice", exact: true }).click();
    await page.getByText(/couldn’t reach the server/).waitFor({ timeout: 10_000 });
    assert((await media(page)).ended >= 1, "media released even though End was unreachable");
    routes.endMode = "ok";
    await page.getByRole("button", { name: "Retry closing session", exact: true }).click();
    await page.getByText("The call provider confirmed the session is closed.").waitFor({ timeout: 10_000 });
    assert(routes.end.slice(-2).join() === "user,user", "Retry reuses End with the same reason");
    await page.getByRole("button", { name: "Skip", exact: true }).click();
    assert(await page.getByRole("heading", { name: "Reflect (optional)" }).count() === 0, "Skip clears the reflection panel");
    console.log("PASS: End with the server unreachable: media released, truthful message, Retry closing session succeeds; Skip clears the panel.");

    // 3. Expired lease reported by the connected acknowledgement.
    routes.connectedMode = "expired";
    await page.getByRole("button", { name: "Back to setup", exact: true }).click();
    const before = routes.end.length;
    await page.getByRole("button", { name: "Start practice", exact: true }).click();
    await page.getByText(/expired/).first().waitFor({ timeout: 10_000 });
    await waitFor(async () => routes.end.length === before + 1, "End after expiry");
    assert(routes.end.at(-1) === "connection_failure" && (await media(page)).ended >= 1, "SESSION_EXPIRED interrupts, releases media and ends with connection_failure");
    routes.connectedMode = "ok";
    console.log("PASS: lease expiry (connected → 409 SESSION_EXPIRED) interrupts the call, releases media and calls End with connection_failure.");

    // 4. Auto-end at 180 s (fake clock in a second tab of the same signed-in context).
    const timed = await a.context.newPage();
    await timed.clock.install();
    await installRoutes(timed);
    await startExample(timed);
    const beforeTimed = routes.end.length;
    await timed.clock.fastForward(181_000);
    await timed.getByText(/Time’s up/).waitFor({ timeout: 10_000 });
    for (let i = 0; i < 40 && routes.end.length === beforeTimed; i++) await timed.waitForTimeout(250);
    assert(routes.end.at(-1) === "time_limit" && (await media(timed)).ended >= 1, "180 s auto-end releases media and calls End with time_limit");
    await timed.close();
    console.log("PASS: 180 s time limit (fake clock) ends the call, releases media and calls End with time_limit.");

    // 5. Save after End when the people list failed to load: no duplicate same-named person.
    let failPeople = true;
    await page.route("**/api/people", async route => {
      if (route.request().method() === "GET" && failPeople) { failPeople = false; return route.fulfill({ status: 503, contentType: "application/json", body: errorBody("PROVIDER_UNAVAILABLE", "Unavailable") }); }
      return route.continue();
    });
    await startExample(page);
    failPeople = true;
    await page.getByRole("button", { name: "End practice", exact: true }).click();
    const save = page.getByRole("button", { name: "Save this person", exact: true });
    await save.waitFor({ timeout: 10_000 });
    await save.click();
    await page.getByText(/You already saved someone named Alex/).waitFor({ timeout: 10_000 });
    await page.getByRole("button", { name: "Update Alex", exact: true }).click();
    await page.getByText("Updated Alex.").waitFor({ timeout: 10_000 });
    const peopleAfter = (await call(a, "GET", "/api/people")).body.people.filter(p => p.name === "Alex");
    assert(peopleAfter.length === 1, `Save after a failed list load did not duplicate Alex (${peopleAfter.length})`);
    await page.unroute("**/api/people");
    console.log("PASS: Save after End with a failed people list re-checks names, asks before updating the existing Alex, and never duplicates.");

    // 6. Your data labels and Retry cleanup.
    const now = Date.now(), iso = (offset) => new Date(now - offset).toISOString();
    const listed = [["confirmed", 1], ["pending", 2], ["unresolved", 3], ["not_started", 4]].map(([cleanup, i]) => ({ id: randomUUID(), status: "ended", cleanup, createdAt: iso(i * 60_000), endedAt: iso(i * 60_000 - 30_000) }));
    const dataPage = await a.context.newPage();
    await dataPage.route("**/api/sessions", async route => {
      if (route.request().method() !== "GET") return route.continue();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ sessions: listed }) });
    });
    let retried = null;
    await dataPage.route("**/api/sessions/*/end", async route => { retried = route.request().url().split("/").at(-2); await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ session: { id: retried, status: "ended", expiresAt: iso(-600_000), cleanup: "confirmed" } }) }); });
    await dataPage.goto(`${base}/practice/data`);
    for (const label of ["Deleted at provider", "Provider cleanup pending", "Provider cleanup not confirmed", "No provider call"]) await dataPage.getByText(label, { exact: true }).first().waitFor({ timeout: 10_000 });
    const retryButtons = dataPage.getByRole("button", { name: /^Retry provider cleanup for the session started/ });
    assert(await retryButtons.count() === 2, "Retry offered only for pending and unresolved");
    await retryButtons.first().click();
    await waitFor(async () => retried !== null, "Retry cleanup calls End");
    assert(retried === listed[1].id, "Retry cleanup calls End for that session");
    await dataPage.screenshot({ path: "artifacts/local/g5-data-labels.png", fullPage: true });
    await dataPage.close();
    console.log("PASS: Your data shows all four cleanup labels, offers Retry only for pending/unresolved, and Retry calls End for that session.");

    // 7. Sharing by mouse click.
    const personId = personA.body.person.id;
    await page.goto(`${base}/practice/people/${personId}`);
    const knows = page.getByRole("region", { name: "Knows about Alex" });
    await page.getByRole("button", { name: "Share with Alex: g5 A fact" }).click();
    await knows.getByRole("button", { name: "Stop sharing with Alex: g5 A fact" }).waitFor({ timeout: 10_000 });
    let shared;
    for (let i = 0; i < 20; i++) { shared = (await call(a, "GET", `/api/people/${personId}`)).body.person.sharedFactIds; if (shared.length === 1) break; await page.waitForTimeout(250); }
    assert(shared.length === 1 && shared[0] === factA.body.fact.id, "click sharing stored the fact");
    console.log("PASS: sharing by mouse click moves the fact and stores it.");

    // 8. Mobile layouts.
    await mkdir("artifacts/local", { recursive: true });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      for (const [name, path] of [["practice", "/practice"], ["person", `/practice/people/${personId}`], ["about-me", "/practice/about-me"], ["data", "/practice/data"]]) {
        await page.goto(`${base}${path}`);
        await page.waitForLoadState("networkidle").catch(() => undefined);
        await page.waitForTimeout(500);
        const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
        if (width === 390) await page.screenshot({ path: `artifacts/local/g5-${name}-390.png`, fullPage: true });
        assert(fits, `${path} has no horizontal scroll at ${width}px`);
      }
    }
    console.log("PASS: /practice, a person page, About me and Your data fit 390 px and 320 px without horizontal scroll (390 px screenshots in artifacts/local/).");

    // 9. Sign-out during a call (last: it revokes this user's sessions).
    await page.setViewportSize({ width: 1280, height: 900 });
    await startExample(page);
    const beforeSignOut = routes.end.length;
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL("**/auth/sign-in", { timeout: 20_000 });
    assert(routes.end.length === beforeSignOut + 1 && routes.end.at(-1) === "auth_loss", `sign-out mid-call calls End with auth_loss (${routes.end.slice(beforeSignOut).join(",")})`);
    await page.goto(`${base}/practice`);
    assert(page.url().includes("/auth/sign-in"), "re-entry denied after sign-out");
    const text = await page.locator("body").innerText();
    assert(!text.includes(notesMarker), "private notes not shown after sign-out");
    console.log("PASS: sign-out during a call ends the session with auth_loss, routes to sign-in, denies re-entry and shows no private notes.");
  } catch (error) {
    await current?.screenshot({ path: "artifacts/local/g5-failure.png", fullPage: true }).catch(() => undefined);
    throw error;
  } finally { await browser.close(); }
}
