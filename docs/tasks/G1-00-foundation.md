# G1-00: Establish the foundation for three independent workers

Status: planned
Updated: October 3, 2026, America/Detroit
Assigned writer: unassigned; coordinator role
Gate: G1 preparation; does not pass G1
GitHub issue: [#1](https://github.com/esaba12/conversaton-practice/issues/1)
Pull request: not opened; CI: not run
Requirements/tests: P04, P05, P09, P12, P13; T01, T03, T09, T10, T12, T13 contract coverage

## Assignment and isolation

- Base ref + SHA: pending coordinator baseline; no SHA assigned.
- Branch/worktree: proposed `main` in `/Users/ethansaba/code/therapist`; verify before work.
- Port: proposed 3000; no server started by this brief.
- Dependencies: committed baseline; selected supported Next.js/AWS hosting path and authentication approach.
- Account blockers: AWS region/access and ElevenLabs access remain unverified. Contract/scaffold work can proceed where independent; record unresolved live dependencies.

All paths below are proposed. The coordinator freezes exact ownership and records the
foundation commit before changing dependent tasks from `planned` to `ready`.

- Scaffold/config: `package.json`, `package-lock.json`, `.gitignore`, `.env.example`, `tsconfig.json`, `next-env.d.ts`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `tests/setup.ts`.
- CI: `.github/workflows/ci.yml`, after app scripts/lockfile exist; shared repository templates remain coordinator-owned.
- Initial entrypoints/tokens: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`.
- Shared contracts: `lib/schemas/auth.ts`, `lib/schemas/session.ts`, `lib/schemas/voice.ts`, `lib/schemas/errors.ts`, `lib/schemas/role-context.ts`.
- Fictional fixture: `fixtures/roommate.ts`; handoff record: this file.
- Shared resources: coordinator owns dependency changes, numbered specs, STATUS, cloud/provider configuration, migration execution, and final entrypoints. Worker paths are in G1-01 through G1-03.

## Scope and acceptance

- [ ] Scaffold once with a supported, pinned runtime/dependency set and meaningful typecheck/unit/browser/build scripts; record actual versions and commands.
- [ ] Add GitHub Actions for the actual typecheck, relevant deterministic tests, and production build; run on PRs without live provider secrets. Record the real run/result, keeping audio/account acceptance separate.
- [ ] Verify consequential auth/voice/database API choices against installed types and official docs. Define internal contracts without inventing vendor SDK calls.
- [ ] Freeze verified identity, owner-scoped session credential/start/connected/end, sanitized errors, browser voice adapter, UI props/events, and public-only role-context contracts. Assign the connected acknowledgement receiver/caller and verify how a provider conversation ID can be bound to the authorized app session; client-supplied IDs alone cannot authorize provider retrieval/deletion.
- [ ] Persisted states are `connecting`, `active`, `ending`, `ended`, `interrupted`, `deleted`. UI phases `draft`, `ready`, `reflecting`, `closed` are separate. Define transitions, idempotency, lease expiry, and late-event rejection.
- [ ] Establish G1 minimal database design: internal users mapping, owner-scoped session leases and required cleanup metadata. Broader profiles/personas/approved memory remain G3. A database outage must not become an anonymous or process-memory ownership fallback.
- [ ] Define local teardown on End, sign-out, auth expiry, navigation/unmount, and failure independently of any network request. Never block microphone release on server acknowledgement.
- [ ] Define warm/minimal/crisp UI tokens, accessible controls, explicit mock indication, and the fixed public fictional-roommate fixture.
- [ ] Freeze each worker's exact paths, dependencies, shared resources, test seams, ports, and base SHA; only then dispatch up to three parallel workers.

## Documentation and contract handoff

Coordinator updates affected sections of docs/03, 04, 05, 06, 09, 10, 12, 18 and STATUS;
record provider/service selections as selections, not working integrations. `.env.example`
contains placeholders and server/client scope, never secrets. Document startup, migration
execution ownership, and the exact supported auth callback origins.

## Verification evidence

- Mode/outcome: `not-run` / `not-run` for all implementation checks.
- Date/time, tested SHA/dirty state, environment/directory, command/steps, exit code, observation/artifact: pending execution; no application evidence exists in this brief.
- Planned checks: frozen typecheck/test/build commands, shared-contract review, clean install from lockfile. Real authentication/database/audio checks belong to G1-04.

## Handoff

- Changed implementation paths/commits: none recorded; task planning only.
- Remaining risk: unresolved hosting/auth/database choices can change proposed paths before freezing.
- Next action: coordinator establishes baseline and foundation; workers remain unassigned and planned.
- Ready for review/integrated revision: no / pending.
- Follow [workflow](../19-AGENT-WORKFLOW.md) and [documentation standard](../20-DOCUMENTATION-STANDARD.md).
