import { afterEach, describe, expect, it, vi } from "vitest";
import { allowedPortraitUrl, starterMedia, starterPortrait } from "@/lib/media/presets.server";

const env = { ...process.env };
afterEach(() => { process.env = { ...env }; vi.unstubAllGlobals(); });

function configure() {
  Object.assign(process.env, {
    TAVUS_API_KEY: "key", TAVUS_PAL_ID: "pdefault", TAVUS_FACE_ID: "fdefault", ELEVENLABS_VOICE_ID: "vdefault",
    TAVUS_STARTER_MANAGER_PAL_ID: "pmanager", TAVUS_STARTER_MANAGER_FACE_ID: "fmanager", ELEVENLABS_STARTER_MANAGER_VOICE_ID: "vmanager",
  });
  for (const preset of ["ROOMMATE", "PROFESSOR", "DECLINE"]) {
    delete process.env[`TAVUS_STARTER_${preset}_PAL_ID`]; delete process.env[`TAVUS_STARTER_${preset}_FACE_ID`]; delete process.env[`ELEVENLABS_STARTER_${preset}_VOICE_ID`];
  }
}

describe("starter media", () => {
  it("maps a configured starter and falls back to the defaults otherwise", () => {
    configure();
    expect(starterMedia("manager")).toEqual({ palId: "pmanager", faceId: "fmanager", voiceId: "vmanager" });
    expect(starterMedia("roommate")).toEqual({ palId: "pdefault", faceId: "fdefault", voiceId: "vdefault" });
  });

  it("rejects unknown presets with 404 before any provider call", async () => {
    configure();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(starterPortrait("boss")).rejects.toMatchObject({ status: 404 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("streams the face still privately without exposing the CDN URL", async () => {
    configure();
    const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => url.includes("/v2/faces/")
      ? Response.json({ thumbnail_image_url: "https://cdn.replica.tavus.io/still.png" })
      : new Response("png", { headers: { "content-type": "image/png" } }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await starterPortrait("manager");
    expect(fetchMock.mock.calls[0][0]).toContain("/v2/faces/fmanager");
    expect(response.headers.get("cache-control")).toBe("private, max-age=86400");
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(await response.text()).toBe("png");
    expect(JSON.stringify([...response.headers])).not.toContain("cdn.replica.tavus.io");
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ redirect: "error" });
  });

  it("types a generic CDN response from its image extension, and refuses anything else", async () => {
    configure();
    process.env.TAVUS_STARTER_MANAGER_FACE_ID = "fgeneric";
    vi.stubGlobal("fetch", vi.fn(async (url: string) => url.includes("/v2/faces/")
      ? Response.json({ thumbnail_image_url: "https://cdn.replica.tavus.io/still.jpg" })
      : new Response("jpg", { headers: { "content-type": "binary/octet-stream" } })));
    const response = await starterPortrait("manager");
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    process.env.TAVUS_STARTER_MANAGER_FACE_ID = "fhtml";
    vi.stubGlobal("fetch", vi.fn(async (url: string) => url.includes("/v2/faces/")
      ? Response.json({ thumbnail_image_url: "https://cdn.replica.tavus.io/page.html" })
      : new Response("<html>", { headers: { "content-type": "text/html" } })));
    await expect(starterPortrait("manager")).rejects.toMatchObject({ status: 503 });
  });

  it("refuses a still that is not on the Tavus image host, and does not fetch it", async () => {
    configure();
    process.env.TAVUS_STARTER_MANAGER_FACE_ID = "fblocked";
    const fetchMock = vi.fn(async (url: string) => url.includes("/v2/faces/")
      ? Response.json({ thumbnail_image_url: "https://169.254.169.254/latest/meta-data" })
      : new Response("png", { headers: { "content-type": "image/png" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(starterPortrait("manager")).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(allowedPortraitUrl("https://cdn.replica.tavus.io.evil.test/still.png")).toBeNull();
    expect(allowedPortraitUrl("http://cdn.replica.tavus.io/still.png")).toBeNull();
  });

  it("returns 503 when the provider has no still", async () => {
    configure();
    process.env.TAVUS_STARTER_MANAGER_FACE_ID = "fother";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));
    await expect(starterPortrait("manager")).rejects.toMatchObject({ status: 503 });
  });
});
