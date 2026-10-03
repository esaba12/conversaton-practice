# G1-00: Establish the foundation for three independent workers

Status: active
Updated: October 3, 2026, America/Detroit
Assigned writer: coordinator
Gate: G1 preparation; does not pass G1
GitHub issue: [#1](https://github.com/esaba12/conversaton-practice/issues/1)
Pull request: not opened; CI: not run
Requirements/tests: P04, P05, P09, P12, P13; T01, T03, T09, T10, T12, T13 contract coverage

## Assignment and isolation

- Base ref + SHA: pending coordinator baseline; no SHA assigned.
- Branch/worktree: proposed `main` in `/Users/ethansaba/code/therapist`; verify before work.
- Port: proposed 3000; no server started by this brief.
- Dependencies: committed baseline; supported Next.js runtime and Supabase Auth integration. Vercel is the recommended app host.
- Account readiness: the fresh Supabase project is configured locally and Auth health returned HTTP 200; real sign-in, migration access, and database isolation remain untested. ElevenLabs and avatar streaming credentials/access need verification. Contract/scaffold work can proceed independently.

All paths below are proposed. The coordinator freezes exact ownership and records the
foundation commit before changing dependent tasks from `planned` to `ready`.

- Scaffold/config: `package.json`, `package-lock.json`, `.gitignore`, `.env.example`, `tsconfig.json`, `next-env.d.ts`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `tests/setup.ts`.
- CI: `.github/workflows/ci.yml`, after app scripts/lockfile exist; shared repository templates remain coordinator-owned.
- Initial entrypoints/tokens: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`.
- Shared contracts: `lib/schemas/auth.ts`, `lib/schemas/session.ts`, `lib/schemas/media.ts`, `lib/schemas/errors.ts`, `lib/schemas/role-context.ts`.
- Fictional fixture: `fixtures/roommate.ts`; handoff record: this file.
- Shared resources: coordinator owns dependency changes, numbered specs, STATUS, cloud/provider configuration, migration execution, and final entrypoints. Worker paths are in G1-01 through G1-03.

## Scope and acceptance

- [ ] Scaffold once with a supported, pinned runtime/dependency set and meaningful typecheck/unit/browser/build scripts; record actual versions and commands.
- [ ] Add GitHub Actions for the actual typecheck, relevant deterministic tests, and production build; run on PRs without live provider secrets. Record the real run/result, keeping live video/audio/account acceptance separate.
- [ ] Complete a bounded media feasibility preflight under [the live video contract](../22-LIVE-VIDEO.md): the core is a FaceTime-style, real-time talking AI counterpart. Evaluate ElevenLabs plus avatar streaming; LiveAvatar is a candidate under official-documentation research, not a selected or proven integration. Record the timebox, actual evidence, account blockers, and decision before freezing provider contracts.
- [ ] Verify consequential auth/media/database API choices against installed types and official docs. Establish a trusted server-side path for public-only per-session context without mutating a shared agent prompt. Confirm interruption stops both speech and stale lip-synced video, server-issued credentials, authoritative provider ID association, and cleanup across both services. Unverified vendor behavior remains an explicit blocker; internal contracts do not prove SDK support.
- [ ] Freeze verified identity, owner-scoped session credential/start/connected/end, sanitized errors, browser media adapter, UI props/events, and public-only role-context contracts. The media worker owns stream controllers and all camera/microphone acquisition; UI consumes stream references and emits controls. Assign the connected acknowledgement receiver/caller and verify how each provider session ID binds to the authorized app session; client-supplied IDs alone cannot authorize provider retrieval/deletion. Define readiness only when usable counterpart audio and live video are present.
- [ ] Persisted states are `connecting`, `active`, `ending`, `ended`, `interrupted`, `deleted`. UI phases `draft`, `ready`, `reflecting`, `closed` are separate. Define transitions, idempotency, lease expiry, and late-event rejection.
- [ ] Establish G1 minimal database design: verified Supabase Auth user IDs, owner-scoped session leases and cleanup metadata protected by RLS, and atomic database RPCs. Broader profiles/personas/approved memory remain G3. A database outage must not become an anonymous or process-memory ownership fallback.
- [ ] Define local teardown on End, sign-out, auth expiry, navigation/unmount, and partial/failed connection independently of any network request: stop playback, detach streams, cancel reconnects, and release microphone and any active camera tracks. Never block local release on server acknowledgement; track pending remote cleanup truthfully for both services.
- [ ] Define warm/minimal/crisp FaceTime-style UI tokens, accessible controls, explicit mock indication, and the fixed public fictional-roommate fixture. Optional user-camera preview is off by default and local-only: no upload, provider publication, recording, or camera permission prerequisite to practice.
- [ ] Preserve the live video gate: voice-only playback, a static portrait, prerecorded footage, and mock media cannot satisfy G1.
- [ ] Freeze each worker's exact paths, dependencies, shared resources, test seams, ports, and base SHA; only then dispatch up to three parallel workers.

## Documentation and contract handoff

Coordinator updates affected sections of docs/03, 04, 05, 06, 09, 10, 12, 18, 22 and STATUS;
record provider/service selections as selections, not working integrations. `.env.example`
contains placeholders and server/client scope, never secrets. Document startup, migration
execution ownership, and the exact supported auth callback origins.

## Verification evidence

October 3, 2026, 13:56 America/Detroit, original checkout on `build/g1-foundation`, `e98fa75` plus scaffold: `npm run typecheck`, `npm test` (5 contract tests), `npm run build` all exited 0. Mode static/unit; outcome pass. Node 22.23.3 used by npm scripts. No live authentication/video acceptance. `supabase db query --linked` read-only schema check passed: intended fresh project has Auth schema and zero public tables. No migration applied. External frontend presentation task is isolated by `G1-03-frontend-preview.md`; media contracts are still provisional.

- Mode/outcome: `not-run` / `not-run` for all implementation checks.
- Date/time, tested SHA/dirty state, environment/directory, command/steps, exit code, observation/artifact: pending execution; no application evidence exists in this brief.
- Planned checks: bounded provider feasibility evidence, frozen typecheck/test/build commands, shared-contract review, clean install from lockfile. Real authentication/database/responsive video/audio checks belong to G1-04.

## Handoff

- Changed implementation paths/commits: none recorded; task planning only.
- Remaining risk: provider feasibility/access, runtime/hosting decisions, and unverified migration access can change proposed paths before freezing. Supabase is selected; an avatar provider has not yet been selected or proven.
- Next action: coordinator establishes baseline and foundation; workers remain unassigned and planned.
- Ready for review/integrated revision: no / pending.
- Follow [workflow](../19-AGENT-WORKFLOW.md) and [documentation standard](../20-DOCUMENTATION-STANDARD.md).
