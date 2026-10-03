# G2-03: Describe, generate, review/edit, then start

Status: integrated
Updated: October 3, 2026, 16:47 EDT
Assigned writer: G2-03 background subagent
Coordinator: Cursor coordinator session
Gate: G2
Requirements/tests: G2 editable setup acceptance, docs/02 Prepare + Persona review, T01 (private notes labeled and never sent to start), T13 (auth loss clears transient private content)
GitHub issue: [#14](https://github.com/esaba12/conversaton-practice/issues/14)
Pull request: not opened (coordinator integrates on `build/g2-generation`)
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `build/g2-generation` from `main` `1c9506d48996be77188c7512caa071363d598270`, plus the coordinator contract commit recorded in STATUS.
- Branch: `build/g2-generation` (shared checkout; coordinator is the only Git writer)
- Worktree: `/Users/ethansaba/code/therapist`
- Dev port: N/A (no dev server, build, Playwright, or live provider calls)
- Owned files: `components/presentation/setup-*.tsx` and `components/presentation/setup.module.css` (new), `app/practice/practice-workspace.tsx`, `lib/session/api-client.ts`, `tests/unit/api-client.test.ts`, this record.
- Shared resources: `lib/schemas/**` frozen; `components/presentation/practice.tsx` and `app/design-preview/**` are not owned — keep `PracticeSetup`/`PracticeCall` exports working (design preview imports them). Browser tests under `tests/browser/**` are coordinator-owned; list selectors/text you changed in the handoff so the coordinator can update them.
- Dependency tasks and contract revisions: frozen `draftRequestSchema`/`draftResponseSchema` (`lib/schemas/draft.ts`), `startRequestSchema` role branch (`lib/schemas/session.ts`), `OUT_OF_SCOPE` error code. Server route `POST /api/scenarios/draft` is built in parallel by G2-01; code against the schema.
- Unblock condition: none.

## Scope and acceptance

Outcome: a signed-in user describes a situation, gets an editable generated setup, reviews/edits it, and starts the live call with that exact role.
Non-goals: saved personas/profiles (G3), reflection, presets beyond one optional roommate example shortcut.

- [ ] `api-client.ts`: add `generateDraft(input: DraftRequest): Promise<DraftResponse>` using the existing `post` helper and `draftResponseSchema`; change `startSession` to take `{ role: RoleContext, durationSeconds, idempotencyKey? }` and send `{ idempotencyKey, role, durationSeconds }` only (no goal, no notes). Unit tests for both, including that the start body has exactly those keys and that private notes are never in it.
- [ ] Describe step (`setup-describe.tsx`, pure props): situation textarea (required, max 1000, counter), "What do you want to say or do?" (optional, max 200), "Private preparation notes" (optional, max 1000) labeled "Never shared with the character". Generate button; generating state with `aria-busy`/status text; an "Enter setup manually" link.
- [ ] Review step (`setup-review.tsx`, pure props, controlled fields): name, role, style, "What this character knows" (publicContext), opening line, constraints (up to 5, add/remove), challenge (supportive/neutral/mild pushback), pace (patient/conversational), goal (shown as "Your goal — not shared with the character"), assumptions listed read-only for review. Field limits mirror `roleContextSchema`; Start disabled until the role parses with `roleContextSchema`. "Back"/"Regenerate" keep inputs. Private notes are not shown in or copied to any role field.
- [ ] Manual fallback: on generation failure (network/503/malformed) keep all inputs, show the message and a "Set up manually" action that opens the same review form with empty/neutral fields, visibly labeled "Manual setup — not generated". `OUT_OF_SCOPE` shows the server message plus a suggestion to describe an everyday conversation; no manual bypass prompt for that case beyond the normal manual link.
- [ ] Workspace: replace the fixed roommate/GOAL with the reviewed role + goal state; `PracticeCall` gets the reviewed name and goal. Start calls `startSession({ role, durationSeconds })`. Each Start uses a fresh idempotency key and a fresh call (no history). "Back to setup" after End returns to review with the same role (edit or start again). Auth loss/sign-out clears situation, notes, draft and goal state. Keep all existing teardown logic intact.
- [ ] Accessibility: labels for every field, keyboard-only flow, visible focus, status regions for generating/errors, mobile layout readable. Warm minimal style per docs/02 (reuse existing CSS variables).
- [ ] `npm run typecheck` (excluding other workers' in-progress files) and `npx vitest run tests/unit/api-client.test.ts` pass.

## Contract and documentation changes

- Inputs/outputs/errors: frozen schemas only.
- Shared change: none expected; list browser-test selector changes in the handoff.
- Updated specs: coordinator updates docs/02 if behavior differs.

## Verification evidence

Mode: unit/static only. Uncommitted changes over `346b61d`; no build, dev server, Playwright, or provider/network calls.

- `npx vitest run tests/unit/api-client.test.ts` — 1 file, 11 tests passed. Covers: start body has exactly `idempotencyKey`, `role`, `durationSeconds` and parses with `startRequestSchema`; a role object carrying extra `goal`/`privateNotes` keys is stripped to the 8 role keys and the raw body contains neither value; fresh idempotency key per call; 409 `SESSION_ACTIVE` session id; malformed responses; network retryable; end keepalive; `generateDraft` posts situation/goal/privateNotes only to `/api/scenarios/draft`, omits absent optionals, rejects a draft role with extra fields, surfaces `OUT_OF_SCOPE` (422) and `PROVIDER_UNAVAILABLE` (503) codes/messages.
- `npm run typecheck` — passed (whole repo, including other workers' in-progress files at the time of the run).
- `npm test` — 6 files, 66 tests passed.
- ESLint: not run (no `eslint.config.*` in the repo).
- Not verified: rendered UI, keyboard/focus flow, mobile layout, screen-reader announcements, live draft route, and live start with a reviewed role. These need coordinator browser/live checks.

## Handoff

- Changed paths (uncommitted): `lib/session/api-client.ts`, `tests/unit/api-client.test.ts`, `app/practice/practice-workspace.tsx`, new `components/presentation/setup-describe.tsx`, `components/presentation/setup-review.tsx`, `components/presentation/setup.module.css`, this record.
- UI flow: `/practice` opens **Describe** (situation required ≤1000 with counter; "What do you want to say or do?" optional ≤200; "Private preparation notes" optional ≤1000, tagged "Never shared with the character"). "Generate setup" calls `generateDraft` and shows "Drafting your setup…" (`role="status"`, `aria-busy`). Success opens **Review**, labeled "Generated draft — review and edit", with controlled fields: Name, Role, How they talk (style), What this character knows (publicContext), Opening line, constraints (add/remove, up to 5; blank rows ignored), Challenge and Pace radios, and "Your goal" tagged "Not shared with the character". Assumptions show read-only under "Assumptions to check". Start is disabled until `roleContextSchema` parses, with a "Still needed: …" hint. Failure (network/503/malformed/other) keeps inputs and shows "We couldn’t generate a setup right now." in a `role="alert"` region plus a "Set up manually" button. `OUT_OF_SCOPE` shows the server message plus an everyday-conversation suggestion and no extra manual button. "Enter setup manually" and "Use roommate example" links are always available; they open Review labeled "Manual setup — not generated" (empty fields, neutral/patient, goal prefilled from the user's intent) or "Example setup — not generated" (fixture). "Back" returns to Describe with inputs kept. "Regenerate" (shown when a situation exists) replaces the draft, or on failure keeps the current setup and shows an alert. Start sends `startSession({ role, durationSeconds: 180, idempotencyKey: crypto.randomUUID() })`. The call view receives the started role's name and goal (fallback goal "Say what matters to you."). "Back to setup" after End returns to Review with the same role. Sign-out and auth loss (`SIGNED_OUT`/401) clear situation, intent, notes, the review role/goal/assumptions, the call name/goal, and any in-flight generation. Nothing is written to storage. Heading focus moves on step changes. Media, teardown, and auth-loss ordering are unchanged.
- Browser-test impact: no current `tests/browser/**` spec covers signed-in `/practice`, so none should break. The signed-in setup no longer uses `PracticeSetup` (design preview still does; exports unchanged). New accessible names for future specs: buttons "Generate setup", "Enter setup manually", "Use roommate example", "Set up manually", "Start practice", "Back", "Regenerate", "Add constraint", "Remove constraint N", "End previous practice"; labels "The situation", "What do you want to say or do? Optional", "Private preparation notes Optional", "Name", "Role", "How they talk", "What this character knows", "Opening line", "Your goal", "Constraint N"; radio groups "Challenge" (Supportive/Neutral/Mild pushback) and "Pace" (Patient/Conversational). Note: the review heading "What this character knows" is now a label, not an `h3`.
- Remaining failures/risks: (1) The UI is not browser-verified. (2) Sign-out clears setup content immediately, even if sign-out then fails (privacy-first). (3) Regenerate discards edits made in review. (4) The goal isn't required to start; an empty goal shows the fallback text in the call. (5) The server must accept the `role` start branch (G2-02) and the draft route (G2-01) before a live run.
- Proposed shared changes: docs/02 Persona review currently lists directness/formality/talkativeness/voice; this UI uses the frozen `roleContextSchema` fields (style, challenge, pace) instead. Coordinator may want to align docs/02.
- External account action: none
- Next smallest task: coordinator browser check of describe → generate (mocked route) → review → start, plus manual and out-of-scope paths and keyboard/mobile; then a live run once G2-01/G2-02 are integrated.
- Ready for review: yes
- Coordinator integration: pending
