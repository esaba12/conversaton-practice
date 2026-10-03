# G1 frontend presentation: isolated external agent

Status: review
Gate: G1 presentation only; no live integration acceptance
Owner: user-launched frontend agent
Issue: https://github.com/esaba12/conversaton-practice/issues/4
PR: https://github.com/esaba12/conversaton-practice/pull/7 (draft; base `build/g1-foundation`)
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

### Component behavior and integration boundaries

`PracticeSetup` reviews supplied data; the assigned props do not include editing
or generation callbacks. `onStart` is called only from the enabled Start button.
`disabled` defaults to false, and `statusMessage` is announced and associated with
Start when present. The public-context panel must receive only approved character
knowledge; there is no private-notes input or counterpart-context assembly here.

| Call input | Presentation | Parent responsibility |
| --- | --- | --- |
| `connecting` | Connecting status and preparation placeholder; controls enabled | Acquire/connect media and advance phase only on verified readiness |
| `live`, remote node supplied | Supplied media displayed, “In conversation” status | Verify actual playback and synchronized video/audio |
| `live`, remote node absent | “Video unavailable” status and placeholder | Handle unavailable video; a phase alone does not establish readiness |
| `interrupted` | Explicit interruption overlay/status; controls enabled | Recover or end the connection; no retry callback exists in this contract |
| `ended` | Ended message, media slots unmounted, all controls disabled | Stop playback, release tracks, close provider sessions, ignore late events |
| `muted` | Unmute action and explicit “not paused” explanation | Apply microphone state; button only invokes `onMuteToggle` |
| `cameraEnabled` | Supplied local preview or “Preview unavailable” | Acquire only after opt-in, keep local, release on disable/end |
| Camera disabled | “Camera off”; supplied local node not rendered | Do not acquire or publish camera tracks |
| `isMock` | Prominent “UI preview — no live call” banner | Set for any simulated caller; default is false |

The component treats null, undefined, and boolean media nodes as absent. It cannot
inspect whether a supplied wrapper contains functioning video. Connecting and
interrupted overlays do not stop an already mounted remote node's audio.
`elapsedSeconds` and `durationSeconds` are display inputs, not timers or automatic
end logic; nonfinite/negative values display as zero, fractions are floored.
Optional `statusMessage` uses a status region. Callback errors, permission failures,
and reconnection policies belong to the caller, which can describe them through
phase/status. No provider deletion or saved-memory guarantees are added.

## Verification — October 3, 2026, America/Detroit

All commands ran in the assigned worktree against base
`a601a0eaea6cd84b68050687fa1ebfd6fb85a39f` plus uncommitted owned changes.
Project-local Node verified as `v22.23.3`; Chromium used from the existing
Playwright cache. Only port 3003 was used locally. No environment files copied or edited.

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
and full browser suite were not used locally. Recreate this config locally before repeating.

### Reproduce the isolated checks

Run from `/Users/ethansaba/code/therapist/.worktrees/g1-frontend` on
`agent/g1-frontend`. The config and screenshots are intentionally ignored and are
not included in the PR. Recreate the exact config without modifying shared files:

```sh
npm ci
mkdir -p artifacts/local/frontend-preview
cat > artifacts/local/frontend-preview/playwright.config.cjs <<'EOF'
const { defineConfig, devices } = require('../../../node_modules/@playwright/test');
const path = require('node:path');
module.exports = defineConfig({
  testDir: path.resolve(__dirname, '../../../tests/browser'),
  testMatch: 'frontend-preview.spec.ts',
  outputDir: path.resolve(__dirname, 'results'),
  reporter: 'list',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:3003', trace: 'off', screenshot: 'off', video: 'off' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
EOF
npm run dev -- --port 3003
```

While that server runs, use a second terminal in the same worktree:

```sh
npx playwright test --config artifacts/local/frontend-preview/playwright.config.cjs
```

Open `http://127.0.0.1:3003/design-preview` for manual review. Fixture controls
switch setup/call, select all four phases, toggle synthetic media, exercise disabled
Start, and supply long example text. Start, mute, camera, and End change display
state only. No credentials are needed. Test screenshots use `setup-*`,
`connecting-long-*`, `call-long-*`, and `call-*` names inside per-test result folders.

Stop the development server before running the production check on the same port:

```sh
npm run typecheck
npm run build
npm run start -- --port 3003
```

Then, in the second terminal:

```sh
FRONTEND_PREVIEW_PRODUCTION=1 npx playwright test --config artifacts/local/frontend-preview/playwright.config.cjs --output artifacts/local/frontend-preview/production-results
```

Stop the production server when finished. A successful development run has six
passes and one intentional skip; a successful production run has one pass and six
intentional skips. `git diff --check` and `git status --short` expose generated
changes before staging; keep commits within the assigned paths.

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

## Delivery and CI evidence

- Implementation: `8a46703` (`feat: add isolated setup and video call presentation`).
- Initial PR/verification handoff: `6b19d80` (`docs: link frontend draft PR and verification handoff`).
- Draft [PR #7](https://github.com/esaba12/conversaton-practice/pull/7) targets
  `build/g1-foundation` from `agent/g1-frontend`; no previous frontend PR existed.
  Both commits were pushed, and the worktree was clean at handoff.
- The initial [CI run](https://github.com/esaba12/conversaton-practice/actions/runs/37143417445)
  was queued when first checked at 14:14 EDT.
- Follow-up verification at 14:20 EDT confirmed
  [Application checks run 37143448569](https://github.com/esaba12/conversaton-practice/actions/runs/37143448569)
  **passed** for head `6b19d8044be09966b70e7fb2625d88c9cdbae701`, completing at
  14:16:29 EDT. `gh run view 37143448569 --repo esaba12/conversaton-practice --json headSha,conclusion,url,jobs`
  returned success for install, typecheck, unit tests, production build, Chromium
  installation, and the repository browser-test step. CI used its existing shared
  workflow/config in GitHub's runner; it did not start port 3100 in this worktree.
- This follow-up expands documentation only. Implementation checks were not rerun
  for prose changes. CI success is attributed to the exact head above; later
  documentation commits have their own checks.

No merge performed; integrated revision, authenticated app wiring, permission and
connection recovery, real device accessibility checks, and live audiovisual/teardown
acceptance remain with the coordinator. The local task servers are stopped. No G1
gate is marked passed, and issue #4 remains open for its integration acceptance.
