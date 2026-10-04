# 1B: Lobby and briefing (P1, P3, W2 UI, R1 chips)

Status: ready for review; components built and mock-tested, not wired into the workspace (coordinator-owned). Live not verified.
Updated: October 4, 2026, 00:40 EDT
Assigned writer: 1B worker subagent (claude-opus-5-5-medium)
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 1
Requirements/tests: docs/next/02-BUILD-PLAN.md §3 1B; docs/32 P1, P3, R1; docs/next/04-NEW-SPECS.md W2; docs/next/03-CONTRACTS.md §2 (C1, frozen) and §2.9 (portraits); docs/33 lobby/briefing screens; docs/next/05-UI-UPGRADE.md
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/61
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` `916e590` (C1 merged).
- Branch: `agent/1b-lobby-briefing`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/1b`
- Dev port: 3102
- Owned files: `app/practice/page.tsx`, `components/practice/lobby*.tsx`, `components/practice/briefing*.tsx`, `components/ui/person-card.tsx`, `lib/practice/skill-templates.ts`, `lib/people/api-client.ts` (read additions only), `app/design-preview/**` (add lobby/briefing states), tests for these, this record.
- Not owned (propose changes in Handoff): `app/practice/practice-workspace.tsx`, `lib/practice/flow.ts`, `lib/practice/private-state.ts` (use its exported API only), `lib/schemas/**`, `lib/session/**`, `lib/setup/**`, `app/api/**`, `components/practice/call-*`/`ringing*`/`remote-media.tsx` (1A), `package.json`, lockfile, `scripts/**`, numbered docs, STATUS.md.
- Shared resources: no live calls, no provider calls, no migrations; port 3100 is the coordinator's.
- Dependency tasks: C1 merged. M1 (person `background`, saved situations, practice history) is being applied by the coordinator; 1C builds those routes in parallel. Code against the C1 schemas in `lib/schemas/people.ts` and mock the routes in tests.

## Scope and acceptance

From 02-BUILD-PLAN 1B:
- [x] P1 and P3 acceptance lists (docs/32).
- [x] Jordan (manager) first in the starters; starter cards show the portrait from `GET /api/portraits/[presetId]` with a graceful fallback (initials) when it 404s/503s.
- [x] R1 skill chips fill the situation text and never auto-generate.
- [x] Back preserves typed text within the sitting.
- [x] Keyboard grid navigation in the lobby.
- [x] Private card fields (hard-moment line, fear, likelihoods, notes) go to `lib/practice/private-state.ts` only. The draft body carries goal as today, never the hard-moment line or fear.
- [x] Lobby/briefing states in `/design-preview` with `data-gallery-state` markers.

## Verification evidence

All automated, October 4, 2026, ~00:35 EDT, on `agent/1b-lobby-briefing`. No provider calls, no live call, no migrations. **Live not verified.**

- `npm run typecheck`: pass.
- `npm test`: 25 files, 471 tests pass, including the new `tests/unit/lobby-briefing.test.ts` (22 tests) and the unchanged `ui-rules.test.ts` (new CSS uses tokens only, `:focus-visible` everywhere, no opacity-only disabled, Lucide only).
- `npm run build`: pass (dev server stopped first).
- `tests/unit/lobby-briefing.test.ts` covers: R1 templates name the person and suggest a goal only when empty; chips are `type="button"` and the only submit is "Set up the scene"; briefing prefill from the default situation (starter and saved person); plans for untouched starter (preset start, no setup call), untouched saved person (default situation), chosen saved situation, edited text (draft with `personId`), someone new (name and relationship framed into the text); empty/over-long text gives no plan; with the hard-moment line, prediction and likelihood set in private state, no plan contains them and every draft body passes `draftRequestSchema`; lobby renders 5 / 6 / 17 cards for 0 / 1 / 12 people; Jordan first among starters; "Start here" only on first run; portrait `src` is `/api/portraits/{preset}` with a monogram fallback when absent; inline retry on error keeps starters; practiced-first ordering; grid arrow/Home/End movement across two grids; lobby lists exactly the people given (owner scoping is the route's, covered by `people-routes.test.ts`); `listPersonSituations` URL/404 typed error; `getPracticeHistory` parse and unknown preset rejected.
- Mock browser (Playwright script against `/design-preview` on port 3102, 1440 and 390 px, not a committed spec): picked Jordan, typed, Back, re-picked: text kept; "Say no" chip filled "I need to say no to Jordan when they ask me to ___." and stayed on the briefing; ArrowRight/ArrowDown moved focus between cards by position; `N` opened Someone new. Only console error is the existing primitives gallery's intentional missing-image 404. Screenshots reviewed for empty lobby, 12 people, briefing (saved person, Jordan, someone new). No browser spec added, because `npm run test:ui` is the coordinator's.
- Contrast: the "Start here" badge uses a clay border with ink text, because clay fill with small text is under 4.5:1 with either ink or surface (measured ≈3.8:1).

## Handoff

- Changed paths: `lib/practice/skill-templates.ts` (new), `lib/people/api-client.ts` (adds `listPersonSituations`, `getPracticeHistory`; reads only), `components/ui/person-card.tsx` + `.module.css` (new), `components/practice/lobby.tsx` + `.module.css` (new), `components/practice/briefing.tsx` + `.module.css` (new), `app/design-preview/lobby-briefing-gallery.tsx` (new) and `page.tsx` (one import), `tests/unit/lobby-briefing.test.ts` (new), this record. `components/practice/briefing-stage.tsx` and `app/practice/page.tsx` are unchanged so `main` stays green until the wiring lands.
- Gallery states (`data-gallery-state`): `lobby-interactive`, `lobby-empty`, `lobby-one`, `lobby-twelve`, `lobby-loading`, `lobby-error`, `lobby-disabled`, `briefing-starter-jordan`, `briefing-person`, `briefing-person-loading`, `briefing-someone-new`, `briefing-generating`, `briefing-error`.
- Component contracts:
  - `<Lobby people status practicedPresets onRetry onPickPerson onPickStarter onSomeoneNew onAddStarter? onEditPerson? onDeletePerson? disabled? disabledReason? focusHeading? notice? />`. Delete has an inline confirm; Add/Delete take promises and announce the result.
  - `<Briefing subject draft onDraftChange situations? onBack onSetUp(plan) generating? error? disabled? focusHeading? />`. `subject` is `{kind:"person",person} | {kind:"starter",preset} | {kind:"new"}`. Goal and hard-moment line are read and written only through `lib/practice/private-state.ts`.
  - `briefingPlan()` returns one of `preset`, `person-default`, `person-situation`, `draft` (`DraftRequest` with `situation`, optional `goal`, optional `personId`). No branch carries the hard-moment line, fear, likelihoods or notes.
  - `useBriefingDrafts()` keeps typed text per subject for the sitting; `clear()` belongs next to `clearPrivateState()`.
- Proposed shared-file changes (coordinator applies; exact wiring for `app/practice/practice-workspace.tsx`):

```diff
-import { BriefingStage } from "@/components/practice/briefing-stage";
+import { Briefing, useBriefingDrafts, type BriefingPlan, type BriefingSubject } from "@/components/practice/briefing";
+import { Lobby } from "@/components/practice/lobby";
-import { createPerson, getPerson, listPeople, updatePerson } from "@/lib/people/api-client";
+import { createPerson, deletePerson, getPerson, getPracticeHistory, listPeople, listPersonSituations, updatePerson } from "@/lib/people/api-client";
+import { readPrivateState } from "@/lib/practice/private-state";
+import type { PersonSituation } from "@/lib/schemas/people";
@@ PracticeWorkspace
-  const [flow, setFlow] = useState<FlowState>(() => createFlowState("briefing"));
+  const [flow, setFlow] = useState<FlowState>(() => createFlowState("lobby"));
+  const [subject, setSubject] = useState<BriefingSubject | null>(null);
+  const briefingDrafts = useBriefingDrafts();
+  const [situations, setSituations] = useState<{ status: "loading" | "ready" | "error"; items: PersonSituation[] }>({ status: "ready", items: [] });
+  const [practicedPresets, setPracticedPresets] = useState<SessionPreset[]>([]);
+
+  function openBriefing(next: BriefingSubject) {
+    showStage({ type: next.kind === "new" ? "pickSomeoneNew" : "pickPerson" });
+    setSubject(next); setGenerateError(null); setHeaderMessage("");
+    if (next.kind !== "person") return;
+    setSituations({ status: "loading", items: [] });
+    listPersonSituations(next.person.id).then(
+      (items) => setSituations({ status: "ready", items }),
+      (error) => { if (isAuthError(error)) handleAuthLoss(); else setSituations({ status: "error", items: [] }); });
+  }
+
+  function setUp(plan: BriefingPlan) {
+    const goal = readPrivateState().goal.trim();
+    switch (plan.kind) {
+      case "preset": applyExample(plan.preset); if (goal) setReviewGoal(goal); return;
+      case "person-default":
+      case "person-situation":   // person-situation starts like person-default until 1C accepts `situation` start bodies
+        if (subject?.kind === "person") { setSavedPerson(subject.person); showStage({ type: "draftReady" }); }
+        return;
+      case "draft": void generate(plan.request); return;
+    }
+  }
@@ generate()
-  async function generate() {
-    if (generating || authLostRef.current || !situation.trim()) return;
+  async function generate(request: DraftRequest) {
+    if (generating || authLostRef.current) return;
     const generation = ++generationRef.current;
-    const request: DraftRequest = { situation: situation.trim() };
-    if (intent.trim()) request.goal = intent.trim();
-    if (privateNotes.trim()) request.privateNotes = privateNotes.trim();
@@ (the meet "Regenerate" prop keeps the last request: store it in a ref before calling generate)
@@ choosePerson / openPerson (?person= deep link): open the briefing instead of skipping to Meet
-    apply({ type: "pickPerson" });
-    apply({ type: "draftReady" });
-    setSavedPerson(person);
+    openBriefing({ kind: "person", person });
@@ leavePerson / backToDescribe / returnToBriefing: Meet's Back returns to the briefing (unchanged reducer `back`)
@@ clearPrivateSetup()
+    briefingDrafts.clear(); setSubject(null);
@@ onPageShow (bfcache restore)
-        const state = createFlowState("briefing");
+        const state = createFlowState("lobby");
@@ render, replacing the <BriefingStage …/> branch
-        : <BriefingStage … />
+        : flow.stage === "briefing" && subject
+          ? <Briefing subject={subject} draft={briefingDrafts.draftFor(subject)} onDraftChange={(patch) => briefingDrafts.update(subject, patch)}
+              situations={subject.kind === "person" ? situations : undefined} onBack={() => showStage({ type: "back" })} onSetUp={setUp}
+              generating={generating} error={generateError} disabled={signingOut} disabledReason="Signing you out…" focusHeading={moveFocus} />
+          : <Lobby people={people} status={peopleStatus} practicedPresets={practicedPresets} onRetry={() => void loadPeople()}
+              onPickPerson={(person) => openBriefing({ kind: "person", person })} onPickStarter={(preset) => openBriefing({ kind: "starter", preset })}
+              onSomeoneNew={() => openBriefing({ kind: "new" })}
+              onAddStarter={async (preset) => { const { wants: _w, holdsBackBecause: _h, softensWhen: _s, ...role } = examples[preset].role; await createPerson(roleToPersonFields(role)); await loadPeople(); }}
+              onEditPerson={(person) => router.push(`/practice/people/${encodeURIComponent(person.id)}`)}
+              onDeletePerson={async (person) => { await deletePerson(person.id); await loadPeople(); }}
+              disabled={signingOut || generating} disabledReason="Please wait a moment." focusHeading={moveFocus} />
+  // on mount: getPracticeHistory().then(setPracticedPresets, () => undefined)  (404 until 1G lands is fine)
```

  - Remove the now-unused `situation`, `intent`, `privateNotes` state and `setUpManually` (manual setup is reachable by editing the Meet card after a draft; the coordinator may keep an "Enter setup manually" link if wanted).
  - `onAddStarter` must strip the stance fields first: `roleToPersonFields` parses `personFieldsSchema` (strict, no stance), so passing `manager` as-is throws.
- **`lib/practice/flow.ts` proposal:** `pickPerson`/`pickSomeoneNew` always set `clearPrivate: true`. Going Back to the lobby and re-picking the same person therefore clears the goal and hard-moment line, although the situation text (held by `useBriefingDrafts`) survives. Proposal: add `{ type: "pickPerson"; resume?: boolean }` that skips `clearPrivate` when re-entering the same subject in the sitting; the workspace sets `resume` when `briefingKey(next) === briefingKey(subject)`.
- Remaining failures/risks: (1) `person-situation` plans can't send `situation` until 1C removes the start-route guard; until then they start with the default situation. (2) The starter draft frames the edited text as "With Jordan (Manager): …", so the setup model may still rename the character; a starter-with-`personId`-like path would need a contract change. (3) "Coming up" ordering waits on B1; practiced-first uses `hasPracticed`, which 1G derives. (4) The card → briefing morph (`<ViewTransition>`) is 1F's. (5) Portraits load from the signed-in route; the gallery passes `null`, so the real images are not visually verified. Live not verified.
- External account action: none
- Ready for review: yes (draft PR)
- Coordinator integration: pending

The writer owns this handoff; the coordinator records integration and updates STATUS.
Follow [documentation rules](../20-DOCUMENTATION-STANDARD.md) and
[agent/worktree workflow](../19-AGENT-WORKFLOW.md). Do not copy private prompts,
transcripts, credentials, or personal account identifiers into this record.
