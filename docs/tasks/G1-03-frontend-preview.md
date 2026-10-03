# G1 frontend presentation: isolated external agent

Status: review
Gate: G1 presentation only; no live integration acceptance
Owner: user-launched frontend agent
Issue: https://github.com/esaba12/conversaton-practice/issues/4
PR: check existing PRs, then open focused draft when reviewable
Base: `a601a0eaea6cd84b68050687fa1ebfd6fb85a39f` (verified clean before edits)
Branch: `agent/g1-frontend`
Worktree: `/Users/ethansaba/code/therapist/.worktrees/g1-frontend`
Port: 3003 only
Dependency: scaffold and presentation contract below; working media not required

## Ownership

Edit only `components/presentation/**`, `app/design-preview/page.tsx`, `tests/browser/frontend-preview.spec.ts`, and this task record. Use CSS Modules under your component folder. Coordinator will not edit these paths during your task.

Do not edit app entrypoints, globals/layout, practice/auth routes, `proxy.ts`, `lib/**`, fixtures, manifests/lockfile, shared test/config files, migrations, numbered specs, STATUS.md, or `.env*`. No provider/Auth/DB/Vercel settings changes. Coordinator owns integration. No new dependencies. Do not copy secrets.

## Components and shared contract

Export `PracticeSetup` and `PracticeCall` plus their prop types from `components/presentation/practice.tsx`.

`PracticeSetup`: `counterpartName: string`, `role: string`, `publicContext: string`, `goal: string`, `onStart: () => void`, `disabled?: boolean`, `statusMessage?: string`.

`PracticeCall`: `counterpartName: string`, `goal: string`, `phase: 'connecting' | 'live' | 'interrupted' | 'ended'`, `muted: boolean`, `cameraEnabled: boolean`, `elapsedSeconds: number`, `durationSeconds: number`, `remoteMedia: React.ReactNode`, `localPreview?: React.ReactNode`, `onMuteToggle: () => void`, `onCameraToggle: () => void`, `onEnd: () => void`, `statusMessage?: string`, `isMock?: boolean`.

Presentation only: supplied React nodes provide media. No media acquisition, MediaStream management, provider SDK, fetch, auth, database, or persistence. No persona generation, scripts, scores, reflection/memory functionality or later-gate work.

Follow docs/18 ivory/ink/sage direction. Deliver a polished setup card and FaceTime-style call screen, with dominant counterpart video, fictional AI label, persistent End, separate mute/local camera controls, and clear connection/interruption/end states. Muting is not pausing. Camera preview is local only. Missing video gets an honest placeholder, never fake readiness. Keep provider/implementation terminology out of the product flow.

Preview route: Server Component `app/design-preview/page.tsx` calls `notFound()` unless `process.env.NODE_ENV === 'development'`, then renders an owned client fixture with hardcoded synthetic props. Prominently label `UI preview — no live call`. Controls may change synthetic display state only. No functional workspace actions or real user data. Production must return 404.

## Acceptance and verification

- Responsive desktop/mobile, keyboard focus, accessible control names, 44px targets, readable contrast, reduced-motion support.
- Install frozen packages with `npm ci` inside your worktree; do not alter lockfile. Scripts use project-local Node 22.
- Run typecheck, production build, and focused browser checks. Preview server: `npm run dev -- --port 3003`.
- Shared Playwright config uses coordinator port 3100: do not run the full suite or edit config. Use Playwright CLI/browser or an owned temporary ignored config targeting 3003; isolate screenshots and artifacts.
- Record exact checks, base SHA, changes, remaining gaps and handoff here. No live-media claims.
- Commit only owned paths. Push `agent/g1-frontend`; draft PR base `build/g1-foundation` once available remotely. Do not merge/rebase/reset/clean or edit coordinator checkout. Report proposed out-of-scope changes instead.

Coordinator reviews and integrates one commit at a time. This visual work may proceed while live provider contracts remain provisional; it does not pass G1-00/G1.

## Implementation review assignment

A read-only reviewer may inspect the completed owned presentation files against this
exact prop contract, accessibility acceptance, truthful media states, and production
preview exclusion. Base is the SHA above plus explicitly uncommitted task changes.
No write ownership is delegated; the frontend agent remains the sole writer. Review
depends on implementation being available. Deliver findings in the handoff; the
frontend agent records findings/resolutions and verification here. No account,
provider, microphone, camera, or other checkout access is needed.

## Outcome and integration handoff

- Exported `PracticeSetup`, `PracticeCall`, `PracticeSetupProps`, and
  `PracticeCallProps` from `components/presentation/practice.tsx`, with the exact
  assigned contract. No shared interface changes or dependencies.
- Ivory/ink/sage setup review card, public counterpart context and practice goal,
  disabled/status presentation, responsive call stage, supplied media slots,
  local-only camera explanation, elapsed/planned timer, and all four call phases.
- Missing remote/local nodes show honest unavailable states. Muting explicitly
  does not pause the call. End remains available while connecting/interrupted;
  ended presentation removes media nodes and disables controls. Actual media
  teardown remains the caller's responsibility.
- Narrow-screen controls are fixed above the safe area; desktop controls remain
  sticky. Keyboard focus, minimum 44px controls, long text wrapping, and reduced
  motion are covered. No synthetic animation or avatar implies live video.
- Server preview route permits development only; owned client fixture uses only
  hardcoded synthetic content and local React display state. No fetching, device
  access, auth, generation, persistence, provider SDK, or application wiring.
- Changed paths: `components/presentation/{practice.tsx,practice.module.css,
  practice-preview.tsx,preview.module.css}`, `app/design-preview/page.tsx`,
  `tests/browser/frontend-preview.spec.ts`, and this record.
- Coordinator next: review/import the components in the authenticated workspace,
  supply real media and callbacks, and set phase/status from the media adapter.
  A supplied node cannot prove playable media: detect frozen/failed tracks in the
  adapter and report `interrupted`. Render one active call component per page.
  These checks do not establish live G1 acceptance or owner isolation.

## Verification — October 3, 2026, America/Detroit

All commands ran in the assigned worktree against base
`a601a0eaea6cd84b68050687fa1ebfd6fb85a39f` plus uncommitted owned changes.
Project-local Node verified as `v22.23.3`; installed Chromium via existing
Playwright cache. Only port 3003 was used. No environment files copied or edited.

| Time EDT | Mode / outcome | Command or check | Evidence |
| --- | --- | --- | --- |
| 14:00–14:04 | static / pass after environment retry | `npm ci` | Frozen install completed, exit 0; initial sandbox DNS failure required escalation. Host bootstrap Node 20 emitted engine warnings; scripts use local Node 22. npm reported 2 moderate advisories; no dependency changes made. |
| 14:05 | static / pass | `npm run typecheck && npm run build` | Exit 0 for both initial checks. |
| 14:05–14:08 | mock / fail then pass | `npm run dev -- --port 3003`; `npx playwright test --config artifacts/local/frontend-preview/playwright.config.cjs` | Initial 320px aspect-ratio/min-height overflow fixed with explicit stage width. A later sandbox Chromium startup denial required escalation. Final run exit 0: 6 passed, production-only case skipped. |
| 14:08–14:09 | mock / pass | Review screenshots under `artifacts/local/frontend-preview/results/` | Desktop setup/call and 320px long-name connecting screenshots inspected; tests captured setup, connecting, interrupted and supplied-slot examples at 1440, 390, and 320px. Synthetic content only. |
| 14:08–14:09 | static / pass | `npm run typecheck`; `npm run build` | Final implementation checks exit 0 after review fixes. |
| 14:10 | mock / pass | `npm run start -- --port 3003`; `FRONTEND_PREVIEW_PRODUCTION=1 npx playwright test --config artifacts/local/frontend-preview/playwright.config.cjs --output artifacts/local/frontend-preview/production-results` | Exit 0: production preview HTTP 404 and no fixture/start control, 1 passed and 6 development cases skipped. Both task servers stopped after checks. |
| 14:10 | static / pass | sRGB contrast calculation and `git diff --check` | Primary muted text 5.18:1; primary action 7.70:1; End 6.41:1; dark-stage secondary text 9.33:1; preview warning 6.19:1; disabled start 5.63:1. Diff whitespace check passed. |

Focused browser assertions cover keyboard focus/Enter, disabled Start, unavailable
video, mute/camera callback display updates, connection interruption, End removing
supplied nodes, disabled ended controls, long-content overflow, 44px targets, and
mobile controls remaining within the viewport under reduced-motion emulation.
This is DOM/fixture evidence, not physical-device or screen-reader verification.
No real camera/microphone, sign-in, playback, latency, interruption, provider
cleanup, or track release was exercised. T14/T15 and P04/P09 live acceptance remain
with integration; these components support the presentation aspects of P05/P10.

The isolated ignored config at `artifacts/local/frontend-preview/playwright.config.cjs`
uses `@playwright/test` from this worktree, testDir `tests/browser`, testMatch
`frontend-preview.spec.ts`, one Desktop Chrome worker, baseURL
`http://127.0.0.1:3003`, no webServer, trace/video/screenshot disabled by default,
and outputDir `artifacts/local/frontend-preview/results`. Tests explicitly save
synthetic screenshots to their isolated output paths. The shared port-3100 config
and full browser suite were not used. Recreate this config locally before repeating.

Read-only review found changing action labels paired with `aria-pressed`, possible
long-name placeholder overlap, and offscreen mobile End. Resolved with ordinary
action-button semantics, a bounded connecting headline, explicit stage width,
and persistent controls; focused checks were rerun afterward.

Next dev automatically appended framework guidance to `AGENTS.md` and rewrote
`next-env.d.ts` for dev types. The appended generated block was removed after the
server stopped; production build restored the original type imports. Both files
match base and are excluded from commits. Optional coordinator proposal: set
`agentRules: false` in the shared Next config if repeated generated AGENTS churn
is unwanted; no config edit was made here.

CI/integrated revision: pending coordinator review. No gate marked passed.
