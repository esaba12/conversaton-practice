# Project status

Updated October 3, 2026, 20:40 EDT. **G1 and G2 passed** (human live calls). **G3–G5 accepted on automated evidence (live not verified)**. `main` includes the privacy review, session person attribution, three example presets, a 3/5-minute choice, collapsed captions, and a public landing with a signed-in home and a Google sign-in button. Typecheck passed. Unit tests: 157 passed. Migrations `20261003220000_session_person.sql` and `20261003220100_revoke_session_executor.sql` are **applied**. Google sign-in is not live-checked; the provider still has to be enabled in the Supabase dashboard. Appearance presets were not built. Live checks, Devpost, the project name, and hosting stay with the human. Current open list: [docs/29](docs/29-REMAINING-WORK.md).

## Integrated October 3, 20:32 EDT

| Task | Result |
| --- | --- |
| [REV-01](docs/tasks/REV-01-g5-privacy-review.md) | Merged. 0 blockers, 3 should-fix, 5 accepted risks |
| [DATA-01](docs/tasks/DATA-01-session-attribution.md) | Merged. Saved-person starts store id and version. SQL assertions passed after apply |
| [UX-01](docs/tasks/UX-01-presets.md) | Merged. Examples: Alex (roommate), Ellis (professor), Sam (saying no) |
| [UX-02](docs/tasks/UX-02-duration.md) | Merged. 3 minutes default, 5 minutes optional, including example and saved-person starts |
| [UX-03](docs/tasks/UX-03-captions.md) | Merged. Collapsed captions from in-memory turns. Provider captions stay off |
| [POST-01](docs/tasks/POST-01-workspace-polish.md) | No commit. Browser verification was not finished |
| [APPEAR-01](docs/tasks/APPEAR-01-appearance.md) | No commit. Catalog was not built |
| [LIVE-01](docs/tasks/LIVE-01-human-checks.md), [SUB-01](docs/tasks/SUB-01-submission-execution.md), [NAME-01](docs/tasks/NAME-01-project-name.md), [HOST-01](docs/tasks/HOST-01-hosting.md) | Still human decisions |

## G5 merged (19:26 EDT)
[PR #26](https://github.com/esaba12/conversaton-practice/pull/26) CI [verify SUCCESS](https://github.com/esaba12/conversaton-practice/actions/runs/37161341412). Issues #22–#25 closed. Draft rate limit, test-media seam (dev only), no duplicate save, a11y/mobile, `--g5-ui` real-Auth checks. Evidence: [G5-04](docs/tasks/G5-04-integration.md), docs/09 G5 coverage table. At 19:26, session `person_id` attribution was still deferred; it was applied later the same day (see the top of this file). Dependencies frozen (do not upgrade).

**History below this line is G4/G3-era notes.** Do not start demo/submission until the human says the product is good enough.

## User decision (19:00 EDT): automated verification, live later
"Do it as automated or unit testing where you can … I'll verify myself when I want to." Gates now advance on automated evidence and are labelled "live not verified" (AGENTS.md "Verification"). **G3 and G4 accepted on automated evidence; neither is live-verified.** G4 adds a real reflection call (live OpenAI, coordinator-run, pass) and a G3 real-Auth UI regression on the G4 branch (pass); see [G4-04](docs/tasks/G4-04-integration.md). PR #20 and PR #21 merged to `main`. **Next: G5** per docs/28, then demo/submission prep.

## G4 build started in parallel (17:52 EDT, cloud coordinator)
The human's live G3 report has not been received yet; G3 stays unpassed and PR #20 unmerged. To keep pace, the G4 contracts are frozen on `cursor/g4-reflection-9fec` (branched from the `build/g3-people` head `6930688` because `main` lacks G3). It is not merged ahead of G3. Design, contracts and worker split: [G4-04](docs/tasks/G4-04-integration.md). No migration in G4. This coordinator runs in a cloud VM without Supabase/provider credentials and with read-only `gh`. Database checks, real-Auth scripts, live calls, issue creation/closing and merging PR #20 must happen on the human's machine or GitHub UI.

| Task | Writer | Owned paths |
| --- | --- | --- |
| [G4-01](docs/tasks/G4-01-reflection-server.md) reflection server | background subagent | `lib/reflection/{prompt,generate,session}.ts`, `app/api/sessions/[id]/reflect/route.ts`, test |
| [G4-02](docs/tasks/G4-02-reflection-ui.md) reflection UI + transcript capture in the workspace | background subagent | `app/practice/practice-workspace.tsx`, `components/presentation/reflection-*`, `lib/reflection/api-client.ts`, test |
| [G4-03](docs/tasks/G4-03-data-and-deletion.md) Your data / deletion / cleanup status | background subagent | `app/api/sessions/route.ts` (GET), `app/api/practice-data/route.ts`, `lib/data/practice-data.ts`, `app/practice/data/**`, `components/presentation/data-*`, `lib/practice-data/api-client.ts`, test |

## Appearance presets (17:23 EDT, docs only)
The user wants a saved person to look and sound like the relationship, chosen from a short catalog of stock faces and premade voices. No photo upload, likeness, or voice cloning. Recorded in [docs/00](docs/00-DECISIONS-AND-VIABILITY.md). Not part of the open G3 build: do not add a picker, schema fields, or extra PALs until G3 is accepted. Current calls stay on the one configured face and voice.

## G3 build (17:25 EDT)
Contracts frozen at `7bb796b`: `lib/schemas/people.ts` (About-me facts, people with trait chips + version, shared facts, private prep, HTTP contract), `traitChipsSchema`/`roleExtrasSchema` and `buildRoleContext(role, { traits, knownAboutUser })` in `lib/schemas/role-context.ts`, saved-person start branch `{ idempotencyKey, personId, expectedVersion, durationSeconds }`, `NOT_FOUND` error code, `lib/data/rpc.ts` marker mapping. Migration `20261003211000_people_sharing.sql` **applied** to linked project `rcktybngebovyopregnt` (`supabase db push --linked --yes`, Docker catalog-cache warning only). `supabase/tests/people_sharing.sql` **pass** (two owners, cross-owner read/edit/share/context denied, stale version → `VERSION_CONFLICT` with no partial write, private prep absent from `person_context`, caps, direct DML denied, privilege shape); negative control confirmed failures surface; no fixtures persisted; G1 `session_foundation.sql` re-run pass.

| Task | Issue | Writer | Owned paths |
| --- | --- | --- | --- |
| [G3-01](docs/tasks/G3-01-people-data-routes.md) data + routes | [#17](https://github.com/esaba12/conversaton-practice/issues/17) | background subagent | `lib/data/people.ts`, `app/api/about-me/**`, `app/api/people/**`, `app/api/private-prep/route.ts`, `tests/unit/people-routes.test.ts` |
| [G3-02](docs/tasks/G3-02-start-saved-person.md) saved-person start | [#18](https://github.com/esaba12/conversaton-practice/issues/18) | background subagent | `lib/data/person-context.ts`, `lib/session/server.ts`, `lib/media/tavus.ts`, session/tavus/person-context tests |
| [G3-03](docs/tasks/G3-03-people-ui.md) UI | [#19](https://github.com/esaba12/conversaton-practice/issues/19) | background subagent | `app/practice/practice-workspace.tsx`, `app/practice/people/**`, `app/practice/about-me/**`, `components/presentation/people-*`, `lib/people/api-client.ts`, `lib/session/api-client.ts`, client tests |

Coordinator owns schemas, migration, `scripts/preflight/**`, STATUS and numbered specs; integrates one worker at a time, runs the verification recipe and the two-user check, opens the PR, then asks the human for the live G3 call.

**17:42 EDT — all three workers integrated** (`120f3c2` G3-02, `b51bd69` G3-01, `1133e16` G3-03) plus privacy-review follow-ups (`71e837d`; no blockers). Typecheck, 103 unit tests, production build, browser suite (8 pass, 1 production-only skip), G2 regression and the new `auth-database-check.mjs --g3` (real JWTs) and `--g3-ui` (two signed-in browser sessions: owner 404s, cross-owner sharing denied, stale 409, keyboard and drag-and-drop sharing, chip edit, Never shared not shareable, saved-person start body is ID + version only) all pass. Evidence and the human checklist: [G3-04](docs/tasks/G3-04-integration.md). **Next: human live G3 call.** Not yet verified live: a successful saved-person Tavus start, the counterpart using only shared facts, tone change after a chip edit, Save/Update after a real End. Carry to G5: session `person_id` attribution, mobile/screen-reader walkthrough of the new pages.

## G3 redefined by user (17:05 EDT)
G3 = saved people with a chip editor, an About-me profile, per-person drag-and-drop sharing of what each person knows about you (keyboard path required), a separate never-shareable private section, and an explicit "Save this person / Update" after End. Reflection-generated memory proposals move to G4 or later. Design, acceptance and the paste-ready G3 coordinator prompt: [docs/26](docs/26-PEOPLE-AND-SHARING.md). docs/01, 02, 04, 05, 09 (new T16), 10 and AGENTS.md point there. docs/25 Prompt A is superseded; Prompt B (demo prep) still applies.

## G2 passed (17:02 EDT)
Human live G2 call ~16:56 on `d42f53d`: user reported it "worked well" (collective, not itemized). The database shows one session, live ~54 s, `ended`, cleanup `confirmed`. Evidence: [G2-04](docs/tasks/G2-04-integration.md). Next: merge [PR #15](https://github.com/esaba12/conversaton-practice/pull/15) after CI, close #12–#14, then G3 approved memory. If the G3 preparation agent from [docs/25](docs/25-PARALLEL-PROMPTS.md) is running, review its draft PR, apply its migration, and integrate it. Carry to G5: explicit private-note probe, live out-of-scope check, per-user draft rate limit.

## G2 history (16:45 EDT)
Branch `build/g2-generation`. Coordinator froze contracts at `346b61d`: `lib/schemas/draft.ts` (draft request/response/model-output), start request union (preset or strict reviewed `role`), `OUT_OF_SCOPE` error code, `readBody` max-length argument, `OPENAI_SETUP_MODEL` in `.env.example`. Local `.env.local` uses `gpt-5.4-mini-2026-03-17` (listed for the key via `GET /v1/models`, HTTP 200; no generation call yet). Situation limit is 1,000 characters per docs/02.

| Task | Issue | Writer | Owned paths |
| --- | --- | --- | --- |
| [G2-01](docs/tasks/G2-01-setup-generation.md) generation server | [#12](https://github.com/esaba12/conversaton-practice/issues/12) | background subagent | `lib/setup/**`, `app/api/scenarios/draft/route.ts`, `tests/unit/setup-generate.test.ts` |
| [G2-02](docs/tasks/G2-02-start-reviewed-role.md) start with reviewed role | [#13](https://github.com/esaba12/conversaton-practice/issues/13) | background subagent | `lib/session/server.ts`, `app/api/sessions/route.ts`, `tests/unit/session-server.test.ts` |
| [G2-03](docs/tasks/G2-03-setup-review-ui.md) setup/review UI | [#14](https://github.com/esaba12/conversaton-practice/issues/14) | background subagent | `components/presentation/setup-*`, `app/practice/practice-workspace.tsx`, `lib/session/api-client.ts`, `tests/unit/api-client.test.ts` |

Workers do not build, run Playwright, call providers, or write Git. Coordinator integrates one at a time, then runs the verification recipe, one real generation check, PR, and asks the human for the live G2 call.

**16:50:** G2-02 integrated (`4fcbb81`), G2-01 integrated (`262c04e`), prompt `.2` (`0bf37bf`). One live OpenAI generation check passed (two real calls; second 1.7 s; no private-note marker in role); details in G2-01. G2-03 UI still active. docs/05 and docs/07 updated for implemented behavior. Paste-ready prompts for parallel G3 preparation (isolated worktree, unapplied migration) and demo/submission prep: [docs/25](docs/25-PARALLEL-PROMPTS.md). The coordinator still owns STATUS, migrations execution, shared Supabase and the microphone.

**16:58:** G2-03 integrated (`831b122`). Read-only privacy review: no blockers; should-fix and cheap nits applied (prompt `.3`, fixed counterpart boundary line, HMAC fingerprint, `server-only` prompt, notes autocomplete off, bfcache clear). Typecheck, 66 unit tests, build, browser suite (8 pass, 1 production-only skip), signed-out/cross-site HTTP rejection and a signed-in browser-mocked G2 flow check all pass. Evidence: [G2-04](docs/tasks/G2-04-integration.md). Draft [PR #15](https://github.com/esaba12/conversaton-practice/pull/15). **Next: human live G2 call** (checklist in G2-04). Deferred: per-user draft rate limit.

## Latest user direction
**16:30 EDT:** user will clear coordinator context and continue at full speed with subagents. Start from [docs/24-G2-KICKOFF.md](docs/24-G2-KICKOFF.md), which has the G2 contracts, worker split, verification recipe, and a paste-ready prompt. Text below this paragraph is older history.

The user is switching to Cursor because of rate limits, confirms the frontend worker is done, and requested all ready work merged and fully documented. No new feature work is part of this handoff turn. Start with [the complete Cursor handoff and paste-ready prompt](docs/23-CURSOR-HANDOFF.md). Keep the confirmed FaceTime-style live-video product, editable generated setups, required sign-in, Supabase, Tavus CVI + ElevenLabs TTS, and OpenAI setup/reflection defaults.

## Current work and ownership
**Latest (16:10 EDT):** branch `build/g1-session-media` at `a8211af` integrates G1-01 server routes, G1-02 Daily controller and G1-03 practice workspace (all three workers done, in review → integrated). Start practice is now enabled for signed-in users and creates a real Tavus call. Typecheck, 38 unit tests, production build and 8 browser checks pass; signed-out/cross-site HTTP rejection observed. Details in [G1-04](docs/tasks/G1-04-integration.md). **16:17: human signed-in live call passed** (responsive talking video, ~five exchanges, interruption, mic released on End, mid-call sign-out clean; DB row ended + cleanup confirmed). Residual teardown paths (expiry, time limit, pagehide, unreachable server, two-owner HTTP on new routes) are listed in G1-04 for G5. Next: merge [PR #10](https://github.com/esaba12/conversaton-practice/pull/10) after CI, then freeze G2 draft/role-context contracts and dispatch G2 workers. Real email confirmation now verified locally (~16:13; first link expired, second succeeded). Loopback preflight server on 3010 has exited and is no longer needed.

- Handoff checkout: `/Users/ethansaba/code/therapist`, **main**. Foundation PR #8, including frontend PR #7, merged to main at `c178d37832cfe4540c62b5f071902730ed27affa` on October 3 at 14:44 EDT. Subsequent Cursor handoff changes are documentation only. Historical source revisions: scaffold `a601a0e`, provider/database `fe27967`, frontend integration `cf32199`, workspace/Auth `c48cecf`.
- External frontend: `.worktrees/g1-frontend`, branch `agent/g1-frontend`, base `a601a0e`, port 3003. Owns only presentation components, development preview route, one frontend test and [its task record](docs/tasks/G1-03-frontend-preview.md). Its [PR #7](https://github.com/esaba12/conversaton-practice/pull/7) was reviewed and merged at `cf32199`, then included in main by PR #8. The user confirms this worker is done; its clean worktree at `9943679` has no outstanding commits relative to the merged foundation and is preserved. Coordinator wired its setup into the protected workspace.
- Coordinator owns shared contracts, app wiring, auth/media/backend, dependencies, numbered specs, migration execution, provider resources and STATUS.
- Research agents completed provider/API and database reviews. One authored the two coordinator-reviewed migrations and rollback assertions; no worker ran SQL.
- Media contracts are **provisional** until human live-video feasibility is recorded. G1-01/02/04 full implementation dispatch remains gated. Independent auth/database scaffolding and presentational UI proceeded within foundation.

## What exists
- Next.js 16.3.8 / React 19.3.0 / TypeScript 5.9.3 scaffold with pinned lockfile, local Node 22.23.3 and Node 22 CI. Host Node 20 bootstrapped npm installation; npm scripts use the local Node binary.
- Supabase SSR 0.12.7 and client 2.117.2; Daily 0.87.0; Zod 4.6.5; Vitest 4.1.11; Playwright 1.63.0. Vitest was patched after npm audit; subsequent installation reported zero vulnerabilities.
- Landing page, email/password sign-in/account-creation form, confirmation callback, cookie-refresh proxy, protected workspace shell. Real password sign-in and sign-out passed in Chromium using temporary confirmed fictional accounts; email delivery/confirmation callback still need verification. The workspace explicitly says calls are disabled.
- Allowlisted fictional roommate context, strict request/media/state schemas and tested server Tavus adapter. Private notes/history are rejected by role schema.
- GitHub Actions typecheck/unit/build/browser workflow passes on final code revision `c48cecf`: [run 37145104163](https://github.com/esaba12/conversaton-practice/actions/runs/37145104163), completed 14:42 EDT. Foundation [PR #8](https://github.com/esaba12/conversaton-practice/pull/8) is merged to main; its exact final head `d7bc7af` also passed [run 37145240793](https://github.com/esaba12/conversaton-practice/actions/runs/37145240793). Gate remains pending.
- Integrated app is running at http://127.0.0.1:3000 (launch session 16025). Development-only presentation fixture: /design-preview. This does not start media or pass G1.
- Original static public preview remains at https://conversation-practice-site.vercel.app and is separate from the app.

## Supabase
Fresh selected project `rcktybngebovyopregnt` is linked locally. Escalated CLI account and SQL checks succeeded; it initially had zero public tables.
Applied in order:
1. `20261003180000_session_foundation.sql`
2. `20261003182400_identity_helper_privileges.sql`

The first database assertion run exposed that managed Supabase's postgres role could not delegate Auth schema usage to the restricted executor. Additive repair moved only the private identity/capability verifier to postgres SECURITY DEFINER; mutation RPCs remain restricted and owner-RLS protected. Re-run passed. CLI migration catalog caching warned that Docker was unavailable; migrations still applied and SQL assertions succeeded. Docker is not a hosted-build prerequisite.

Session rows contain owner/lease/status/trusted provider association/cleanup only, not room credentials, raw prompts, transcripts or media. Direct authenticated DML is revoked. Runtime mutations require a verified nonanonymous owner plus an admin-provisioned server capability; raw capability stays local, only its digest goes to a private table. See [G1-00C evidence](docs/tasks/G1-00C-session-schema.md).

## Tavus / ElevenLabs
User-supplied keys passed read checks in PREP-03. Coordinator created one immutable roleplay PAL using a ready system stock face and a premade ElevenLabs voice. Server-to-server speech-key transfer is part of the authorized selected route. PAL readback confirmed explicit ElevenLabs TTS and perception off. Provider LLM default was not changed.

Private test-mode conversation creation returned ended plus a meeting token; Tavus hard deletion succeeded. This verifies request acceptance only, not live TTS/video or billing. Recording-off does not disable provider transcripts. ElevenLabs retention/deletion remains separate from Tavus cleanup.

Isolated live preflight is running at **http://127.0.0.1:3010** (process session 14951 at launch). It starts a real three-minute call only on explicit click. User was asked to test five exchanges, interruption, End/microphone release, and two fictional contexts. **No human result received yet.** Restart command:
`node_modules/.bin/node --env-file=.env.local scripts/preflight/video-server.mjs`

**Human result (14:54 EDT):** usable. Video and responsive speech work; lip sync is slightly off on the stock face. The user reported the rest of the checklist as working collectively, not item by item. Recorded in [G1-00](docs/tasks/G1-00-foundation.md). This harness is intentionally separate from the authenticated application, binds loopback, and is not a G1 pass.

## Actual verification
October 3, original checkout; checks ran during development based on `a601a0e` and were integrated through `c48cecf`/`d7bc7af` into main merge `c178d37`. Per-task records retain exact modes/revisions; these are no longer uncommitted feature changes:
- `npm run typecheck`: pass.
- `npm test`: 9 unit tests pass, including private-context rejection, state rules, credential boundary, no blind provider-create retry and separate End verification.
- `npm run build`: pass, Next 16.3.8 production build.
- Combined `npm run test:ui`: 8 Chromium checks passed and 1 production-only check intentionally skipped in development. Includes entry/guard, frontend controls, mobile layouts and truthful preview states. No media mock claimed as live.
- `supabase db query --linked --file supabase/tests/session_foundation.sql`: initial permission failure, then pass after additive repair. Synthetic identities/claims, all fixtures/config changes rolled back. Checks owner isolation, direct-write denial, capability/anonymous rejection, idempotency, terminal-state/late-bind behavior and expiry. Does not establish HTTP Auth or concurrent multi-connection behavior.
- Real Auth/HTTP concurrent boundary check: passed; two fictional users signed in, owner/capability/direct-write checks and simultaneous acquisition passed; all fixtures removed. `auth-database-check.mjs --ui-only` also passed real browser sign-in, SSR workspace, integrated setup, sign-out and denied re-entry. No email or provider calls; no credentials retained.
- Provider PAL/readback and test-mode creation/deletion: live API pass, audiovisual not run.
- Playwright screenshot of loopback preflight inspected without starting a call; no media recorded.
- Installed Next.js cookies/proxy/authentication/route guides reviewed; preserve its generated AGENTS.md rules block.

## Next steps and real blockers
1. Done: human preflight recorded as usable with imperfect lip sync. No provider repair needed before freezing contracts; lip sync is a known limitation, not a blocker.
2. Continue from main on a new focused branch in Cursor. PRs #7 and #8 are merged; G1 issues remain open until full acceptance. Follow docs/23 for the exact implementation map and next task.
3. Verify actual email delivery/confirmation callback; real password/UI sign-in already passed with confirmed fixtures. Default Supabase SMTP may restrict recipients/rate; do not burn quota with repeated synthetic signup attempts or claim public email readiness.
4. Freeze media/session contracts, then dispatch/review application auth/session routes and media-controller work against the integrated frontend props.
5. Full G1 requires authenticated five-turn video, durable owner isolation/concurrency and local media teardown on End/auth loss/failed requests. Only then start G2 situation generation.

G2 editable generation, G3 approved memory, later reflection/deletion and G5 evaluation remain unimplemented. Do not replace generated situations or live video with simpler features. Photon/Relay remain deferred.

## GitHub and setup
Repository: https://github.com/esaba12/conversaton-practice . G1 issues #1–#5 remain open. Foundation PR #8 and presentation PR #7 are merged and preserved in main history. The documentation-only Cursor handoff follows separately. Check existing PRs before creating another. Local environment and provider IDs are ignored; never stage `.env.local`. Git/worktree and network operations succeeded via scoped escalation; a context reset does not change managed read-only permissions. Preserve uncommitted work.

Preparation evidence: [PREP-01](docs/tasks/PREP-01-agent-workflow.md), [public preview](docs/tasks/PREP-02-public-website.md), [access checks](docs/tasks/PREP-03-access-check.md). No need to recreate keys, reinitialize Git, obtain AWS credits or create LiveAvatar accounts.

Submission target: October 4, 11:30 AM America/Detroit; event notes record deadline before noon. Preserve the submission buffer.
