import { afterEach, describe, expect, it, vi } from "vitest";
import { buildStandInContext, standInGreeting, standInMedia } from "@/lib/session/stand-in-context";
import { buildRoleContext } from "@/lib/schemas/role-context";
import { manager } from "@/fixtures/manager";

// W10 acceptance 3 and 4 (docs/next/04-NEW-SPECS.md). The stand-in is the only consumer of the
// goal; the counterpart still never receives it.
const GOAL = "GOAL-MARKER move the Atlas report to next sprint";
const HARD = "HARD-MARKER I get that the team is stretched, and I still need to drop one thing";
const counterpart = { name: "Jordan", role: "Your fictional manager", situation: "SITUATION-MARKER you share a product team and a Friday one-on-one." };

const leaks = {
  fear: "FEAR-MARKER that I am not committed",
  likelihood: "LIKELIHOOD-MARKER 80",
  notes: "PRIVATE-NOTE-MARKER I cried about this",
  prep: "PRIVATE-PREP-MARKER",
  aboutMe: "SHARED-FACT-MARKER I run on weekends",
  trait: "blunt and direct",
  stance: "STANCE-MARKER keep the launch on track",
};

function payload(context: string) {
  const line = context.split("\n").at(-1) ?? "";
  return JSON.parse(line) as Record<string, unknown>;
}

afterEach(() => { vi.unstubAllEnvs(); });

describe("buildStandInContext", () => {
  it("carries the goal, hard-moment line and the counterpart's name and situation, and nothing else", () => {
    const context = buildStandInContext({ counterpart, goal: GOAL, hardMomentLine: HARD });
    expect(context).toContain("You are a fictional stand-in playing the user in a short practice");
    expect(context).toContain("The user is playing Jordan.");
    expect(context).toContain("close to word for word");
    expect(context).toContain("acknowledge their concern once and repeat the request");
    expect(context).toContain("Do not over-apologize, add new demands, coach, comment on how the user is playing, or claim to be the real user.");
    expect(payload(context)).toEqual({
      counterpartName: "Jordan",
      counterpartRole: "Your fictional manager",
      situation: counterpart.situation,
      yourLine: GOAL,
      whenItGetsHard: HARD,
    });
  });

  it("omits the hard-moment line when there is none", () => {
    expect(payload(buildStandInContext({ counterpart, goal: GOAL }))).not.toHaveProperty("whenItGetsHard");
  });

  it("has no place for private prep, fear, likelihoods, About-me facts, traits or stance chips", () => {
    const context = buildStandInContext({ counterpart, goal: GOAL, hardMomentLine: HARD });
    for (const leak of Object.values(leaks)) expect(context).not.toContain(leak);
    // The strict schema is the boundary: an input carrying any of them fails instead of leaking.
    for (const extra of [{ fear: leaks.fear }, { knownAboutUser: [leaks.aboutMe] }, { traits: { tone: "blunt" } }, { wants: leaks.stance }, { privateNotes: leaks.notes }]) {
      expect(() => buildStandInContext({ counterpart, goal: GOAL, ...extra } as never)).toThrow();
    }
    expect(() => buildStandInContext({ counterpart: { ...counterpart, softensWhen: leaks.stance }, goal: GOAL } as never)).toThrow();
  });

  it("rejects an empty or over-long line rather than truncating it", () => {
    expect(() => buildStandInContext({ counterpart, goal: "   " })).toThrow();
    expect(() => buildStandInContext({ counterpart, goal: "g".repeat(201) })).toThrow();
    expect(() => buildStandInContext({ counterpart, goal: GOAL, hardMomentLine: "h".repeat(201) })).toThrow();
  });

  it("greets in character so the line is reached even in a short call", () => {
    expect(standInGreeting("Jordan")).toBe("Hey, Jordan, do you have a minute?");
    expect(() => standInGreeting(" ")).toThrow();
  });
});

describe("buildRoleContext regression (acceptance 4)", () => {
  it("still gives the counterpart no goal or hard-moment line on the Your-turn call", () => {
    const context = buildRoleContext(manager, { traits: { tone: "blunt" }, knownAboutUser: [leaks.aboutMe] });
    expect(context).not.toContain(GOAL);
    expect(context).not.toContain(HARD);
    expect(context).not.toContain("yourLine");
    expect(context).not.toContain("whenItGetsHard");
    expect(context).not.toContain("stand-in");
  });
});

describe("standInMedia", () => {
  it("reads the reserved face and PAL from server env", () => {
    vi.stubEnv("TAVUS_STANDIN_PAL_ID", "standin-pal");
    vi.stubEnv("TAVUS_STANDIN_FACE_ID", "standin-face");
    expect(standInMedia()).toEqual({ palId: "standin-pal", faceId: "standin-face" });
  });

  it("fails closed rather than borrowing the counterpart's face", () => {
    vi.stubEnv("TAVUS_STANDIN_PAL_ID", "");
    vi.stubEnv("TAVUS_STANDIN_FACE_ID", "standin-face");
    vi.stubEnv("TAVUS_FACE_ID", "default-face");
    vi.stubEnv("TAVUS_PAL_ID", "default-pal");
    expect(() => standInMedia()).toThrowError(expect.objectContaining({ code: "NOT_CONFIGURED", status: 503 }));
  });
});
