import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const classNames = vi.hoisted(() => ({ default: new Proxy({}, { get: (_target: object, prop: string | symbol) => String(prop) }) }));
vi.mock("@/components/practice/recap.module.css", () => classNames);
vi.mock("@/components/presentation/reflection.module.css", () => classNames);
vi.mock("@/components/presentation/people.module.css", () => classNames);
vi.mock("@/components/ui/portrait.module.css", () => classNames);
vi.mock("@/components/ui/primary-button.module.css", () => classNames);
vi.mock("@/components/ui/private-card.module.css", () => classNames);

import { RecapArc, ARC_NOTE, arcShown } from "@/components/practice/recap-arc";
import { RecapSelfCheck, NOT_SURE_COPY, RETRY_DONE_COPY, RETRY_DURATION_SECONDS, RETRY_LABEL, RETRY_OPENING, RETRY_OPENING_MAX, SELF_CHECK_QUESTION, STOP_HERE_COPY, selfCheckShown } from "@/components/practice/recap-retry";
import { RecapStage, RECAP_TITLE } from "@/components/practice/recap-stage";
import { RecapStance, STANCE_FICTION_NOTE, stanceChips } from "@/components/practice/recap-stance";
import { ALTERNATIVE_LABEL, ALTERNATIVE_NOTE, REFLECTION_GRACE_MS, REFLECTION_WAITING, ReflectionPanel, closedAlternative } from "@/components/presentation/reflection-panel";
import { manager } from "@/fixtures/manager";
import { closedReflect, type ReflectState } from "@/lib/practice/types";
import type { Reflection, TranscriptTurn } from "@/lib/schemas/reflection";

const NAME = manager.name;
const HARD_MOMENT = "I get that the team needs me, and I still need to drop one thing.";
const FEAR = "FEAR-MARKER that I am not committed";
const QUOTE = "I still need to drop one thing.";
const turns: TranscriptTurn[] = [{ speaker: "counterpart", text: "The team is stretched." }, { speaker: "user", text: QUOTE }];
const reflection: Reflection = { evidence: "complete", observedAction: "You made one request.", quotedLine: QUOTE, takeaway: "That matched your line.", nextStep: "Name the date.", supportExit: false };
const noop = () => undefined;
const forbidden = ["therapy", "therapist", "Therapy", "Therapist"];

const reflect = (patch: Partial<ReflectState> = {}): ReflectState => ({ ...closedReflect, sessionId: "11111111-1111-4111-8111-111111111111", ...patch });
const base = {
  ended: true,
  origin: { kind: "role" as const, role: manager },
  saveOffer: { open: false, saving: false, saved: null, error: "" },
  people: [],
  peopleStatus: "ready" as const,
  onSave: noop, onDismissSave: noop,
  turns, onSelfReflectionChange: noop, onReflect: noop, onReflectionDone: noop,
  canRetryCleanup: false, onRetryCleanup: noop, onBackToSetup: noop, backToSetupRef: null,
  counterpartName: NAME, role: manager,
};
const recap = (props: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(RecapStage, { ...base, reflect: reflect(), ...props } as never));

describe("the recap page", () => {
  it("opens with one plain sentence and ends with the stop-here line", () => {
    const html = recap();
    expect(html).toContain(RECAP_TITLE);
    expect(html).toContain(STOP_HERE_COPY);
    expect(html).toContain("This call isn’t saved. Save only what you choose.");
    expect(html).not.toMatch(/score|grade|rating|you improved|well done/i);
  });

  it("names the one closing sentence after the retry and offers no second one", () => {
    const html = recap({ isRetry: true, hardMomentLine: HARD_MOMENT, retryAvailable: true, onRetry: noop });
    expect(html).toContain(RETRY_DONE_COPY);
    expect(html).not.toContain(SELF_CHECK_QUESTION);
    expect(html).not.toContain(RETRY_LABEL);
  });

  it("shows no recap body for an interrupted call, only the cleanup action", () => {
    const html = recap({ ended: false, canRetryCleanup: true });
    expect(html).not.toContain(RECAP_TITLE);
    expect(html).toContain("Retry closing session");
    expect(html).not.toContain("Back to setup");
  });
});

describe("the self-check and the one retry (docs/30)", () => {
  it("appears only with a hard-moment line, no support exit, no retry yet and a call left", () => {
    const input = { hardMomentLine: HARD_MOMENT, supportExit: false, isRetry: false, retryAvailable: true };
    expect(selfCheckShown(input)).toBe(true);
    expect(selfCheckShown({ ...input, hardMomentLine: "   " })).toBe(false);
    expect(selfCheckShown({ ...input, supportExit: true })).toBe(false);
    expect(selfCheckShown({ ...input, isRetry: true })).toBe(false);
    expect(selfCheckShown({ ...input, retryAvailable: false })).toBe(false);
  });

  it("asks the question with three answers and hides the offer until the user answers No", () => {
    const html = renderToStaticMarkup(createElement(RecapSelfCheck, { counterpartName: NAME, hardMomentLine: HARD_MOMENT, onRetry: noop }));
    expect(html).toContain(SELF_CHECK_QUESTION);
    for (const label of ["Yes", "Not sure", "No"]) expect(html).toContain(`>${label}<`);
    expect(html).not.toContain(RETRY_LABEL);
    expect(html).not.toContain(NOT_SURE_COPY);
    expect(html).not.toContain(RETRY_OPENING);
    expect(html).toContain(HARD_MOMENT);
  });

  it("keeps the suggested opening civil, inside the existing limit, and the retry at 180 seconds", () => {
    expect(RETRY_OPENING.length).toBeLessThanOrEqual(RETRY_OPENING_MAX);
    expect(RETRY_OPENING_MAX).toBe(300);
    expect(RETRY_DURATION_SECONDS).toBe(180);
    expect(RETRY_OPENING).not.toMatch(/stupid|lazy|never|you always|after everything/i);
  });

  it("drops the self-check and the retry on a support exit", () => {
    const html = recap({ hardMomentLine: HARD_MOMENT, retryAvailable: true, onRetry: noop, reflect: reflect({ reflection: { ...reflection, supportExit: true, observedAction: null, quotedLine: null, takeaway: null, nextStep: null } }) });
    expect(html).not.toContain(SELF_CHECK_QUESTION);
    expect(html).toContain("988");
  });

  it("never renders the retry control without a handler for it", () => {
    expect(recap({ hardMomentLine: HARD_MOMENT, retryAvailable: true })).not.toContain(SELF_CHECK_QUESTION);
  });
});

describe("the reflection card on the recap", () => {
  const panel = (props: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(ReflectionPanel, {
    selfReflection: "", onSelfReflectionChange: noop, onReflect: noop, onDone: noop, ...props,
  } as never));

  it("starts on its own with a Skip, after a grace period", () => {
    expect(REFLECTION_GRACE_MS).toBe(1500);
    const html = panel({ autoStart: true });
    expect(html).toContain(REFLECTION_WAITING);
    expect(html).toContain(">Skip<");
    expect(html).not.toContain("Get a short reflection");
  });

  it("keeps the manual button when it is not started for the user", () => {
    const html = panel();
    expect(html).toContain("Get a short reflection");
    expect(html).not.toContain(REFLECTION_WAITING);
  });

  it("shows the quoted line as selectable text, word by word, with no image", () => {
    const html = panel({ reflection });
    expect(html).toContain("What you did");
    expect(html).toContain("--word-index");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<svg");
    for (const word of QUOTE.split(" ")) expect(html).toContain(word);
  });

  it("offers one alternative only on request, and only when there is a next step", () => {
    const withButton = panel({ reflection, onAlternative: noop, alternative: closedAlternative });
    expect(withButton).toContain(ALTERNATIVE_LABEL);
    expect(withButton).not.toContain(ALTERNATIVE_NOTE);
    const requested = panel({ reflection, onAlternative: noop, alternative: { text: "I need to hand one project off.", pending: false, error: null, requested: true } });
    expect(requested).toContain("I need to hand one project off.");
    expect(requested).toContain(ALTERNATIVE_NOTE);
    // One option per recap: once it is shown the button is gone.
    expect(requested.match(new RegExp(ALTERNATIVE_LABEL, "g"))).toHaveLength(1);
    expect(panel({ reflection })).not.toContain(ALTERNATIVE_LABEL);
    expect(panel({ reflection: { ...reflection, nextStep: null }, onAlternative: noop })).not.toContain(ALTERNATIVE_LABEL);
    expect(panel({ reflection: { ...reflection, supportExit: true }, onAlternative: noop })).not.toContain(ALTERNATIVE_LABEL);
  });
});

describe("the confidence arc (W4 after)", () => {
  it("needs both numbers and shows no derived number", () => {
    expect(arcShown(80, 30)).toBe(true);
    expect(arcShown(80, null)).toBe(false);
    expect(arcShown(null, 30)).toBe(false);
    const html = renderToStaticMarkup(createElement(RecapArc, { prediction: FEAR, likelihoodBefore: 80, likelihoodAfter: 30, onLikelihoodAfterChange: noop }));
    expect(html).toContain("80%");
    expect(html).toContain("30%");
    expect(html).toContain(ARC_NOTE);
    expect(html).not.toContain("50%");
    expect(html).not.toMatch(/-50|improved|better|worse/i);
  });

  it("recalls the fear and asks what happened, and renders nothing without one", () => {
    const html = renderToStaticMarkup(createElement(RecapArc, { prediction: FEAR, likelihoodBefore: 80, likelihoodAfter: null, onLikelihoodAfterChange: noop }));
    expect(html).toContain(FEAR);
    expect(html).toContain("Did that happen?");
    for (const label of ["Happened", "Partly", "Didn’t happen"]) expect(html).toContain(label);
    expect(html).not.toContain(ARC_NOTE);
    expect(renderToStaticMarkup(createElement(RecapArc, { prediction: "  ", likelihoodBefore: 80, likelihoodAfter: 30, onLikelihoodAfterChange: noop }))).toBe("");
  });

  it("keeps the fear off the recap when the user never wrote one", () => {
    expect(recap({ prediction: "", likelihoodBefore: null, likelihoodAfter: null, onLikelihoodAfterChange: noop })).not.toContain("You expected");
  });
});

describe("how the counterpart was played (Q2)", () => {
  it("lists the reviewed chips and the challenge, closed, with the fiction label", () => {
    const html = renderToStaticMarkup(createElement(RecapStance, { counterpartName: NAME, role: manager }));
    expect(html).toContain(`How ${NAME} was played`);
    expect(html).not.toContain("<details open");
    expect(html).toContain(STANCE_FICTION_NOTE);
    expect(stanceChips(manager).map((chip) => chip.value)).toEqual([manager.wants, manager.holdsBackBecause, manager.softensWhen, "Pushes back a little"]);
    // Chips only: the reviewed situation and opening line are not repeated here.
    expect(html).not.toContain(manager.publicContext);
    expect(html).not.toContain(manager.opening);
  });

  it("falls back to the challenge chip alone when the role has no stance chips", () => {
    const plain = { challenge: "supportive" as const };
    expect(stanceChips(plain)).toEqual([{ label: "How they react", value: "Takes it well" }]);
  });
});

describe("copy rules", () => {
  it("never calls this therapy, never says pause, and never scores the user", () => {
    const markup = [
      recap({ hardMomentLine: HARD_MOMENT, retryAvailable: true, onRetry: noop, prediction: FEAR, likelihoodBefore: 80, likelihoodAfter: 30, onLikelihoodAfterChange: noop, reflect: reflect({ reflection }) }),
      recap({ isRetry: true }),
      renderToStaticMarkup(createElement(RecapSelfCheck, { counterpartName: NAME, hardMomentLine: HARD_MOMENT, onRetry: noop })),
    ].join(" ");
    for (const word of forbidden) expect(markup).not.toContain(word);
    expect(markup).not.toMatch(/\bpause\b/i);
    // "Your numbers, not a score." is the only place the word appears, and it denies one.
    expect(markup.split(ARC_NOTE).join("")).not.toMatch(/score|grade|rating|percentile/i);
  });
});
