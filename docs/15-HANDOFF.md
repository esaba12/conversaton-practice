# Handoff

## Current state
Latest user intent: start implementation after resetting context. Use [the startup checklist](21-START-BUILD.md), then begin GitHub issue #1 / G1-00. Verify actual tool/Git/account state; prepared instructions are not completed setup.

Specifications are a reviewed build baseline and must evolve with implementation. Application implementation has not started. No application credentials, deployments, or runtime dependencies have been installed by this documentation task. See [STATUS.md](../STATUS.md) for current evidence and blockers rather than treating this handoff as another progress log.

One human builder is coordinating multiple coding agents. The user explicitly requested multitasking and worktrees in Warp. [The agent workflow](19-AGENT-WORKFLOW.md), [documentation standard](20-DOCUMENTATION-STANDARD.md), and prefilled G1 task records establish ownership and handoffs. Development delegation is authorized; no app runtime orchestration framework is needed.

Settled product direction: FaceTime-style calls with a visible talking fictional AI counterpart, fresh sessions, live roleplay from generated editable setups, Supabase Auth/PostgreSQL, required sign-in before all workspace actions, and warm minimal design with crisp modern styling. The user abandoned AWS credits and supplied fresh Supabase configuration; health is verified, integration is untested. Read [live video](22-LIVE-VIDEO.md) for the first provider feasibility checks and [design and backend direction](18-DESIGN-AND-AWS.md). Confirm the new project's details/access before applying migrations. Tooling is partially installed; see [tooling status](../tooling/README.md). Written sample conversations are outside scope.

## Coordinator prompt to paste into Codex

> Act as the build coordinator. Read STATUS.md, AGENTS.md, README.md, docs/01-PRD.md, the active gate in docs/10-BUILD-PLAN.md, docs/19-AGENT-WORKFLOW.md, and docs/20-DOCUMENTATION-STANDARD.md. Inspect Git/worktree state and preserve existing work. Start with docs/tasks/G1-00-foundation.md and its architecture/provider dependencies. Establish a reviewed committed baseline and shared contracts, then delegate G1 auth/session, voice, and UI tasks with explicit ownership and separate worktrees where supported. In-session subagents share files unless assigned isolation. Own shared specs, dependencies, integration entrypoints, and STATUS.md. Integrate one task at a time and verify the combined result. G1 requires real sign-in, minimal durable identity/session/cleanup records, a real five-turn fictional-roommate video exchange with synchronized responsive speech and animation, and End that stops all media and releases mic/camera, including sign-out/expiry. Use current official docs and installed types. Continue independent work if credentials are missing, label mocks, and record exact remaining account actions. Do not pass a gate on mock evidence or begin later-gate features before it passes. Update affected docs and task evidence throughout.

## Worker prompt

Launch from the assigned worktree and substitute the assigned task file:

> Read AGENTS.md, STATUS.md, README.md, docs/01-PRD.md, the active gate in docs/10-BUILD-PLAN.md, and docs/tasks/G1-02-voice.md. Implement only the assigned task and owned paths at its agreed base revision. Read the task's linked contracts. Report shared-contract/dependency changes before editing them. Update your task record with actual commands, outcomes, limitations, and handoff; leave STATUS.md and numbered specs to the coordinator unless ownership is reassigned. Do not treat a mock as a live integration. Preserve other workers' changes and hand off a focused commit or exact diff if committing is blocked.

The worktree helper and optional Warp tab configuration are described in [the workflow](19-AGENT-WORKFLOW.md). A proposed branch, port, or worktree is not a running worker; record actual assignments before dispatch.

## Event constraints
All coding and building must occur during the event. Target Actually Intelligent and both listed ElevenLabs awards, pending category-stacking confirmation. Submit by 11:30 AM Sunday internally; the official deadline is before noon October 4, America/Detroit. Prepare a three-minute pitch and attend judging 12:30-2:30 PM at Duderstadt.

## After G1
Read docs/04-DATA-AND-MEMORY.md and docs/05-API-AND-ACTIONS.md. G2 adds user-situation generation, persona review, and the complete role-context allowlist. G3 extends G1's minimal durable identity/session foundation with owner-scoped profiles/personas and approved-memory transactions. Keep the ordered gates and dispatch independent tasks within each.

## Recording progress
Workers use [the task template](tasks/TEMPLATE.md), including revision, mode/outcome, exact checks, documentation changes, and next action. Only the coordinator updates STATUS.md with integrated results, active worker ownership, concrete blockers, and the next smallest task. Unrun live checks stay explicit.

## Decisions already settled
- Web prototype for adult everyday conversation rehearsal.
- One human with multiple coding agents; Photon deferred until all core gates pass and submission preparation is covered.
- User-described situations are the primary input; working situation generation is required.
- Fresh sessions; saved settings do not imply memory of previous fictional events.
- One counterpart at a time.
- User edits personas; proposed learning is approval-based.
- Private notes are excluded from counterpart context.
- No clinical efficacy claims or social scoring.
- Sessions have a clear ending.
- Full transcripts are not permanent application memory.
- Optional mock exists for development, explicitly labeled.
- Project name is undecided; naming does not change requirements.

## Unresolved decisions
- Commit the newer website/backend changes before creating task worktrees. Baseline commit `ec919a5` already exists on main tracking origin/main; verify current state in STATUS.md and Git.
- Prize stacking, detailed Figma eligibility, available credits, and advance preparation allowances.
- Optional Gemini provider decision before setup/reflection implementation; no change by default.
- Available ElevenLabs voice/model IDs.
- Structured-output provider model ID.
- Fresh Supabase project details/access (user will create it), Auth configuration, and verified ownership policies.
- Public hosting versus supervised local/private demonstration.
- Exact tested provider retention settings.

## Glossary
Persona: editable fictional counterpart configuration.
Scenario: one practice situation with separate public facts and private user preparation.
Profile: user-approved preferences and goals.
Practice: one bounded live video call with the fictional AI counterpart.
Reflection: optional short post-session review.
Proposal: a pending memory change that cannot affect future sessions before approval.
Role context: allowlisted information the counterpart is permitted to know.
Private notes: preparation that must not enter role context.
Version: monotonically increasing revision used to prevent stale edits.
No-app-save mode: no lasting application memory; provider processing disclosed separately.

## Photon stretch handoff
After all core gates pass and submission preparation is covered, read docs/17-PHOTON-TEXT-PRACTICE.md if enough time remains. Verify current Spectrum setup, credentials, event authentication, and iMessage deployment requirements with official sponsor docs. Prove one real round trip in a separate adapter before expanding UI. Keep voice as the primary demo. No vendor SDK method names or credential variables are specified until verified.
