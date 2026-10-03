# G1 frontend presentation: isolated external agent

Status: ready
Gate: G1 presentation only; no live integration acceptance
Owner: user-launched frontend agent
Issue: https://github.com/esaba12/conversaton-practice/issues/4
PR: check existing PRs, then open focused draft when reviewable
Base: coordinator scaffold commit; record `git rev-parse HEAD` before edits
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
