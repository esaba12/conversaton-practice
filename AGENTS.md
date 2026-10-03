# Project instructions

## Mission
Build a live conversation rehearsal prototype with video chats for MHacks. Read README.md, docs/01-PRD.md, and the current task in docs/10-BUILD-PLAN.md before changing code. This is a practice tool, not therapy or a predictor of real people's reactions.

## Decisions
- One human is building with multiple coding agents. Follow the gate order in docs/10-BUILD-PLAN.md; delegate independent tasks within the active gate using docs/19-AGENT-WORKFLOW.md.
- Generate an editable conversation setup from a user-described situation, then respond live as the user speaks. The user confirmed live roleplay. This is core scope; do not cut custom generation to add other features or add written scripts by default.
- Each practice starts fresh; approved settings may persist, but simulated history does not carry over.
- Use TypeScript, Next.js App Router, npm, Tavus CVI with ElevenLabs TTS, and Supabase Auth/PostgreSQL. The latest setup direction uses Tavus conversation orchestration and ElevenLabs speech; older ElevenLabs Agents/LiveAvatar-specific contracts must be revised before implementation. The user's latest decision returns to Supabase because AWS credits will not arrive in time. They supplied a fresh project; use the local configuration recorded in STATUS.md and verify migration access before applying migrations. AWS/Cognito/Aurora are no longer build prerequisites. See docs/18-DESIGN-AND-AWS.md (historical filename, current backend direction).
- Require sign-in before designing personas, preparing conversations, generating setups, or practicing. Anonymous entry is no longer the product default.
- Use a server-only structured-output model for setup and reflection. Keep model IDs in configuration.
- Implement one tested vertical slice before adding features.
- Follow docs/16-MHACKS-STRATEGY.md: Actually Intelligent and ElevenLabs are primary targets. Sponsor breadth is not a build goal.
- All coding and building must occur during the event. Submit before October 4 at noon America/Detroit; target 11:30 AM.
- Keep the existing model/backend defaults. Gemini is a pre-implementation alternative for setup/reflection only; Photon text rehearsal is deferred until all core gates pass in this solo build. Relay is lower priority and should not be added alongside Photon during this build. Do not silently migrate providers for prizes.
- Confirmed core experience: FaceTime-style calls with a visible, talking fictional AI counterpart. Real synchronized video is required in G1; audio-only or prerecorded/static fallback cannot pass. Follow docs/22-LIVE-VIDEO.md. The former blanket avatar exclusion is superseded. Tavus CVI + ElevenLabs TTS is the current setup route; provider access and live behavior remain unverified.
- Prioritize live conversation, editable personas, approved memory, and a natural session ending.
- G3 (user decision, October 3, 17:05): saved people with a chip editor, an About-me profile, and per-person drag-and-drop sharing (with a keyboard path) of what each person knows about the user. Saving after a practice is an explicit step. See docs/26-PEOPLE-AND-SHARING.md.
- Appearance (user decision, October 3, 17:23): a saved person may later use a preset stock face and premade voice. No photo upload, generated likeness, or voice cloning. Not part of the in-progress G3 build. See docs/00-DECISIONS-AND-VIABILITY.md.
- No group conversations, voice cloning, social scores, or branching replay in the MVP.
- Keep application implementation small; do not add runtime orchestration frameworks, vector databases, or custom speech pipelines. This does not restrict coding subagents or worktrees used to build the app.

## Domain boundaries
- Persona: fictional counterpart based on user-approved traits.
- Scenario: context and communication goal for one practice.
- Profile: user-approved preferences and goals, plus About-me facts. A saved person (persona) knows only the About-me facts the user explicitly shared with it (docs/26-PEOPLE-AND-SHARING.md). Private preparation notes are never shareable.
- Memory proposal: unapproved suggestion with source and target field.
- Synthetic session events never establish facts about real people.
- Private user fears and coaching notes must not enter counterpart context.
- The counterpart is not an advice assistant. Reflection is a separate stage.

## Implementation
- Validate request bodies and model outputs with Zod.
- Authorize every database read and write by the authenticated owner.
- No service-role key or provider secret in client bundles.
- Avoid logging audio, video, camera frames, transcripts, private prompts, or tokens. Optional user camera is local preview only, off until opt-in; do not publish its tracks or imply the counterpart can see it.
- Live voice agent has no database write tools.
- Approving a memory proposal must be transactional and version-checked.
- End must disconnect all session media and release the microphone and any active camera tracks.
- Muting is not pausing. Do not label mute as pause.
- Persist approved memories, not raw transcripts, by default.
- Implement actual provider deletion status instead of promising instant global erasure.

## Documentation and tools
Use current ElevenLabs documentation for SDK signatures. Use the installed ElevenLabs agents skill when appropriate. Use official OpenAI documentation for OpenAI APIs and Codex. Context7 can locate library documentation; verify consequential API details against the library's own docs or installed types.
Use Playwright CLI or the configured browser tool to inspect the UI. Browser mocks do not establish live audiovisual quality.
Record installed versions in the lockfile. Do not upgrade dependencies during final demo preparation.
Follow docs/20-DOCUMENTATION-STANDARD.md. Update affected documentation with each behavior change, and record actual verification in the owning docs/tasks/ record. Distinguish planned, mock-tested, and live-verified work.

## Verification
Run type checking, relevant unit tests, and production build after meaningful integration changes. Test owner isolation, context separation, proposal approval, deletion, and session teardown. Follow docs/09-EVALUATION.md for live checks.
Never claim a mock is a working integration. Mark fallback mode visibly.
Do not broaden testing after the relevant gate passes without a concrete remaining risk.

## Working style
When resuming after a restart, read STATUS.md before starting work; it records the latest confirmed user decisions and next task.
Work through the build gates in order, with parallel tasks inside each gate. The coordinator maintains STATUS.md with completed gates, active ownership, blockers, and the next task; workers maintain their own task records. Do not invent credentials, URLs, sponsor rules, or test results. Ask for user action only when an external account or actual ambiguity blocks progress.

## Parallel engineering
- The user explicitly authorizes multitasking, coding subagents, and Git worktrees. Delegate useful independent work without asking again. Prefer a coordinator plus up to three workers when session capacity allows; fewer is fine when dependencies limit useful concurrency.
- Before dispatch, define the task's acceptance criteria, owned paths, dependencies, shared contracts, base revision, and documentation deliverables in docs/tasks/. Use read-only research/review when code cannot safely proceed independently.
- Use one writer per worktree/branch. In-session subagents share the filesystem unless explicitly assigned separate worktrees; assign disjoint paths if working in the same checkout. Never assume spawning an agent creates isolation.
- The coordinator owns shared schemas, dependency manifests/lockfiles, numbered specs, integration entrypoints, migration execution, shared cloud configuration, and STATUS.md unless ownership is explicitly reassigned. Workers propose changes to these through their task handoff.
- Isolate ports, build output, test artifacts, and local environments. Worktrees do not isolate the shared Supabase project/Auth settings, ElevenLabs agent, or microphone; coordinate those resources.
- Integrate one reviewed task at a time, verify the combined result, and pass the current gate before feature implementation in the next. Do not expand scope to keep agents busy.
- Preserve uncommitted work. Never force-remove worktrees, reset another worker's changes, or overwrite competing edits. If Git writes are restricted, prepare the exact handoff and report what remains unexecuted.

## GitHub workflow
- The user explicitly wants frequent GitHub use. Use `esaba12/conversaton-practice` for task issues, focused branches/commits, draft PRs, review, and CI checks throughout the build. Routine work within this repository is part of the authorized development workflow.
- Link each implementation task record to its issue and PR. Check for an existing issue/PR before creating another. Keep useful progress at task handoffs; avoid noisy updates for every command.
- Push focused task branches and open draft PRs once a reviewable change exists. PRs describe resulting behavior, relevant verification, documentation changes, and remaining live checks. Never imply that unrun checks passed.
- The coordinator reviews and integrates PRs one at a time, checks CI and combined behavior, and records the resulting revision. Close the issue only when its acceptance is met; merging a scaffold does not pass a live gate.
- Repository specs and task evidence remain the detailed source of truth; GitHub tracks work and review. Do not put secrets, private practice content, or local environment files in issues, commits, Actions logs, or artifacts.

## Photon stretch
Follow docs/17-PHOTON-TEXT-PRACTICE.md only after all core gates pass and the solo builder has time beyond demo/submission preparation. Use Spectrum for iMessage, share approved settings, and isolate session histories. Require verified account linking and explicit session start. No existing-chat ingestion, contact access, messages to real counterparts, unsolicited follow-ups, or automatic memory writes. Confirm current SDK/authentication/event behavior before coding; proposed internal contracts are not vendor APIs.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
