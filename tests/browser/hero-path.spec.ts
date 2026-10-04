import { existsSync } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

// Hero path on real Auth and database with test media and a faked provider start:
// lobby → briefing → Meet → green room → Show me first → stand-in call → End → Your turn → green room →
// ringing (cancel) → green room → call → End → recap, checking microphone release at every stage.
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in this process; skipped otherwise (CI has neither).
// Creates and deletes one fictional user. No live provider call is made: this is not live verification.

if (existsSync(".env.local") && !process.env.NEXT_PUBLIC_SUPABASE_URL) process.loadEnvFile(".env.local");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOAL = "GOAL-MARKER move one project";

test.use({
  permissions: ["microphone", "camera"],
  viewport: { width: 1280, height: 900 },
  launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] },
});

test.describe("hero path", () => {
  test.skip(!url || !serviceKey, "needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  test.setTimeout(120_000);

  let admin: SupabaseClient;
  let userId = "";
  const email = `hero-path-${randomUUID()}@example.invalid`;
  const password = randomBytes(24).toString("hex");

  test.beforeAll(async () => {
    admin = createClient(url!, serviceKey!, { auth: { autoRefreshToken: false, persistSession: false } });
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw new Error("could not create the test user");
    userId = created.data.user.id;
  });

  test.afterAll(async () => {
    if (!userId) return;
    await admin.from("practice_sessions").delete().eq("owner_id", userId);
    await admin.auth.admin.deleteUser(userId);
  });

  test("lobby to recap with teardown at every stage", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message.slice(0, 200)));
    page.on("console", (message) => { if (message.type() === "error" && !/Failed to load resource/.test(message.text())) errors.push(message.text().slice(0, 200)); });

    await page.addInitScript(() => {
      const w = window as unknown as Record<string, unknown>;
      const opened: MediaStreamTrack[] = [];
      w.__tracks = opened;
      w.__holdReady = false;
      const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (constraints) => { const stream = await original(constraints); opened.push(...stream.getTracks()); return stream; };
      w.__practiceTestMediaController = (onEvent: (event: unknown) => void) => {
        let stream: MediaStream | null = null;
        return {
          async connect() {
            const canvas = document.createElement("canvas");
            canvas.width = 64; canvas.height = 64;
            stream = canvas.captureStream(5);
            onEvent({ type: "remote-stream", stream });
            if (w.__holdReady) return;
            setTimeout(() => { onEvent({ type: "ready" }); onEvent({ type: "utterance", speaker: "counterpart", text: "HERO-TURN I need to move the Atlas report." }); }, 300);
          },
          setMuted() {},
          async setCamera() { return false; },
          send() { return true; },
          async end() { stream?.getTracks().forEach((track) => track.stop()); onEvent({ type: "remote-stream", stream: null }); },
        };
      };
    });

    const startBodies: Record<string, unknown>[] = [];
    let ends = 0;
    let reflects = 0;
    const sessionId = randomUUID();
    const sessionBody = (status: string) => JSON.stringify({ session: { id: sessionId, status, expiresAt: new Date(Date.now() + 600_000).toISOString(), cleanup: status === "ended" ? "confirmed" : "not_started" } });
    await page.route("**/api/sessions", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      startBodies.push(JSON.parse(route.request().postData() ?? "{}"));
      const expiresAt = new Date(Date.now() + 600_000).toISOString();
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ session: { id: sessionId, status: "connecting", expiresAt, cleanup: "not_started" }, credential: { provider: "tavus", roomUrl: "https://hero.daily.co/room", meetingToken: "fake", expiresAt } }) });
    });
    await page.route("**/api/sessions/*/connected", (route) => route.fulfill({ status: 200, contentType: "application/json", body: sessionBody("active") }));
    await page.route("**/api/sessions/*/end", (route) => { ends++; return route.fulfill({ status: 200, contentType: "application/json", body: sessionBody("ended") }); });
    await page.route("**/api/sessions/*/reflect", (route) => { reflects++; return route.abort(); });

    const liveAudio = () => page.evaluate(() => ((window as unknown as { __tracks: MediaStreamTrack[] }).__tracks).filter((t) => t.kind === "audio" && t.readyState === "live").length);
    const opened = () => page.evaluate(() => (window as unknown as { __tracks: MediaStreamTrack[] }).__tracks.length);
    const allowMic = async (p: Page) => {
      await p.getByRole("button", { name: "Allow microphone" }).click();
      await expect.poll(liveAudio).toBeGreaterThan(0);
    };
    const backToMeet = () => page.getByRole("button", { name: /Back to .*card/ });

    // Lobby and briefing: no media.
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Who do you want to practice with?" })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Practice with Jordan" }).click();
    await expect(page.getByRole("heading", { name: /What.s going on with/ })).toBeVisible();
    await page.getByLabel(/What do you want to do/).fill(GOAL);
    expect(await opened()).toBe(0);

    // Meet: the offer, still no media.
    await page.getByRole("button", { name: "Set up the scene" }).click();
    const showMe = page.getByRole("button", { name: "Show me first" }).first();
    await expect(showMe).toBeEnabled({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Skip to my turn" })).toBeVisible();
    expect(await opened()).toBe(0);

    // Green room (stand-in): Back with a live microphone releases it, and no start is sent.
    await showMe.click();
    await expect(page.getByText(/First, a stand-in plays you/)).toBeVisible();
    await allowMic(page);
    await backToMeet().click();
    await expect.poll(liveAudio).toBe(0);
    expect(startBodies).toHaveLength(0);

    // Stand-in call: only the stand-in body carries the goal.
    await page.getByRole("button", { name: "Show me first" }).first().click();
    await allowMic(page);
    await page.getByRole("button", { name: "I’m ready" }).click();
    await expect(page.getByRole("heading", { name: /You.re playing Jordan/ })).toBeVisible({ timeout: 10_000 });
    expect(Object.keys(startBodies[0]).sort()).toEqual(["durationSeconds", "goal", "idempotencyKey", "preset", "standIn"]);
    await expect(page.getByText("HERO-TURN", { exact: false })).toBeVisible();

    // End → Your turn: stand-in turns dropped, no reflection, session ended, microphone released.
    await page.getByRole("button", { name: "End practice", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Your turn/ })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("HERO-TURN", { exact: false })).toHaveCount(0);
    expect(ends).toBe(1);
    expect(reflects).toBe(0);
    await expect.poll(liveAudio).toBe(0);

    // Your turn → green room → ringing: Cancel releases the microphone and ends the session.
    await page.evaluate(() => { (window as unknown as { __holdReady: boolean }).__holdReady = true; });
    await page.getByRole("button", { name: "Call Jordan" }).click();
    await expect(page.getByText(/First, a stand-in plays you/)).toHaveCount(0);
    await allowMic(page);
    await page.getByRole("button", { name: "I’m ready" }).click();
    await page.getByRole("button", { name: "Cancel call" }).click();
    await expect(page.getByRole("button", { name: "Call Jordan" }).first()).toBeVisible();
    await expect.poll(liveAudio).toBe(0);
    expect(ends).toBe(2);
    expect(await page.getByRole("button", { name: "Show me first" }).count()).toBe(0);

    // Own call: preset only, no private goal.
    await page.evaluate(() => { (window as unknown as { __holdReady: boolean }).__holdReady = false; });
    await page.getByRole("button", { name: "Call Jordan" }).first().click();
    await allowMic(page);
    await page.getByRole("button", { name: "I’m ready" }).click();
    await expect(page.getByRole("heading", { name: /Call with Jordan/ })).toBeVisible({ timeout: 10_000 });
    for (const body of startBodies.slice(1)) {
      expect(Object.keys(body).sort()).toEqual(["durationSeconds", "idempotencyKey", "preset"]);
    }
    expect(JSON.stringify(startBodies.slice(1))).not.toContain("GOAL-MARKER");

    // End → recap: session ended, microphone released.
    await page.getByRole("button", { name: "End practice", exact: true }).click();
    await expect(page.getByRole("button", { name: "Back to setup" })).toBeVisible({ timeout: 10_000 });
    expect(ends).toBe(3);
    await expect.poll(liveAudio).toBe(0);
    expect(errors).toEqual([]);
  });
});
