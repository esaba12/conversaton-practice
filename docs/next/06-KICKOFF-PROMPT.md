# Kickoff prompt: coordinator for the wow pass

Written October 3, 2026, 22:40 EDT. Paste everything inside the fence into a new agent in `/Users/ethansaba/code/therapist`. The owner has authorized the build, subagents, worktrees, GitHub use, and committing the planning docs.

```text
You are the COORDINATOR for the "wow pass" build of the conversation-practice app in /Users/ethansaba/code/therapist (GitHub: esaba12/conversaton-practice). The owner authorizes you to build now, in parallel, with up to three coding subagents in separate Git worktrees. Work through Phase 0, then Phase 1, then onward, without waiting for me between phases. Advance on automated evidence and label every phase "live not verified" until I report a live check. Ask me only when an external account, a live call, or a real ambiguity blocks you.

## 1. Read first, in this order (do not skip)
1. AGENTS.md (project rules; they override everything below if they conflict)
2. STATUS.md (note: one paragraph says main is 723e1d7; main is actually eff6014 or later, so check `git log`)
3. docs/next/README.md, then docs/next/01-THE-WOW.md, 02-BUILD-PLAN.md, 03-CONTRACTS.md, 04-NEW-SPECS.md, 05-UI-UPGRADE.md
4. docs/00-DECISIONS-AND-VIABILITY.md (owner decisions, including the 22:15 and 22:35 entries)
5. docs/30, 32, 33 (behavior and design specs the slices cite), docs/19 (agent workflow), docs/20 (documentation standard), docs/tasks/TEMPLATE.md
6. node_modules/next/dist/docs/ for anything Next.js-specific (this Next.js has breaking changes; see the AGENTS.md block)

The experience target is 01-THE-WOW: lobby of people cards → briefing → Meet card → green room → "Show me first" (an AI stand-in plays the user and says their line while the user plays the counterpart) → Your turn → live Tavus call → recap → pocket card. The hero character is Jordan, the user's manager ("I need to slow down at work").

## 2. Step zero (you, before any worker)
1. `git status`. The checkout has uncommitted planning docs (README.md, STATUS.md, docs/00–33, docs/next/, docs/research/, artifacts/research-ui/). Preserve them. Never reset or revert. Commit them on a branch `docs/wow-pass-plan` and open a PR. Merge it after CI passes, so every worktree starts from a base that has the specs. Do not commit .env.local or anything with secrets.
2. Update STATUS.md: correct the main SHA; add "Wow pass build started", with the phase, owners, and next task. You own STATUS.md.
3. Create one GitHub issue per Phase 0 slice (0A, 0B/SPIKE-01, 0C, 0D, 0E). Check for existing issues first. Create a task record per slice in docs/tasks/ from TEMPLATE.md, with owned paths, base SHA, branch, worktree, port, and acceptance copied from 02-BUILD-PLAN.
4. Add `lucide-react` and `motion` (owner-approved, 05-UI-UPGRADE §8) to package.json with exact pinned current stable versions, run `npm install` to update the lockfile, run typecheck, tests and build, commit as the "C0 contract commit", and record the versions in the 0A task record. Workers never touch package.json or the lockfile.

## 3. Phase 0 dispatch (parallel)
Start these as subagents now, each in its own worktree from the C0 commit:
- 0A design tokens, serif, primitives (docs/33 §2–3; owns app/globals.css, app/layout.tsx font only, components/ui/**, lib/ui/motion.ts, app/design-preview/**, tests/unit/ui-*.test.ts). Worktree .worktrees/0a, branch agent/0a-tokens, dev port 3101.
- 0C flow state machine refactor, W1 (owns app/practice/practice-workspace.tsx, lib/practice/**, components/practice/**, tests/unit/practice-flow.test.ts). No visible change; all existing tests must pass. Worktree .worktrees/0c, branch agent/0c-flow, port 3102.
- 0B provider spikes and PALs: YOU do this yourself, in the main checkout, while workers run. Follow 02-BUILD-PLAN §2 0B and record results in docs/tasks/SPIKE-01-quality-pal.md: TTS model acceptance (eleven_v4_turbo, then eleven_v3_conversational), audio tags, Pro faces available, face preview fields and terms, append_context timing, conversation.respond latency, whether max_call_duration counts from create or join, whether direct ElevenLabs TTS matches the PAL voice. Create the quality PAL (Raven-1 audio perception, emotion_recognition full, no visual queries or callbacks, idle_engagement patient) and the stand-in PAL (its own premade voice, a face no person preset uses). Never edit the existing PAL; record its id for rollback. Do NOT switch TAVUS_PAL_ID until I do an A/B call. Then ask me for that call, with a short checklist.
After 0C merges: 0D video-first media (Q3), port 3103.
After 0A merges: 0E UI rules test, state gallery expansion, and scripts/ui/screenshots.mjs (05-UI-UPGRADE §2 and §6). The screenshot script is yours; the rules test and gallery go to a worker.

## 4. Rules for every worker (put these in each worker's prompt)
- Read AGENTS.md, the slice's section in docs/next/02-BUILD-PLAN.md, every spec it cites, docs/next/05-UI-UPGRADE.md §2 (UI rules) for any UI work, and its task record.
- Edit only the owned paths. If a shared file (lib/schemas/**, supabase/**, package.json, lockfile, scripts/preflight/**, practice-workspace.tsx after 0C, lib/practice/flow.ts) needs a change, stop and write the proposed change in the task record's handoff for the coordinator.
- No provider calls, no live Tavus/OpenAI/ElevenLabs requests, no migrations, no Git pushes to main, no dependency changes.
- Run typecheck and unit tests in the worktree. Do not run `npm run test:ui` (port 3100 is shared; the coordinator schedules it). Use only the assigned dev port.
- Private-field rule: goal, hard-moment line, notes, fear and likelihoods never reach counterpart context or a normal start body. Only the stand-in branch may carry goal and hard-moment line (W10).
- UI work must use tokens only, Lucide icons only, Motion for springs with useReducedMotion fallbacks, and the six interactive states. It must add its states to /design-preview.
- Commit on the slice branch, push it, open a draft PR linked to the issue, and fill in the task record: changed paths, evidence (mode and outcome kept separate), remaining risks. Never claim a live check.

## 4a. Which model runs each subagent
Pass the slug as the Task tool's `model` parameter. Use only slugs in your available-model list. If one is missing, use the fallback named here, and tell me which substitution you made. You, the coordinator, should run on claude-opus-5-thinking-high.

Rule of thumb: Claude Opus 5.5 for UI craft, GPT-5.6 Sol for server, privacy-critical and contract-heavy logic, Opus 5 thinking for the two riskiest boundary changes, Sonnet 5.5 for medium self-contained work, and Composer 2.5 fast for mechanical tasks.

| Slice | What it is | Model | Fallback |
|---|---|---|---|
| 0A | Tokens, serif, primitives, gallery | claude-opus-5-5-medium | claude-sonnet-5-5-high |
| 0C | Flow state machine refactor (teardown-critical) | claude-opus-5-thinking-high | gpt-5.6-sol-medium |
| 0D | Video-first media | claude-sonnet-5-5-high | gpt-5.6-sol-medium |
| 0E | UI rules test + gallery states | composer-2.5-fast | claude-sonnet-5-5-high |
| 1A | Call screen, ringing, interactions, HUD, shortcuts | claude-opus-5-5-medium | claude-sonnet-5-5-high |
| 1B | Lobby and briefing | claude-opus-5-5-medium | claude-sonnet-5-5-high |
| 1C | Person/situation server, stance, streamed draft (W11) | gpt-5.6-sol-medium | claude-opus-5-thinking-high |
| 1D | Meet card, green room, knowledge panel | claude-opus-5-5-medium | claude-sonnet-5-5-high |
| 1E | Goal-check and voice-preview routes + pill/button | gpt-5.6-sol-medium | claude-sonnet-5-5-high |
| 1F | Motion, morphs, synthesized sound | claude-sonnet-5-5-high | claude-opus-5-5-medium |
| 1G | Show me first (stand-in; the one rule exception) | claude-opus-5-thinking-high | gpt-5.6-sol-medium |
| 2A | Recap, retry, confidence arc, staging | claude-opus-5-5-medium | claude-sonnet-5-5-high |
| 2B | Reflection server (quotedLine, style, alternative) | gpt-5.6-sol-medium | claude-sonnet-5-5-high |
| 2C | Pocket card, feedback style | claude-sonnet-5-5-high | composer-2.5-fast |
| 2D | Landing with live Meet card | claude-opus-5-5-medium | claude-sonnet-5-5-high |
| 3A, 3B | Planned date/check-in, brave things routes + UI | claude-sonnet-5-5-high | gpt-5.6-sol-medium |
| 3C | Appearance catalog, server preset mapping | gpt-5.6-sol-medium | claude-sonnet-5-5-high |
| 3D | People dossier, data map restyle | claude-opus-5-5-medium | claude-sonnet-5-5-high |
| 4A–4D | Reach features | claude-sonnet-5-5-high | gpt-5.6-sol-medium |

Read-only reviews (run before you merge; never the same model as the writer):
- Privacy/boundary review of 1C, 1E, 1G, 2B, 3A–3C, and every migration: claude-opus-5-thinking-high (gpt-5.6-sol-medium if the writer was Opus thinking).
- UI screenshot review against 05-UI-UPGRADE §2 for every UI PR: gemini-3.8-flash-high, given the screenshot files as attachments (fallback claude-sonnet-5-5-high).
- Codebase lookups for yourself: the explore subagent with composer-2.5-fast.

## 5. Integration loop (you)
For each finished PR, one at a time: review it against the slice acceptance and the ownership boundaries; rebase if needed; run `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:ui`; for UI PRs, also run the screenshot script and review against 05-UI-UPGRADE §2 with the .agents/skills/web-design-guidelines skill. Merge after CI passes, record the integrated SHA in the task record and STATUS.md, and close the issue only when acceptance is met. Then dispatch the next slice whose dependencies are now met, keeping up to three workers busy. Don't expand scope just to keep agents busy.

## 6. Phase 1 and beyond
At the Phase 0 exit (recipe green, UI gate in place, SPIKE-01 complete, A/B call done or labeled "live not verified"):
1. Freeze contracts C1 exactly as in 03-CONTRACTS §2. That covers role-context stance fields and lines, draft personId + stanceOptions + the W11 streaming draft, start branches (situation, openingOverride, manager preset, stand-in), people background and situations, goal-check and voice-preview routes, and media interactions. Amend docs/07, docs/08 and docs/32 A1 for the stand-in exception in the same commit (wording in 04-NEW-SPECS W10).
2. Write and apply migration M1 (03-CONTRACTS §2.5, including practice_sessions.kind and preset) to the shared Supabase project only after `supabase/tests/person_situations.sql` passes. Re-run people_sharing.sql, session_person.sql and session_foundation.sql. Only you apply migrations.
3. Dispatch 1A, 1B and 1C in parallel. Then 1D (after 1B) and 1G (after 1C). Integrate to the hero-path checkpoint and write tests/browser/hero-path.spec.ts covering lobby → briefing → Meet → green room → Show me first → Your turn → call → End, with teardown at every stage. Ask me for one live hero call. Then do 1E and 1F.
4. Continue with Phase 2 (C2, M2, 2A–2D), Phase 3 (C3, M3, catalog PALs, 3A–3E) and Phase 4, following 02-BUILD-PLAN.

## 7. Hard constraints
- One live Tavus call at a time; only you or I run live calls. Port 3000 (preflight) is yours alone; Playwright port 3100 runs one suite at a time.
- The Supabase project rcktybngebovyopregnt is shared; only you apply migrations, each with a two-owner SQL test first.
- Never log or commit audio, transcripts, private notes, tokens, or .env.local. No provider ids or keys in client bundles.
- No scores, streaks, recording, transcript storage, voice cloning, photo likeness, or group calls. Never use "therapy" or "therapist" in product copy.
- Don't upgrade existing dependencies. Next.js 16.3.8 / React 19.3.0 stay as installed.
- The deployed site https://conversation-practice-zeta.vercel.app is public. Do not deploy unfinished phases there unless I ask.

## 8. Report back to me
At each phase exit, and whenever you're blocked, send a short update with: what merged (with PR links), what's verified and how (unit / mock / live), what needs me (a live call checklist or an account action), and what's next. Keep STATUS.md current.
```
