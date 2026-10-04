# What's next

## Start here (added 22:10 EDT): the wow pass

The owner asked for specs that build all of the plan below, with real wow factor. The thread through everything is the owner's own story. To help him tell his boss he needed to slow down, the other person first played *him* to show him how it could go, while he played his boss. Then he played himself, and the real conversation went well. These files turn that into a buildable plan. Planning only, not built. Owner answers D14, D15, D8 and D17 are recorded in docs/00.

| File | What it is |
|---|---|
| [01-THE-WOW](01-THE-WOW.md) | The experience target: the hero journey with Jordan the manager (Show me first, then your turn), ten wow moments with quality bars, the demo path, and the wow that stays out |
| [02-BUILD-PLAN](02-BUILD-PLAN.md) | Phases 0–4 as slices, each with owned paths, migration, what stays out of counterpart context, acceptance; worker lanes; risks and fallbacks |
| [03-CONTRACTS](03-CONTRACTS.md) | Coordinator-owned schema, route, migration (M1–M3) and provider changes, frozen per phase before dispatch |
| [04-NEW-SPECS](04-NEW-SPECS.md) | Specs docs/32 lacked: W1 flow refactor, W2 Jordan starter, W3 "Hear {name}", W4 confidence arc, W5 speed budget, W6 real faces, W7 recap staging, W8 demo seed, W9 safety in new screens, W10 Show me first (stand-in plays you, then your turn). Owner answers at the end |
| [06-KICKOFF-PROMPT](06-KICKOFF-PROMPT.md) | Paste-ready prompt for a coordinator agent to start building in parallel |
| [05-UI-UPGRADE](05-UI-UPGRADE.md) | Why the UI looks vibe-coded and the fix: UI rules with machine checks, eight capability surfaces (streamed character build, what they know and never see, call HUD, shortcuts, dossier, data map, live landing, keepsake recap), every flow with its states, the UI quality gate. Research: [R07](../research/R07-UI-CRAFT.md) |

The snapshot below is still accurate for state on `main`.

---

Written October 3, 2026, 21:45 EDT. Snapshot for the agent that plans how the product continues. Not a second status log. Live product progress stays in [STATUS.md](../../STATUS.md).

The owner has time and asked for this plan. Do not park the product work on the October 4 submission. Submission items are listed separately so they are not forgotten. They are not a gate on the plan.

`main` is `eff6014` and matches `origin/main`. STATUS.md still says `723e1d7` in one paragraph; that SHA is stale. The hosting note landed in `eff6014`.

## Done tonight (docs only)

No application code was written for any of this. The running app is unchanged.

Research reports, all planning inputs and not specs:

| Report | What it covers |
|---|---|
| [R01](../research/R01-COMPETITORS.md) | About 24 similar products and the open space |
| [R02](../research/R02-PRACTICE-MECHANICS.md) | Before, during, and after practice mechanics |
| [R03](../research/R03-SCIENCE-AND-FRAMEWORKS.md) | Evidence, harm, and claims that are off limits |
| [R04](../research/R04-PLATFORM-CAPABILITIES.md) | What Tavus, ElevenLabs, Daily, and Next.js can do |
| [R05](../research/R05-DESIGN-DIRECTION.md) | Why the UI feels flat, and the visual direction |
| [R06](../research/R06-USER-NEEDS.md) | Who it is for and what they need |

Decisions and specs written from that research:

- [docs/00](../00-DECISIONS-AND-VIABILITY.md) holds the decisions. One-moment retry (21:26). Owner answers for the later plan (~21:50): D2, D3, D4, D6, D7, plus the simulator structure (people cards, then the situation).
- [docs/30](../30-ONE-MOMENT-RETRY.md) is the build shape for the retry: one hard-moment line, a self-check after End, at most one new call, no grade, no replay of the first call.
- [docs/31](../31-PRODUCT-VISION.md) is the roadmap and the open questions.
- [docs/32](../32-FEATURE-SPECS.md) is the feature behavior.
- [docs/33](../33-DESIGN-SYSTEM-AND-SCREENS.md) is the visual system and screens.
- [docs/07](../07-PROMPTS.md) and [docs/08](../08-SAFETY-AND-PRIVACY.md) now say what those decisions change, each marked **decided, not built**. The implemented paragraphs in those files still describe the running app.

Owner answers already recorded. Do not re-ask them:

| ID | Answer | Spec |
|---|---|---|
| D2 | Reflection runs after End unless the user presses Skip | L1 |
| D3 | One alternate phrasing of the user's own goal line, only when they ask | A1 |
| D4 | Goal light, opt-in, off by default. The counterpart never receives the goal | G1 |
| D6 | Three stance chips the user can override. Recap shows those chips only, collapsed, labeled fiction | Q2 |
| D7 | Vocal-tone perception, Raven-1, emotion recognition full, no camera analysis, with a notice. Tone is not saved | T1 |

Simulator direction (docs/31 §4a): practice opens on people cards ("Practice with {name}"). The situation is entered after the person is chosen. A person is identity. A situation is per practice and starts fresh.

## Done and on main

Gates G1–G5 are implemented. G1 and G2 passed on human live calls. G3–G5 passed automated checks only and are **live not verified**.

The product on `main` can do this:

- Required sign-in. Email/password works. Google works locally for listed test users only. The Google app is still in Testing, so it is not public.
- Public landing when signed out. Signed-in home links to practice, About me, and Your data.
- Generate an editable setup from a described situation. Three examples start without generation: Alex (roommate), Ellis (professor), Sam (saying no).
- Review, then choose 3 minutes (default) or 5.
- Live Tavus video call with one stock face and one premade voice for every person. Collapsed captions from in-memory turns. End releases the mic.
- Saved people, trait chips, About me, per-person sharing of facts, private prep that is never shareable, explicit Save / Update after End.
- Optional reflection after End. The user still has to press "Get a short reflection". Your data page with honest cleanup status and deletion.
- A session started from a saved person stores that person's id and version.

Privacy follow-ups merged October 3, each with CI green:

- [#38](https://github.com/esaba12/conversaton-practice/pull/38) FIX-01: the setup generator rejects shorter copies, copies split across fields, and names or numbers that appear only in private notes. Paraphrase is still prompt-only.
- [#39](https://github.com/esaba12/conversaton-practice/pull/39) FIX-02: signed-in users can read only the `practice_sessions` columns the app uses. Migration `20261004000000_session_column_select.sql` is **applied**. `session_foundation.sql`, `session_person.sql`, and `people_sharing.sql` passed and rolled back.
- [#40](https://github.com/esaba12/conversaton-practice/pull/40) FIX-03: the reflect route checks that the caller owns an ended session before it reads the transcript.

The authenticated app is deployed at **https://conversation-practice-zeta.vercel.app** on Vercel project `conversation-practice`. That is not the static preview at https://conversation-practice-site.vercel.app. Do not deploy over that preview project. Signed-out `/` returns the landing. Signed-out `/practice` redirects to `/auth/sign-in`. Email sign-in and a live call on the deployed URL have not been run. `OPENAI_REFLECTION_MODEL` is unset; reflection falls back to `OPENAI_SETUP_MODEL`.

## Left for the planning agent

Produce an implementation plan from docs/31–33. Do not start coding in that planning pass unless the owner asks.

Use the phase order already in docs/31 §5. Phase 5's note that docs/00, 07, and 08 must be amended first is done.

1. **Phase 0.** Design tokens and the dark call surface (docs/33). Quality PAL spike: expressive ElevenLabs model Tavus accepts, Pro faces, audio tags (Q1). Video unmutes only after video is playing (Q3).
2. **Phase 1.** Lobby, person/situation split, briefing (P1–P3). Meet card, green room, ringing call, wrap-up, ask-to-wait, type-instead (S1–S6). Stance chips (Q2).
3. **Phase 2.** Recap, including the docs/30 retry and default-on reflection with Skip (L1). Pocket card (L2). Feedback style (L3).
4. **Phase 3.** Real-conversation date, in-app check-in, brave-things list (B1–B3). Appearance catalog (B4), already decided in docs/00.
5. **Phase 4.** Skills shelf, clarifying chips, presence ladder, curveballs, languages, landing, sound (R1–R7).
6. **Decided extras, place them on the phases above.** Goal light (G1), hear tone (T1, with the quality PAL), one alternate phrasing (A1, with the recap).

The plan should name, for each slice: owned paths, whether it needs a schema or migration (coordinator-owned), what stays out of counterpart context, and the acceptance list already in docs/32 or docs/30. P2 is the structural change: today a saved person stores identity and one scenario together (docs/26).

## Still undecided

Do not build these as if they were chosen. Ask the owner, or mark the plan "blocked on this answer."

| ID | Question |
|---|---|
| D1 | Any numeric feedback, or never |
| D5 | Mid-call hint drawer |
| D8 | Reminders outside the app: none, a calendar file, or email |
| D9 | Designed synthetic voices, or premade only |
| D10 | Custom LLM behind the counterpart |
| D11 | Stay at one retry (docs/30), or widen later |
| D12 | A separate drill mode |
| D13 | Saved situations per person, at most five, explicit save only |

## Submission, separate from the product plan

Human, before the deployed app can sign anyone in:

1. Supabase → Authentication → URL Configuration: add `https://conversation-practice-zeta.vercel.app/**` to Redirect URLs, and set Site URL to `https://conversation-practice-zeta.vercel.app`.
2. Google Auth Platform → Clients → Supabase: add `https://conversation-practice-zeta.vercel.app` as an Authorized JavaScript origin.
3. Sign in once on that host with the existing Google test user. Anyone not on the test-user list must use email.

| Issue | What | Who |
|---|---|---|
| [#30](https://github.com/esaba12/conversaton-practice/issues/30) VERIFY-01 | Full regression on current `main`. A run was started and deliberately stopped. Do not treat it as failed, and do not resume that run. Start a new one only if asked. Spec: [VERIFY-01](../issues/VERIFY-01-regression-on-main.md). It needs port 3000. | Agent |
| [#31](https://github.com/esaba12/conversaton-practice/issues/31) POST-01 | Browser pass of the current workspace. Never recorded. Same port 3000, so it waits until VERIFY-01 is done. | Agent |
| [#35](https://github.com/esaba12/conversaton-practice/issues/35) LIVE-01 | Saved-person live call, reflection on a real transcript, and the rest of the live matrix. | Human |
| [#32](https://github.com/esaba12/conversaton-practice/issues/32) OPS-01 | Local Google sign-in passed once. Hosted Google is blocked on the redirect URL above. Provider stays in Testing. | Human |
| [#33](https://github.com/esaba12/conversaton-practice/issues/33) HOST-01 | Deploy exists. Close this only after the human confirms sign-in on the deployed URL. | Human |
| [#34](https://github.com/esaba12/conversaton-practice/issues/34) NAME-01 | Still "Conversation practice". Do not invent a name. | Human |
| [#36](https://github.com/esaba12/conversaton-practice/issues/36) SUB-01 | Devpost, backup recording, three-minute rehearsal. Drafts: [DEMO-01](../tasks/DEMO-01-submission-prep.md). | Human |
| [#37](https://github.com/esaba12/conversaton-practice/issues/37) APPEAR-01 | Per-person stock face and premade voice. Same work as B4. | In the product plan |

Issue #6 is closed. Issues #27–#29 are closed. [docs/29](../29-REMAINING-WORK.md) is older than STATUS and this file. Where they disagree, STATUS and this file win.

## Constraints

- One writer per worktree. Coordinator owns `STATUS.md`, schemas, migrations, lockfiles, and integration.
- Port 3000 is hardcoded in `scripts/preflight/*.mjs`. Only one browser check can use it. Playwright reuses port 3100, so only one `npm run test:ui` at a time.
- Supabase project `rcktybngebovyopregnt` is shared. Only the coordinator applies migrations.
- One live Tavus call at a time. Do not upgrade dependencies.
- Goal, hard-moment line, private notes, and predictions never enter counterpart context.
- No scores, streaks, recording the user, transcript storage by default, voice cloning, photo upload, or group calls.
- Uncommitted work in this checkout: edits to `README.md`, `STATUS.md`, and `docs/00`, `01`, `02`, `07`, `08`, `10`, `20`, `29`, plus untracked `docs/30` through `docs/33`, `docs/next/`, `docs/research/`, and `artifacts/`. Do not revert it. Do not commit it unless the owner asks.
- The deployed site is public. Anyone who creates an account can spend Tavus and OpenAI credits.
