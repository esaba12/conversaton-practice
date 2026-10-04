import { afterEach, describe, expect, it, vi } from "vitest";
import { starterMedia, starterPortrait } from "@/lib/media/presets.server";

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
    const fetchMock = vi.fn(async (url: string) => url.includes("/v2/faces/")
      ? Response.json({ thumbnail_image_url: "https://cdn.example.test/still.png" })
      : new Response("png", { headers: { "content-type": "image/png" } }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await starterPortrait("manager");
    expect(fetchMock.mock.calls[0][0]).toContain("/v2/faces/fmanager");
    expect(response.headers.get("cache-control")).toBe("private, max-age=86400");
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(await response.text()).toBe("png");
    expect(JSON.stringify([...response.headers])).not.toContain("cdn.example.test");
  });

  it("returns 503 when the provider has no still", async () => {
    configure();
    process.env.TAVUS_STARTER_MANAGER_FACE_ID = "fother";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));
    await expect(starterPortrait("manager")).rejects.toMatchObject({ status: 503 });
  });
});
