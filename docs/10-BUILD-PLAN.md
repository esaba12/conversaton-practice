# 24-hour build plan

Confirmed team: one human builder coordinating multiple coding agents. Pass the gates in order; parallelize independent tasks within the active gate. Situation generation is a core user requirement and must not be removed as a solo scope cut. Start with one voice and simplify automated reflection before compromising generation or live practice. Photon is deferred until all core gates pass and submission preparation is covered.

These are elapsed build targets, not a promise that a full 24 hours remains. Adjust optional work to the actual start time while preserving the submission buffer. The user authorizes proactive coding-agent delegation and worktrees; use them where they reduce the active gate's critical path.

## Dispatch and documentation
Follow [the agent workflow](19-AGENT-WORKFLOW.md) and [documentation standard](20-DOCUMENTATION-STANDARD.md). The coordinator establishes a reviewed committed baseline and completes [G1-00 foundation](tasks/G1-00-foundation.md) before dispatching [G1-01 auth/session](tasks/G1-01-auth-session.md), [G1-02 voice](tasks/G1-02-voice.md), and [G1-03 UI](tasks/G1-03-ui.md) in parallel. Freeze shared interfaces and file ownership first. [G1-04 integration](tasks/G1-04-integration.md) combines those tasks and proves the gate.

The coordinator owns STATUS.md, shared contracts, dependencies, and integration. Each worker updates its task record with changed behavior, exact checks, remaining gaps, and proposed spec changes. Documentation and combined verification are part of completion, not deferred cleanup. Later gates get bounded task records when their dependencies are ready; do not implement them early merely to occupy agents.

## Account readiness
The user has AWS credits and no capacity for another Supabase database. App-specific account access is unverified. Account creation, billing, and sponsor redemption remain user actions.
- First: ElevenLabs access for a base agent and real audio testing, plus AWS sign-in setup (Cognito recommended) so the workspace is authenticated from its first usable flow.
- Next: the configured structured-output provider (OpenAI by default) for situation generation in G2.
- Before G1 acceptance: AWS-hosted PostgreSQL for the verified identity mapping, owner-scoped session leases, and minimal cleanup metadata. G3 extends this foundation with saved profiles/personas and transactional memory. Supabase and anonymous entry are superseded. All workspace actions require sign-in; internal mocks are labeled development-only and do not count as working authentication.
- Hosting remains undecided. No deployment has been authorized or performed.

## Before the build window
The handbook requires all coding and building during the hackathon. The live schedule starts hacking at noon Saturday, October 3; submission is before noon Sunday, October 4, America/Detroit. This pack is a planning artifact; confirm advance planning/tool-setup allowances with organizers.
At the 11:30 AM-1 PM Sponsor Expo in Pierpont Connector Hall, ask about ElevenLabs credits and eligibility for both listed awards. Read docs/16-MHACKS-STRATEGY.md. Confirm team members and create the submission draft early during the build window.
Choose repository, account owners, and selected deployment path. Keep the project unnamed for now. Never put keys in a shared chat or committed file.

## 0-2 hours: sign-in and prove voice
- [ ] Scaffold Next.js/TypeScript with lockfile.
- [ ] Freeze shared identity/session/voice/error contracts, UI tokens, and worker ownership before parallel implementation.
- [ ] Establish required account sign-in and server authorization before exposing persona/setup/practice actions.
- [ ] Add minimal durable users/session/cleanup metadata with owner isolation and an atomic one-active-session lease; reserve broader domain persistence for G3.
- [ ] Create one fictional roommate preset: cleaning boundary, deflects with jokes, friendly underneath.
- [ ] Configure ElevenLabs base agent, voice, and model.
- [ ] Add server session credential route and browser voice adapter.
- [ ] Have a real five-turn conversation.
- [ ] End stops playback and releases microphone.
Gate G1: authenticated workspace and owner-scoped session authorization, durable concurrency control, a real five-turn voice exchange, and microphone teardown (including sign-out/expiry); stop adding features until repaired. Mocks support parallel development but do not pass this gate.

## 2-6 hours: full interaction
Parallel after draft/context contracts settle: setup generation, preparation/review UI, and context-separation tests/review. Integrate their combined behavior before G3.
- [ ] Implement preparation and review screens.
- [ ] Add typed persona and public/private context separation.
- [ ] Generate an editable scenario/persona/opening from a new user-supplied situation using validated structured output; suggest a goal only when omitted, and require review before starting.
- [ ] Provide manual fallback for generation errors without treating it as a completed generation integration.
- [ ] Configure one tested voice; add further choices only after the core flow works.
- [ ] Connect persona configuration to the provider session.
- [ ] Add challenge and pacing settings that actually affect behavior.
- [ ] Add connection/error states and duration boundaries.
Gate G2: a novel situation generates a usable setup; a new response and interruption work; private notes do not leak; each session starts without prior simulated history.

## 6-10 hours: persistence and memory
Parallel after repository/approval contracts settle: domain persistence, memory UI, and ownership/version tests. One coordinator applies migrations.
- [ ] Extend G1's verified identity/session foundation with domain tables and owner policies.
- [ ] Create ordered migrations and seed fictional presets.
- [ ] Persist profile/personas and versions.
- [ ] Implement proposal approve/edit/dismiss transaction.
- [ ] Implement no-app-save behavior.
Gate G3: approve one preference; next session uses it; second user cannot access it.

## 10-14 hours: reflection and deletion
Parallel after lifecycle contracts settle: reflection, deletion adapter, and retention/disclosure review. Integrate late-result handling before accepting closure.
- [ ] Add structured reflection with schema validation if time permits; otherwise retain optional user-written reflection and explicit preference approval.
- [ ] Verify the situation generation and manual fallback implemented in G2.
- [ ] Keep reflection separate from live character.
- [ ] Add delete/session cleanup and truthful provider status.
- [ ] Review provider retention and logs.
- [ ] Add support-exit and reassurance-loop probes.
Gate G4: end-to-end flow closes with a short optional reflection.

## 14-18 hours: evaluation
Parallel on one recorded integrated revision: focused domain checks, browser/accessibility checks, and demo/documentation review. Schedule live microphone checks on one device at a time.
- [ ] Run meaningful domain tests and browser mock tests.
- [ ] Test real microphone/interruptions and End.
- [ ] Conduct 3-5 optional low-stakes user sessions.
- [ ] Fix observed failures; record actual results.
Gate G5: no critical ownership/context/teardown defects.

## 18-21 hours: polish
- [ ] Accessibility and mobile layout pass.
- [ ] Tighten persona prompts based on observed failures.
- [ ] Remove unused UI and unsupported claims.
- [ ] Freeze dependencies and prepare a stable build.

## 21-23.5 hours: submission
- [ ] Record truthful backup demo.
- [ ] Practice a three-minute pitch with a 60-90 second live conversation.
- [ ] Check current submission fields and sponsor category requirements.
- [ ] Identify external APIs, starter code, and pre-existing tools.
- [ ] Verify demo link/repo visibility according to event rules.
- [ ] Submit by the internal target of 11:30 AM Sunday; retain confirmation. Official deadline is before noon.
- [ ] Include table number and all teammates. Verify sponsor opt-ins and required evidence.
- [ ] Be present for judging Sunday 12:30-2:30 PM at Duderstadt; expect repeat presentations.

## Final 30 minutes: submission buffer
Verify receipt and required fields, charge devices, and prepare the headset and backup. Avoid feature work that risks the submitted build.

## Sponsor scope gate
Keep voice, situation generation, and the core loop first. Defer Relay and Photon for the solo MVP. Gemini can replace the setup/reflection provider before that layer is implemented, but do not maintain two providers. Notability requires genuine Pro usage, a tools tag, a usage note, and two screenshots. Figma eligibility and prize stacking remain questions for organizers.

## Scope cuts
Cut in order: Photon/other extra channels -> animations -> extra voices -> optional repeat-practice shortcut -> automated reflection (keep self-reflection and explicit preference review). Recovery from a failed connection remains required.
Do not cut situation generation, real voice, editable persona, approved-memory boundary, End, or ownership protection.
If database setup blocks progress, continue isolated development with a labeled mock and record the blocker. G1/G3 cannot pass without their real ownership and persistence checks; do not present a local mock as an authenticated multi-user integration.

## Per-task handoff
Each worker records owned files, contract revision, changes, actual checks, blocker, and next action in its docs/tasks/ record. Only the coordinator updates STATUS.md after review/integration. Shared schemas and entrypoints have one assigned writer.

## First stretch allocation: Photon
Deferred for the solo MVP. Only consider a time-boxed 60-90 minute feasibility spike after all core gates pass and demo/submission preparation is covered. Verify a real Spectrum iMessage round trip and identity mapping before expanding scope. Do not wait for a sponsor workshop to prove core voice.
If access or integration is blocked, stop the spike. If successful and time remains, implement explicit start/end, shared approved persona settings, isolated temporary text context, delivery deduplication, and web reflection. Complete the relevant identity and closure tests before demonstrating the extension. Do not pursue Relay simultaneously. Text is the first scope cut if it jeopardizes the primary demo or submission.
