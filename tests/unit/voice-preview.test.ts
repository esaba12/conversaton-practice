import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError, errorSchema } from "@/lib/schemas/errors";
import { VOICE_PREVIEW_RATE_LIMIT } from "@/lib/schemas/voice-preview";

const identity = vi.hoisted(() => ({ requireIdentity: vi.fn() }));
vi.mock("@/lib/auth/server", () => identity);
import { POST } from "@/app/api/voice-preview/route";
import { HEAR_UNAVAILABLE_REASON, HearButton, HearButtonView } from "@/components/practice/hear-button";
import { fetchVoicePreview, VoicePreviewError } from "@/lib/voice-preview/client";
import { resetVoicePreviewLimitsForTests } from "@/lib/voice-preview/server";

const owner = "11111111-1111-4111-8111-111111111111";
const OPENING = "OPENING-SENTINEL Hey, do you have a minute?";
const DEFAULT_VOICE = "default-voice-0000000001";
const MANAGER_VOICE = "manager-voice-0000000002";

function provider(...responses: Array<() => Promise<Response> | Response>) {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => { const next = responses.shift(); if (!next) throw new Error("unexpected provider call"); return next(); });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
const mp3 = () => new Response(new Uint8Array([0xff, 0xfb, 0x90, 0x00]), { headers: { "Content-Type": "audio/mpeg" } });
const preview = (value: unknown, headers: Record<string, string> = {}) => POST(new Request("http://127.0.0.1:3000/api/voice-preview", { method: "POST", headers, body: typeof value === "string" ? value : JSON.stringify(value) }));
async function errorOf(response: Response, status: number) {
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("no-store");
  return errorSchema.parse(await response.json());
}

beforeEach(() => {
  resetVoicePreviewLimitsForTests();
  vi.stubEnv("ELEVENLABS_API_KEY", "unit-eleven-key");
  vi.stubEnv("ELEVENLABS_VOICE_ID", DEFAULT_VOICE);
  vi.stubEnv("ELEVENLABS_STARTER_MANAGER_VOICE_ID", MANAGER_VOICE);
  vi.stubEnv("ELEVENLABS_STARTER_ROOMMATE_VOICE_ID", "");
  vi.stubEnv("ELEVENLABS_PREVIEW_TTS_MODEL", "");
  identity.requireIdentity.mockReset();
  identity.requireIdentity.mockResolvedValue({ client: {}, identity: { id: owner, isAnonymous: false } });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe("POST /api/voice-preview", () => {
  it("returns 401 signed out without calling the provider", async () => {
    identity.requireIdentity.mockRejectedValue(new AppError("UNAUTHENTICATED", "Sign in to continue.", 401));
    const fetchMock = provider();
    expect((await errorOf(await preview({ text: OPENING }), 401)).code).toBe("UNAUTHENTICATED");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["over 300 characters", { text: "x".repeat(301) }],
    ["empty text", { text: "   " }],
    ["an unknown preset", { text: OPENING, presetId: "dentist" }],
    ["a voice id from the client", { text: OPENING, voiceId: "attacker-voice" }],
    ["a goal field", { text: OPENING, goal: "GOAL" }],
    ["malformed JSON", "{"],
  ])("returns 400 for %s", async (_label, value) => {
    const fetchMock = provider();
    expect((await errorOf(await preview(value), 400)).code).toBe("VALIDATION_ERROR");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts exactly 300 characters", async () => {
    provider(mp3);
    expect((await preview({ text: "x".repeat(300) })).status).toBe(200);
  });

  it("returns 503 NOT_CONFIGURED without a key or voice, without spending the limit", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "");
    const fetchMock = provider();
    for (let i = 0; i < VOICE_PREVIEW_RATE_LIMIT.max + 1; i++) expect((await errorOf(await preview({ text: OPENING }), 503)).code).toBe("NOT_CONFIGURED");
    vi.stubEnv("ELEVENLABS_API_KEY", "unit-eleven-key"); vi.stubEnv("ELEVENLABS_VOICE_ID", "");
    expect((await errorOf(await preview({ text: OPENING, presetId: "roommate" }), 503)).code).toBe("NOT_CONFIGURED");
    expect(fetchMock).not.toHaveBeenCalled();
    vi.stubEnv("ELEVENLABS_VOICE_ID", DEFAULT_VOICE);
    provider(mp3);
    expect((await preview({ text: OPENING })).status).toBe(200);
  });

  it("streams audio/mpeg with no-store from the ElevenLabs stream endpoint, using the default voice and model", async () => {
    const fetchMock = provider(mp3);
    const response = await preview({ text: OPENING });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("audio/mpeg");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([0xff, 0xfb, 0x90, 0x00]));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://api.elevenlabs.io/v1/text-to-speech/${DEFAULT_VOICE}/stream?output_format=mp3_44100_128`);
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>)["xi-api-key"]).toBe("unit-eleven-key");
    expect(JSON.parse(String(init?.body))).toEqual({ text: OPENING, model_id: "eleven_v4_turbo" });
  });

  it("maps a starter preset to its voice, never borrows the default for a starter, and honors the model env", async () => {
    vi.stubEnv("ELEVENLABS_PREVIEW_TTS_MODEL", "configured-model");
    const fetchMock = provider(mp3, mp3);
    await preview({ text: OPENING, presetId: "manager" });
    const unset = await preview({ text: OPENING, presetId: "roommate" });
    await preview({ text: OPENING });
    expect(fetchMock.mock.calls[0][0]).toContain(`/text-to-speech/${MANAGER_VOICE}/stream`);
    expect(unset.status).toBe(503);
    expect(JSON.parse(await unset.text()).code).toBe("NOT_CONFIGURED");
    expect(fetchMock.mock.calls[1][0]).toContain(`/text-to-speech/${DEFAULT_VOICE}/stream`);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).model_id).toBe("configured-model");
  });

  it("never returns a voice id or the key in headers or errors", async () => {
    provider(mp3, () => new Response(`bad voice ${MANAGER_VOICE}`, { status: 401 }));
    const okResponse = await preview({ text: OPENING, presetId: "manager" });
    const headers = JSON.stringify([...okResponse.headers.entries()]);
    expect(headers).not.toContain(MANAGER_VOICE);
    const failed = await preview({ text: OPENING, presetId: "manager" });
    const text = await failed.text();
    expect(failed.status).toBe(503);
    expect(text).not.toContain(MANAGER_VOICE);
    expect(text).not.toContain("unit-eleven-key");
    expect(JSON.parse(text).code).toBe("PROVIDER_UNAVAILABLE");
  });

  it("returns 429 after 10 previews in 10 minutes per user, then recovers", async () => {
    vi.useFakeTimers({ now: new Date("2026-10-04T10:00:00Z") });
    const fetchMock = provider(...Array.from({ length: VOICE_PREVIEW_RATE_LIMIT.max + 2 }, () => mp3));
    for (let i = 0; i < VOICE_PREVIEW_RATE_LIMIT.max; i++) expect((await preview({ text: OPENING })).status).toBe(200);
    expect((await errorOf(await preview({ text: OPENING }), 429)).code).toBe("USAGE_LIMIT");
    expect(fetchMock).toHaveBeenCalledTimes(VOICE_PREVIEW_RATE_LIMIT.max);
    identity.requireIdentity.mockResolvedValueOnce({ client: {}, identity: { id: "22222222-2222-4222-8222-222222222222", isAnonymous: false } });
    expect((await preview({ text: OPENING })).status).toBe(200);
    vi.advanceTimersByTime(VOICE_PREVIEW_RATE_LIMIT.windowMs);
    expect((await preview({ text: OPENING })).status).toBe(200);
  });

  it("logs nothing about the text", async () => {
    const logs = [vi.spyOn(console, "log"), vi.spyOn(console, "error"), vi.spyOn(console, "warn"), vi.spyOn(console, "info")];
    provider(mp3, () => Promise.reject(new Error("offline")));
    await preview({ text: OPENING });
    await preview({ text: OPENING });
    for (const spy of logs) for (const args of spy.mock.calls) expect(JSON.stringify(args)).not.toContain("OPENING-SENTINEL");
  });
});

describe("fetchVoicePreview (client)", () => {
  it("sends only { text } or { text, presetId }", async () => {
    const fetchMock = vi.fn(async (_path: string, _init?: RequestInit) => mp3());
    vi.stubGlobal("fetch", fetchMock);
    await fetchVoicePreview(OPENING);
    await fetchVoicePreview(OPENING, "professor");
    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual(["/api/voice-preview", "/api/voice-preview"]);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ text: OPENING });
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({ text: OPENING, presetId: "professor" });
  });

  it("accepts only (text, presetId)", () => {
    expect(fetchVoicePreview.length).toBeLessThanOrEqual(2);
    const source = readFileSync("lib/voice-preview/client.ts", "utf8");
    expect(source).toMatch(/export async function fetchVoicePreview\(text: string, presetId\?: SessionPreset\)/);
    expect(source.replace(/^\s*\/\/.*$/gm, "")).not.toMatch(/goal|hardMoment|privateNotes|prediction/i);
  });

  it("surfaces NOT_CONFIGURED and rejects non-audio responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ code: "NOT_CONFIGURED", message: "Voice preview isn't set up.", retryable: false, request_id: "3f6f2a8e-1b7c-4d7e-9a51-0d7f3e9c2b11" }, { status: 503 })));
    await expect(fetchVoicePreview(OPENING)).rejects.toMatchObject({ code: "NOT_CONFIGURED" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { headers: { "Content-Type": "text/html" } })));
    await expect(fetchVoicePreview(OPENING)).rejects.toBeInstanceOf(VoicePreviewError);
  });
});

describe("HearButton", () => {
  it("renders 'Hear {name}' with a speaker icon", () => {
    const html = renderToStaticMarkup(createElement(HearButton, { name: "Jordan", text: OPENING, load: async () => new Blob() }));
    expect(html).toContain("Hear Jordan");
    expect(html).toContain("lucide-volume-2");
    expect(html).not.toContain("aria-disabled");
  });

  it("is disabled with the reason when unconfigured, and stays focusable", () => {
    const html = renderToStaticMarkup(createElement(HearButtonView, { name: "Jordan", status: "unavailable" }));
    expect(HEAR_UNAVAILABLE_REASON).toBe("Voice preview isn’t set up");
    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toMatch(/<button[^>]* disabled/);
    expect(html).toContain(HEAR_UNAVAILABLE_REASON);
    expect(html).toMatch(/aria-describedby="([^"]+)-reason"/);
  });

  it("shows loading and playing states", () => {
    expect(renderToStaticMarkup(createElement(HearButtonView, { name: "Jordan", status: "loading" }))).toContain('aria-busy="true"');
    expect(renderToStaticMarkup(createElement(HearButtonView, { name: "Jordan", status: "playing" }))).toContain("Stop Jordan");
  });
});

// W3 acceptance: no voice id or TTS model env reaches the browser (source half always runs; bundle half after a build).
describe("voice ids never reach the browser", () => {
  const ROOT = fileURLToPath(new URL("../..", import.meta.url));
  const SKIP = new Set(["node_modules", ".next", ".git", "artifacts", "docs", "supabase", "tests", "scripts", "website", ".worktrees"]);
  const VOICE_ENV = /ELEVENLABS_[A-Z_]*VOICE_ID|ELEVENLABS_API_KEY|ELEVENLABS_PREVIEW_TTS_MODEL/;
  const walk = (dir: string, acc: string[] = []): string[] => {
    for (const entry of readdirSync(dir)) {
      if (SKIP.has(entry)) continue;
      const absolute = join(dir, entry);
      if (statSync(absolute).isDirectory()) walk(absolute, acc);
      else if (/\.(ts|tsx)$/.test(absolute)) acc.push(absolute);
    }
    return acc;
  };
  const sources = walk(ROOT).map((file) => ({ path: relative(ROOT, file).split("\\").join("/"), text: readFileSync(file, "utf8") }));

  it("reads voice env names only in server-only modules", () => {
    const offenders = sources.filter(({ text }) => VOICE_ENV.test(text) && !/^import "server-only";/m.test(text)).map(({ path }) => path);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("keeps lib/voice-preview/server out of client modules", () => {
    const importers = sources.filter(({ text }) => /^"use client";/m.test(text) && /voice-preview\/server/.test(text)).map(({ path }) => path);
    expect(importers, importers.join("\n")).toEqual([]);
  });

  it("greps the built client bundle when one is present", () => {
    const bundle = join(ROOT, ".next", "static");
    if (!existsSync(bundle)) return;
    const names = Object.keys(process.env).filter((name) => VOICE_ENV.test(name));
    const files: string[] = [];
    const collect = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const absolute = join(dir, entry);
        if (statSync(absolute).isDirectory()) collect(absolute);
        else if (/\.(js|mjs|json|css|map|txt)$/.test(absolute)) files.push(absolute);
      }
    };
    collect(bundle);
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      if (VOICE_ENV.test(text)) hits.push(`${relative(ROOT, file)} contains a voice env name`);
      for (const name of names) {
        const value = process.env[name];
        if (value && value.length >= 8 && text.includes(value)) hits.push(`${relative(ROOT, file)} contains ${name}`);
      }
    }
    expect(hits, hits.join("\n")).toEqual([]);
  });
});
