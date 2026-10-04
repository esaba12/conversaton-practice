# Build plan: from today's app to the wow

Status: **planning, not built.** Written October 3, 2026, 22:10 EDT against `main` at `eff6014`. The experience target is [01-THE-WOW](01-THE-WOW.md). Behavior specs: [docs/30](../30-ONE-MOMENT-RETRY.md), [docs/32](../32-FEATURE-SPECS.md), [04-NEW-SPECS](04-NEW-SPECS.md). Visuals: [docs/33](../33-DESIGN-SYSTEM-AND-SCREENS.md). Shared contract and migration changes: [03-CONTRACTS](03-CONTRACTS.md).

This keeps the phase order in docs/31 §5 and places every decided spec on a phase. Two changes to that order, both for wow per effort:

1. **Hero path first.** Phase 1 integrates one thin, end-to-end path (lobby → briefing → meet → green room → ringing → call → today's reflection) with Jordan (W2) before deepening any screen. This is the "one tested vertical slice before adding features" rule (AGENTS.md).
2. **Skills chips (R1) move into Phase 1**, because the briefing uses them and they are only templates.

## 0. Working rules for this plan

- **Coordinator** owns `STATUS.md`, `lib/schemas/**`, `supabase/**`, `scripts/preflight/**`, `scripts/demo/**`, `package.json`/lockfile, provider configuration (PALs, env), numbered specs, and integration. It freezes each phase's contracts (03-CONTRACTS) **before** dispatching that phase's workers.
- After 0C merges, `app/practice/practice-workspace.tsx` and `lib/practice/flow.ts` are **integration entrypoints owned by the coordinator**. Workers export stage components with typed props and the coordinator wires them in. Slice 2A is the one explicit reassignment of `flow.ts`, for the retry stages.
- **Up to three workers** at a time, each in its own worktree and branch (`agent/<slice-id>`), from the coordinator's frozen contract commit. Ports: worker dev servers 3101, 3102, 3103. Playwright port 3100 is shared: one `npm run test:ui` at a time, coordinator schedules it. Preflight port 3000 is coordinator-only.
- **One live Tavus call at a time**, coordinator or human only. Workers never call providers.
- Each slice gets a task record `docs/tasks/<ID>.md` from the template, a GitHub issue and a draft PR. The coordinator integrates one PR at a time and runs the verification recipe after each.
- **UI quality gate** (every PR that changes UI): states added to the gallery, screenshots at 390/900/1440 px, the UI rule test, and a recorded review ([05-UI-UPGRADE](05-UI-UPGRADE.md) §6).
- **Verification recipe** (every integration): `npm run typecheck`, `npm test`, `npm run build`, `npm run test:ui`; SQL tests for any migration; `auth-database-check.mjs` flags already in use plus the new ones named below. Every phase stays **live not verified** until the human reports a live check.
- **Never in counterpart context** (applies to every slice, repeated per slice only where it is a real risk): goal, hard-moment line, private notes/prep, fear and likelihoods, feedback style, goal-light state, check-ins, brave things, unshared About-me facts.
- No dependency upgrades. No new dependency without an owner decision. Approved October 3, 22:35 EDT: `lucide-react` and `motion`, added by the coordinator in 0A's contract commit (05-UI-UPGRADE §8). Rive is not approved.

## 1. Phase map

| Phase | Theme | Slices | Migration | Exit check |
|---|---|---|---|---|
| 0 | Foundation | 0A tokens · 0B provider spikes + quality PAL · 0C flow refactor · 0D video-first · 0E UI rules + quality gate | none | Recipe green; spike record; human A/B old vs new PAL |
| 1 | Stage the call (hero path) | 1A call screen · 1B lobby + briefing · 1C person/situation server · 1D meet + green room · 1E goal light + voice preview · 1F motion + sound · 1G show me first | M1 | Mock browser hero path with teardown at every stage; private fields absent from all bodies; human hero call |
| 2 | Close the loop | 2A recap + retry · 2B reflection server · 2C pocket card + feedback style · 2D landing | M2 | docs/30 acceptance list; no score fields; pocket card offline |
| 3 | Bridge to real life | 3A planned date + check-in · 3B brave things · 3C appearance catalog · 3D people restyle · 3E demo seed | M3 | Two-owner SQL isolation; deletion covers new tables; preset ids server-mapped |
| 4 | Reach | 4A clarifying chips · 4B presence ladder · 4C curveballs · 4D languages | none expected | Per-spec acceptance |

## 1a. Compressed finish (owner, October 4, 01:47 EDT)

Owner is short on time: build through Phase 3, combined and simplified. Phase 4 is out. This section overrides §4 and §5 where they differ.

| Slice | Covers | Simplification |
|---|---|---|
| X Recap loop | 2A + 2B (L1, docs/30 retry, W4 after, W7, Q2 chips, `quotedLine`, A1, feedback style wording) | One worker owns recap UI, reflection server and `lib/schemas/reflection.ts` |
| Y Keep it | 2C + 3A (L2 pocket card, L3 feedback style, B1 date, B2 check-in with the "Talked for real" mark, W4 storage) | Feedback style is device-only (`localStorage`), so Phase 2 needs no migration |
| Z Faces + landing | 3C + 2D (B4 "Look and voice", R6 landing) | Catalog is the four starter faces/voices only (existing PALs, no new provider setup); landing has no recorded clip |
| Seed | 3E (W8) | Coordinator, after X–Z |

Cut: 3B brave things, 3D people restyle (except the "Talked for real" mark, which Y owns), the 2D recorded clip, new catalog PALs, all of Phase 4. One migration (**M23**: planned conversations with W4 fields, `people.preset_id`) with a two-owner SQL test and delete-all coverage. Exit: recipe green, hero path still passes, two-owner checks on the new tables, live not verified unless the owner runs a call.

## 2. Phase 0: Foundation

Three lanes run in parallel; 0D starts after 0C merges.

### 0A. Design tokens, type and primitives (worker)
- **Specs:** docs/33 §2–3 (tokens, serif, radius, motion, reduced motion), components Portrait, Chip, Primary button, Private card.
- **Owned:** `app/globals.css`, `app/layout.tsx` (font only), `components/ui/**` (new), `lib/ui/motion.ts` (spring presets), `app/design-preview/**`, `tests/unit/ui-*.test.ts`. The coordinator adds `lucide-react` and `motion` to `package.json` and the lockfile before dispatch.
- **Notes:** choose the serif by rendering Fraunces, Newsreader and Source Serif 4 at 56 and 20 px with real names in `/design-preview`; record the choice and a screenshot in the task file. Contrast values marked "verify" in docs/33 are measured and recorded.
- **Acceptance:** existing pages unchanged in layout (screenshot diff by eye, recorded); tokens exist under the documented names; reduced-motion media query disables transitions; contrast table recorded with measured ratios. **Size:** M.

### 0B. Provider spikes and the quality PAL (coordinator)
- **Specs:** Q1, T1, W3 spike, W5 spike Q4, W6 spike; R04 §7 unknowns.
- **Owned:** `scripts/preflight/provider-setup.mjs`, `.env.local` (never committed), `.env.example` (names only), `docs/tasks/SPIKE-01-quality-pal.md`.
- **Record, with exact HTTP outcomes and no payloads:** TTS model accepted (`eleven_v4_turbo`, then `eleven_v3_conversational`); audio-tag behavior; Pro faces available on this account; face preview/thumbnail fields and terms; `append_context` timing (mid-turn vs next turn); `conversation.respond` latency; `max_call_duration` counted from create or join; whether direct ElevenLabs TTS matches the PAL voice.
- **Create** the stand-in PAL for W10: quality PAL settings, its own premade voice, and a fixed stand-in face that no person preset uses. Audition it in the same session as the A/B.
- **Create** the quality PAL with T1 perception (`raven-1`, `emotion_recognition: full`, no visual or analysis queries), `idle_engagement: patient`, chosen interruptibility, the explicit LLM. Readback verified. Old PAL id kept for rollback. **Switch `TAVUS_PAL_ID` only after the human A/B call.**
- **Acceptance:** spike record complete; readback matches; test-mode create and hard-delete pass; A/B notes dated and attributed to the human. **Size:** M.

### 0C. Flow state machine refactor, W1 (worker)
- **Owned:** `app/practice/practice-workspace.tsx`, `lib/practice/**` (new), `components/practice/**` (new), `tests/unit/practice-flow.test.ts`.
- **Acceptance:** W1 list. No visible change; all existing tests pass. **Size:** M. **Blocks:** 0D and all of Phase 1's UI.

### 0D. Video-first media, Q3 (worker, after 0C)
- **Owned:** `lib/media/daily-controller.ts`, `components/practice/remote-media.tsx`, `tests/unit/daily-controller.test.ts`.
- **Acceptance:** Q3 list: audio unmutes only after video `playing`; no audio-only fallback; End stops all tracks. **Size:** S.

### 0E. UI rules and quality gate (coordinator + worker)
- **Specs:** 05-UI-UPGRADE §2 and §6.
- **Owned:** `tests/unit/ui-rules.test.ts` (worker), `app/design-preview/**` state gallery expansion (worker; shared with 0A, so 0A merges first), `scripts/ui/screenshots.mjs` (coordinator), the §2 rules added to the top of docs/33 (coordinator).
- **Acceptance:** rule test fails on a planted raw hex, `opacity` disabled state and bare `outline: none` (negative control), then passes on the integrated head with existing violations fixed or listed in the task file; screenshot script writes all gallery states at three widths into an ignored folder. **Size:** S–M.

**Phase 0 exit:** recipe green on the integrated head; UI gate in place; SPIKE-01 complete; human A/B call recorded (or "live not verified" with the reason).

## 3. Phase 1: Stage the call

**Coordinator first:** freeze contracts C1 (03-CONTRACTS §2) and apply migration **M1** with its SQL test. Then dispatch 1A, 1B, 1C in parallel; 1D, 1E, 1F follow as lanes free up.

**Starter faces (owner, 22:41 EDT; the first half of B4).** In C1 the coordinator also: picks a distinct phoenix-4.5 stock face and premade voice for each starter (Jordan, Alex, Ellis, Sam), never the stand-in face; creates one PAL per voice with the quality PAL settings (after the A/B decides those settings); adds the server-only starter map (03-CONTRACTS §2.9). 1C resolves the starter's face and PAL on preset starts; 1B and 1D show the portraits; 1E's voice preview uses the starter's voice. The "Look and voice" picker for saved people and the rest of the ~8-face catalog stay in 3C.

**Hero-path checkpoint (after 1A, 1B, 1C, 1D, 1G):** Jordan from the lobby → briefing → Meet card → green room → **Show me first** → Your turn → ringing → call → End → today's reflection panel. Show me first is built into the main flow (owner, 22:25 EDT), so it is part of the first vertical slice, not a later add-on. Mock browser test `tests/browser/hero-path.spec.ts` (coordinator-owned), plus one human live call. Only after the checkpoint do 1E and 1F integrate.

Dispatch order inside Phase 1, with three lanes: 1A, 1B and 1C first. Then 1D (after 1B) and 1G (after 1C, reusing 1A's call shell). Then 1E and 1F.

### 1A. Call screen: S3, S4, S5, S6, W9 call bar (worker)
- **Owned:** `components/practice/ringing*.tsx`, `components/practice/call-*.tsx`, `components/practice/call.module.css`, `lib/media/interactions.ts` (new: typed builders for `append_context`, `interrupt`, `respond`), `lib/media/daily-controller.ts` (event parsing for `utterance.streaming`, `started/stopped_speaking`; ignore `user_audio_analysis`), `components/presentation/captions*` (restyle), tests.
- **Migration:** none.
- **Kept out of counterpart context:** wrap-up and ask-to-wait texts are fixed templates plus the reviewed name only. Typed turns are conversation, like speech.
- **Acceptance:** S3, S4, S5, S6 lists; W9 Help and "Fictional AI" pill always present; cancel during ringing tears down; controls fade but stay in the accessibility tree; 56 px targets. **Size:** L.

### 1B. Lobby and briefing: P1, P3, W2 (UI), R1 chips (worker)
- **Owned:** `app/practice/page.tsx`, `components/practice/lobby*.tsx`, `components/practice/briefing*.tsx`, `components/ui/person-card.tsx`, `lib/practice/skill-templates.ts`, `lib/people/api-client.ts` (read additions only), tests.
- **Migration:** reads M1 fields (`background`, default situation, saved situations).
- **Kept out:** the private card fields go to `lib/practice/private-state.ts` only; draft body carries goal as today, never the hard-moment line or fear.
- **Acceptance:** P1 and P3 lists; Jordan first in starters; skill chips fill and never auto-generate; back preserves typed text in the sitting; keyboard grid navigation. **Size:** M.

### 1C. Person/situation server: P2, Q2 server, W2 fixture, W11 streamed draft (worker)
- **Owned:** `lib/setup/**`, `app/api/scenarios/draft/route.ts`, `lib/session/server.ts`, `app/api/sessions/route.ts`, `lib/data/people.ts`, `lib/data/person-context.ts`, `lib/data/person-situations.ts` (new), `app/api/people/[id]/situations/**` (new), tests (`setup-generate`, `session-server`, `person-context`, `people-routes`).
- **Migration:** M1 (coordinator-applied before dispatch).
- **Kept out:** setup model sees identity + typed situation only, not shared facts or private prep; FIX-01 probe extended to `wants`, `holdsBackBecause`, `softensWhen` and every situation field; start body never carries identity or fact text for a saved person.
- **Acceptance:** P2 and Q2 lists; W11: an event-stream draft emits completed fields then one validated `done`, a probe failure emits an error and no `done`, private notes never appear in any event, and a JSON request is unchanged; draft with another owner's `personId` → 404; stale version → 409; `buildRoleContext` snapshot has the stance instruction, freeze rule and emotional-delivery line, and no goal; existing presets validate; docs/26 two-user checks pass (`auth-database-check.mjs --g3 --g3-ui`, plus new `--p2`). **Size:** L.

### 1D. Meet card and green room: S1, S2, W4 (before), U1 streaming UI, U2 knowledge panel, T1 and D2 notices (worker, after 1B)
- **Owned:** `components/practice/meet*.tsx`, `components/practice/green-room*.tsx`, `lib/practice/mic-meter.ts`, `lib/practice/devices.ts`, tests.
- **Kept out:** prediction, fear and likelihood stay in private state; the stance chips are counterpart context the user sees and edits.
- **Acceptance:** S1 and S2 lists; mic stream released on leave, on ready (handed to Daily) and on error; tone notice on both screens; reflection disclosure line present; the identity renders before the draft returns and fields fill as they stream (U1); the U2 "Knows" list matches the start body's role fields by name, and "Never sees" lists only fields the user filled. **Size:** M.

### 1E. Goal light and voice preview: G1, W3 (worker)
- **Owned:** `app/api/sessions/[id]/goal-check/route.ts`, `lib/goal-check/**`, `app/api/voice-preview/route.ts`, `lib/voice-preview/**`, `components/practice/goal-pill.tsx`, `components/practice/hear-button.tsx`, tests.
- **Kept out:** goal and user turns go only to our goal-check route, never to Tavus; counterpart turns are not sent; voice preview receives only the opening text.
- **Acceptance:** G1 and W3 lists; off sends nothing; rate limits enforced; `store:false`; no voice ids in the bundle. **Size:** M.

### 1F. Motion and sound: docs/33 morph, R7 (worker)
- **Owned:** `components/practice/transitions.tsx`, `lib/practice/sound.ts`, About-me "Sounds" toggle (stored in `localStorage`, device-only, no migration), tests.
- **Notes:** synthesize ring, connect and hang-up with Web Audio oscillators and envelopes, so there are no audio files to license. ≤1.5 s except ring.
- **Acceptance:** card → briefing → ringing → call → recap morphs with `<ViewTransition>`; reduced motion uses ≤150 ms fades; no sound when the toggle is off or on errors. **Size:** M.

### 1G. Show me first: W10 (worker, after 1C; part of the hero checkpoint)
- **Specs:** W10.
- **Owned:** `components/practice/stand-in*.tsx` (call variant, Your-turn card), `lib/practice/stand-in-client.ts` (the only client function that may send the goal), `lib/session/stand-in-context.ts` (server-only `buildStandInContext`), stand-in branch in `lib/session/server.ts` (1C has merged by then, so 1G takes that file for this slice), tests.
- **Migration:** `practice_sessions.kind` from M1.
- **Kept out:** of the counterpart, everything as before, including the goal. Of the stand-in: notes, prep, fear, likelihoods, About-me facts, traits and stance chips.
- **Also owned:** `app/api/practice-history/route.ts`, the `hasPracticed` derivation in `lib/data/people.ts` (1C has merged by then).
- **Acceptance:** W10 list 1–8. **Size:** M.

**Phase 1 exit:** hero-path browser test green, including the Show me first → Your turn → call path; teardown releases mic and camera from green room, ringing, call, sign-out and page hide; private-field omission tests cover draft, start, reflect, goal-check and voice-preview bodies; human hero call recorded against the 01-THE-WOW §3 bars for moments 1–8, or "live not verified".

## 4. Phase 2: Close the loop

**Coordinator first:** contracts C2 and migration **M2** (feedback style).

### 2A. Recap and retry: L1 UI, docs/30, W4 (after), W7, Q2 dropdown (worker)
- **Owned:** `components/practice/recap*.tsx`, `lib/practice/flow.ts` (retry stages; reassigned from the coordinator to this slice for Phase 2 only), `components/presentation/reflection-*` (replace), tests.
- **Kept out:** retry start uses the reviewed role with `opening` replaced; no goal, hard-moment line or transcript in the body.
- **Acceptance:** docs/30 acceptance 1–8; L1 list; reflection starts after a 1.5 s grace with Skip; W4 and W7 lists; "How {name} was played" closed by default, chips only. **Size:** M.

### 2B. Reflection server: `quotedLine`, feedback style, A1, docs/30 step 5 (worker)
- **Owned:** `lib/reflection/**`, `app/api/sessions/[id]/reflect/route.ts`, `app/api/sessions/[id]/alternative/route.ts` (if A1 uses a separate route; coordinator decides in C2), tests.
- **Acceptance:** `quotedLine` is a verbatim substring of a user turn (server rejects otherwise and returns `null`); never counterpart text; feedback style changes wording only (fixtures for all three); A1 fixtures keep the request intact; no score fields; prompt version bumped. **Size:** M.

### 2C. Pocket card and feedback style: L2, L3 (worker)
- **Owned:** `components/practice/pocket-card*.tsx`, `lib/pocket-card/**` (canvas PNG export), `app/practice/about-me/**` (feedback style control), `app/api/preferences/route.ts`, `lib/data/preferences.ts`, tests.
- **Acceptance:** L2 list (renders and exports offline, no network on export); L3 list; the pocket card works with no date, and "Add a day (optional)" is a quiet link, not a step (D8 answer). **Size:** M.

### 2D. Landing: R6 + U7 (worker)
- **Owned:** `app/page.tsx`, `components/site/**`, `public/demo/**` (the recorded clip, added by the coordinator after a human-recorded hero run).
- **Acceptance:** R6 list; the live Meet card works with no network request (browser test asserts zero fetches on interaction); clip labeled "Recorded demo with a fictional AI character", captioned, muted, no autoplay sound; reduced motion shows a still. **Size:** S–M.

**Phase 2 exit:** recipe green; docs/30 acceptance list recorded; human retry call ("counterpart opened disappointed; user ended cleanly") or "live not verified".

## 5. Phase 3: Bridge to real life

**Coordinator first:** contracts C3 and migration **M3** (planned conversations with W4 fields, brave things, `people.preset_id`), each with a two-owner SQL test and delete-all coverage. Coordinator creates one PAL per catalog voice (same roleplay settings as the quality PAL) and records the mapping.

| Slice | Specs | Owned | Acceptance |
|---|---|---|---|
| 3A | B1, B2, W4 storage | `app/api/planned/**`, `lib/data/planned.ts`, `components/practice/checkin-banner.tsx`, person-page date control, tests | B1, B2, W4 storage lists; a date is never required or re-prompted; check-in shows only if a date exists, on or after it, once; "Not yet" offers a new day; no reminders outside the app |
| 3B | B3 | `app/api/brave-things/**`, `lib/data/brave-things.ts`, person page and About me sections, tests | B3 list; no counts anywhere |
| 3C | B4, W6 | `lib/media/presets.server.ts`, `lib/media/tavus.ts`, person editor "Look and voice", `public/faces/**` (only if the W6 spike allows), tests | B4 list; unknown preset rejected; bundle grep finds no provider ids |
| 3D | docs/33 §4.9 people restyle, "Talked for real" mark, U5 dossier, U6 data map | `app/practice/people/**`, `components/presentation/people-*` | Existing G3 browser checks still pass (`--g3-ui`); sharing keyboard path intact |
| 3E | W8 demo seed (coordinator) | `scripts/demo/**` | W8 list |

**Phase 3 exit:** recipe green; `--p3` real-Auth two-user checks (cross-owner 404 on planned, brave things, preset); delete-all removes new rows (SQL).

## 6. Phase 4: Reach

Each is independent after Phase 3. Dispatch by value: 4C curveballs first (cheap, visible), then 4A, then 4B and 4D (spikes needed). Speaking the situation (D15) was declined.

| Slice | Spec | Notes |
|---|---|---|
| 4A | R2 clarifying chips | Contract C4a: `questions` on the draft response, a patch request |
| 4B | R3 presence ladder | Spike `audio_only` first; start body `mode` (C4b) |
| 4C | R4 curveballs | Start body `curveball: true`; server picks from the fixed list; disclosed on recap |
| 4D | R5 languages | Spike voice quality per language with the chosen model |
## 7. Lanes at a glance

Coordinator work is in brackets. Each row is one worker lane.

```
Phase 0   [0B spikes + PAL] ─────────────────────────── [A/B call]
          0A tokens ────────────┐
          0C flow refactor ─────┴─ 0D video-first
          [0E UI gate, after 0A]
Phase 1   [C1 + M1]
          1A call screen ───────────────────────┐
          1B lobby+briefing ── 1D meet+green ───┼─ [hero checkpoint] ── 1E goal+voice
          1C server ────────── 1G show me first ┘                       1F motion+sound
Phase 2   [C2 + M2]  2A recap+retry · 2B reflection server · 2C pocket+style · 2D landing
Phase 3   [C3 + M3 + PALs]  3A planned · 3B brave · 3C catalog → 3D restyle · [3E seed]
Phase 4   4C · 4A · 4B · 4D
```

## 8. Risks that could kill the wow, and the fallback

| Risk | Signal | Fallback (still honest) |
|---|---|---|
| Tavus rejects the expressive TTS model | 0B spike error | Keep `eleven_flash_v2_5`; lean on Q2 and T1 for realism |
| Pro faces not on this plan | `GET /v2/faces` | Best available stock faces, auditioned; W6 illustrated portraits |
| Raven tone reactions feel clinical ("You sound anxious") | A/B notes | Prompt line: react in character, never name the user's emotion; else `limited` |
| Wrap-up context only applies next turn | 0B spike | Send at T–45 s instead of T–30 s |
| Goal light false positives | Live check, five calls | Raise the bar in the prompt; stays opt-in |
| Phase 1 too big for one checkpoint | Hero path late | Ship the checkpoint with today's review form restyled as the Meet card; deepen in 1D |
| Stand-in paraphrases or coaches instead of saying the line | Live check | Set the stand-in's `custom_greeting` to a short hello followed by the user's line, so the line is said once for certain; tighten the "never step out of the scene" line |

## 9. What the coordinator does next

1. Commit these docs when the owner asks (the checkout has uncommitted planning docs; do not commit them without a request).
2. Before freezing C1, amend docs/07, docs/08 and docs/32 A1 for W10 (wording in 04-NEW-SPECS W10).
3. Create GitHub issues for Phase 0 (0A–0D, SPIKE-01) and their task records.
4. Run 0B while 0A and 0C workers start.
