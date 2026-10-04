# X: Recap loop (2A + 2B combined)

Status: implemented in the worktree; integration pending (the workspace diff below is not applied)
Updated: October 4, 2026
Assigned writer: X worker subagent (claude-opus-5-thinking-high)
Coordinator: wow-pass coordinator (main checkout)
Gate: Compressed finish (docs/next/02-BUILD-PLAN.md §1a)
Requirements/tests: docs/next/02-BUILD-PLAN.md §1a and §4 2A/2B; docs/30-ONE-MOMENT-RETRY.md; docs/32-FEATURE-SPECS.md L1, L3 (wording only), Q2, A1; docs/next/04-NEW-SPECS.md W4 (after), W7
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/78
Pull request: https://github.com/esaba12/conversaton-practice/pull/84 (draft)

## Assignment and isolation

- Base: `main` `0106445`. Branch `agent/x-recap-loop`; worktree `.worktrees/x`; dev port 3106.
- Owned: `components/practice/recap*.tsx` (+ CSS), `components/presentation/reflection-*`, `lib/practice/flow.ts` (retry stages), `lib/reflection/**`, `lib/schemas/reflection.ts`, `app/api/sessions/[id]/reflect/route.ts`, `app/api/sessions/[id]/alternative/route.ts` (if A1 needs it), `app/design-preview/recap/page.tsx`, tests, this record.
- Not owned (propose exact diffs): `app/practice/practice-workspace.tsx`, `lib/session/**`, other schemas, migrations, package files, numbered docs, STATUS.md.
- Feedback style arrives as a validated enum in the reflect request (stored on the device by slice Y); no database change.

## Scope and acceptance

- [x] docs/30 acceptance 1–8 and the L1 list; reflection starts after a 1.5 s grace with Skip.
- [x] Retry start uses the reviewed role with `opening` replaced; no goal, hard-moment line or transcript in the body. (Component contract + proposed workspace diff; the retry start is wired by the coordinator.)
- [x] W4 after (fear recall, Happened/Partly/Didn't, second slider, side-by-side numbers, "Your numbers, not a score.") in browser memory only; W7 staging; "How {name} was played" closed by default, chips only.
- [x] `quotedLine` is a verbatim substring of a user turn or null (server-enforced), never counterpart text; feedback style changes wording only (fixtures for all three); A1 one alternative on request only; no score fields; prompt version bumped.

Live not verified: no provider call, no live call, and no human run of the retry was made in this slice. A passing unit test does not establish that the counterpart sounded disappointed or that the user could end cleanly.

## What this slice built

### Recap screen (L1, W7, W4 after, Q2)

- `components/practice/recap-stage.tsx` is now the whole recap in docs/33 §4.8 order: small portrait plus "That was a real try." in serif (focusable heading), the docs/30 self-check, the reflection card, the W4 "What you expected" card, the collapsed "How {name} was played" dropdown, the explicit save card, "This call isn’t saved. Save only what you choose.", and the closing line with only the one action below it. Every new prop is optional, so the current workspace still compiles and renders today's behaviour until the diff below lands.
- `components/practice/recap-retry.tsx` (docs/30): "Did you say it?" with Yes / Not sure / No. Yes hides everything; Not sure prints "There isn’t a clear moment to redo. You can stop here."; No offers "Try that moment once", then the suggested opening in an editable field (≤300, the existing opening limit) and "Call {name}". The answer is client state only: it is never sent to the server, to reflection, or to any model call. `selfCheckShown` gates on a non-empty hard-moment line, no support exit, not already the retry's recap, and a remaining call in the sitting.
- `components/practice/recap-arc.tsx` (W4): "You expected: '{fear}'.", Happened / Partly / Didn’t happen, the second 0–100 slider starting at the earlier number, then the two numbers side by side in serif with a thin clay arc and "Your numbers, not a score." No delta, no "you improved", nothing derived in the DOM. Renders nothing when the user wrote no fear.
- `components/practice/recap-stance.tsx` (Q2): a `<details>` with no `open`, chips only (wants, holds back because, softens when, the challenge chip) and "Fiction, set before the call". It reads the reviewed role; nothing new is stored.
- `components/practice/recap.module.css`: tokens only, no raw colors, reduced motion disables the arc draw.
- W7 staging: the quoted line writes in at 40 ms per word with a clay underline that draws after the last word, as selectable serif text (never an image); `prefers-reduced-motion` shows the finished state at once.

### Reflection card (L1, A1)

- `components/presentation/reflection-panel.tsx`: with `autoStart`, the panel shows "Getting your reflection…" and sends the request only after `REFLECTION_GRACE_MS` (1500). Skip inside that window cancels the timer and sends nothing; Skip later still just stops the display. The manual "Get a short reflection" button stays for callers that do not auto-start.
- The quoted line renders above "What you did". "Another way to say it" (A1) sits under "Next time", appears only when the caller passes `onAlternative` and the reflection has a next step, and is replaced by the one option plus "One option. Use your own words if you prefer." once requested. A second press is never offered.

### Reflection server (2B)

- `lib/schemas/reflection.ts`: `reflectionSchema` gains `quotedLine` (≤200, nullable, required in the strict model schema). `reflectRequestSchema` gains `feedbackStyle: "gentle" | "direct" | "list"` (L3 names; default `gentle`). New `alternativeRequestSchema` (`goal` ≤200 plus the optional style, strict) and `alternativeResponseSchema` (`{ alternative }`, ≤200 or null). Still no score, grade, rating or level anywhere, and the fear, likelihoods and hard-moment line are rejected by the strict request schemas.
- `lib/reflection/prompt.ts`: `REFLECTION_PROMPT_VERSION` bumped to `reflection-2026-10-04.1`. New rules: `quotedLine` must be copied word for word from one user turn and is null whenever `observedAction` is null; docs/30 step 5's "describe one observable action toward the goal, or say the evidence was not enough. Do not judge whether the user gave in, caved, held firm, stayed calm, or handled the moment well."; the support exit nulls `quotedLine` too. `reflectionSystemPrompt(style)` appends one wording line per style — all three keep the same fields, the same single next step and the same ban on scores.
- `lib/reflection/generate.ts`: `verifyQuotedLine` normalizes whitespace and case and keeps the quote only when it is inside a single `speaker: "user"` turn, so paraphrases, counterpart lines and quotes spanning two turns all become null. `enforceReflectionRules(output, turns)` applies it after the support-exit and insufficient-evidence backstops. The Responses call is factored into one structured helper (`store: false`, strict JSON schema, one retry, 20 s timeout) shared with the alternative.
- `app/api/sessions/[id]/alternative/route.ts` (A1): same auth, ownership, ended-session and strict-body checks as reflect, and it shares `reserveReflection`, so one recap cannot spend more model calls than a reflection would. The body carries the user's own goal line and nothing else.
- `lib/reflection/api-client.ts`: `requestReflection` passes the style through and still strips everything but turns, goal and self-reflection; `requestAlternative(sessionId, goal, style?)` sends only the goal.

### Flow

`lib/practice/flow.ts` needed no change: the 0C refactor already has `retry-ringing`/`retry-call`/`retry-recap`, `retryAccepted` only from `recap` with `retryUsed` false, teardown on every exit, and `tests/unit/practice-flow.test.ts` already asserts a second `retryAccepted` is ignored. The retry stages were re-read against docs/30 acceptance 4, 6 and 7 and left as they are.

### Gallery

`app/design-preview/recap/page.tsx` (dev-only, `notFound()` otherwise) plus `app/design-preview/recap/recap-gallery.tsx` with `data-gallery-state` markers and fake data only: `recap-ended-plain`, `recap-self-check`, `recap-reflection-pending`, `recap-reflection-result`, `recap-reflection-insufficient`, `recap-support-exit`, `recap-arc`, `recap-after-retry`, `recap-interrupted`. Nothing there starts a call or touches a provider. (The client component sits next to the page in the new `recap/` directory, one file beyond the literal owned path.)

## Verification actually run

In `.worktrees/x` at the commit below:

- `npm run typecheck` — clean.
- `npm test` — 39 files, 641 tests, all passing (includes the new `tests/unit/recap-ui.test.ts` and `tests/unit/alternative-route.test.ts`, the UI-rules repository checks, and the updated reflection fixtures).
- `npm run build` — succeeded; `/api/sessions/[id]/alternative` and `/design-preview/recap` appear in the route list.
- Dev server on 127.0.0.1:3106 and the gallery at `/design-preview/recap`: every state renders, the quoted line shows with its clay underline, the arc shows "80% → 30%" with "Your numbers, not a score.", and "How Jordan was played" is closed. Screenshot taken by eye only; the three-width screenshot script and `npm run test:ui` were not run (Playwright port 3100 is shared).
- Not run: any provider call, any live call, any migration, `npm run test:ui`, `auth-database-check.mjs`.

`next-env.d.ts` was reverted before committing.

## Handoff

### 1. `app/practice/practice-workspace.tsx` (coordinator applies)

Three edits. Everything else in the file is unchanged.

**(a) imports** — add the A1 and retry pieces:

```diff
-import { RecapStage } from "@/components/practice/recap-stage";
+import { RecapStage } from "@/components/practice/recap-stage";
+import { RETRY_DURATION_SECONDS } from "@/components/practice/recap-retry";
+import { closedAlternative, type AlternativeState } from "@/components/presentation/reflection-panel";
@@
-import { requestReflection } from "@/lib/reflection/api-client";
+import { requestAlternative, requestReflection } from "@/lib/reflection/api-client";
@@
-import { beginCall, beginStandIn, canStartCall, endStandIn, initialStandInSitting, standInOffer, type StandInSitting } from "@/lib/practice/stand-in-sitting";
+import { beginCall, beginRetry, beginStandIn, canRetry, canStartCall, endStandIn, initialStandInSitting, standInOffer, type StandInSitting } from "@/lib/practice/stand-in-sitting";
```

**(b) state and handlers** — add next to the other reflection state:

```diff
   const [reflect, setReflect] = useState<ReflectState>(closedReflect);
+  const [alternative, setAlternative] = useState<AlternativeState>(closedAlternative);
```

and add these two functions beside `requestReflectionNow` (the retry reuses the reviewed role with only `opening` replaced, a new idempotency key and 180 s; `launch` already sends no goal, no hard-moment line and no transcript):

```tsx
  // docs/30: one retry per sitting. Same reviewed role, same resolution path, only the opening changes.
  function startRetry(opening: string) {
    const role = parseReviewedRole({ ...reviewRole, opening });
    if (!role || !canRetry(sitting) || !apply({ type: "retryAccepted" }).changed) return;
    setSitting((current) => beginRetry(current));
    const person = savedPerson ?? draftPerson;
    const key = crypto.randomUUID();
    if (person) {
      const situation: Situation = { ...situationFromRole(role), opening };
      void launch({ kind: "person", person }, "", () => startSavedPersonSession({ personId: person.id, expectedVersion: person.version, situation, durationSeconds: RETRY_DURATION_SECONDS, idempotencyKey: key }));
      return;
    }
    void launch({ kind: "role", role }, "", () => startSession({ role, durationSeconds: RETRY_DURATION_SECONDS, idempotencyKey: key }));
  }

  // A1, on request only. The goal line is the only content sent.
  async function requestAlternativeNow() {
    const goal = readPrivateState().goal.trim() || reflect.goal.trim();
    if (!reflect.sessionId || !goal || alternative.pending || alternative.requested) return;
    setAlternative({ ...alternative, pending: true, error: null });
    try {
      const text = await requestAlternative(reflect.sessionId, goal, feedbackStyle);
      setAlternative({ text, pending: false, error: null, requested: true });
    } catch (error) {
      if (isAuthError(error)) { handleAuthLoss(); return; }
      setAlternative({ text: null, pending: false, error: "We couldn’t find another way to say it. Your own words are fine.", requested: false });
    }
  }
```

Also reset it where the other per-attempt state is cleared: add `setAlternative(closedAlternative);` to `clearReflection()`.

A preset retry resolves the role the same way a normal preset start does and then replaces the opening; because `startPresetSession` carries no role fields, an edited opening falls through to `startSession({ role })` above, which is the same reviewed role with the new opening. That matches docs/30 step 4 ("resolve the role the same way a normal start does, then replace the opening").

**(c) the recap render** — pass the new props:

```diff
-            {(phase === "ended" || phase === "interrupted") && <RecapStage ended={phase === "ended"} origin={callOrigin} saveOffer={saveOffer} people={people} peopleStatus={peopleStatus}
+            {(phase === "ended" || phase === "interrupted") && <RecapStage ended={phase === "ended"} origin={callOrigin} saveOffer={saveOffer} people={people} peopleStatus={peopleStatus}
+          counterpartName={callInfo.name} portraitSrc={portraitSrc} role={reviewRole}
+          isRetry={flow.stage === "retry-recap"} hardMomentLine={readPrivateState().hardMomentLine}
+          retryAvailable={canRetry(sitting) && !flow.retryUsed} onRetry={startRetry} retryStarting={starting}
+          prediction={readPrivateState().prediction} likelihoodBefore={readPrivateState().likelihoodBefore}
+          likelihoodAfter={readPrivateState().likelihoodAfter} onLikelihoodAfterChange={(likelihoodAfter) => updatePrivateState({ likelihoodAfter })}
+          alternative={alternative} onAlternative={() => void requestAlternativeNow()}
           onSave={() => void saveFromCall()} onDismissSave={dismissSave} reflect={reflect} turns={turns}
```

The private fields read here (`hardMomentLine`, `prediction`, the likelihoods) stay in `lib/practice/private-state.ts` and in this render only; they are not added to any request body. `readPrivateState()` is not reactive, so the recap should subscribe with `useSyncExternalStore(subscribePrivateState, readPrivateState)` if the slider needs to update on the same render pass — either the coordinator adds that one hook here, or slice Y's private-state hook covers it.

### 2. Open questions for the coordinator

- **Feedback style source.** `feedbackStyle` above is whatever slice Y exposes from `localStorage` (L3 names used here: `gentle` | `direct` | `list`). Until Y lands, drop the argument and the server uses `gentle`.
- **Button label.** docs/33 §4.8 calls the last action "Done"; it is still "Back to setup" so the coordinator-owned `tests/browser/hero-path.spec.ts` and `scripts/preflight/g5-checks.mjs` keep passing. Rename in both places together.
- **Pocket card (L2)** and **Save/Update** stay where they are; the recap leaves room for the pocket-card action from slice Y.
- **W4 before.** The green room half (1D) already writes `prediction` and `likelihoodBefore`; this slice only reads them.
- `components/presentation/reflection.module.css` gained the quote, status and alternative classes (tokens only). It is still on the UI-rules raw-color allow list from 0C; the new rules add no raw colors.
