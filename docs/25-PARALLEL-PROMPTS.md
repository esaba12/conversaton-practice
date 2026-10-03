# Parallel agent prompts during G2 integration

Written October 3, 2026, 16:50 EDT by the G2 coordinator. The G2 coordinator session stays in `/Users/ethansaba/code/therapist` on `main` and owns STATUS.md, `lib/schemas/**` existing files, migrations execution, the shared Supabase project and the microphone. These prompts start **separate** agents that must not touch that checkout.

G2 passed and merged at `6682823`, so G3 is the active gate. Preparation in an isolated worktree is allowed: plan, contracts proposal, unapplied migration, repository code and unit tests, reviewed by the coordinator before anything merges or any SQL runs.

## Prompt A — G3 approved-memory preparation (recommended)

```text
You are the G3 preparation lead for /Users/ethansaba/code/therapist (MHacks
conversation-rehearsal prototype). G2 passed and merged to main (6682823). Another coordinator works in the
main checkout; do NOT edit, build in, or run git commands that write in
/Users/ethansaba/code/therapist itself.

Setup: create your own worktree from the G2 branch:
  git -C /Users/ethansaba/code/therapist worktree add .worktrees/g3-memory -b agent/g3-memory main
Work only in /Users/ethansaba/code/therapist/.worktrees/g3-memory. Run
`npm ci` there if node_modules is missing. Use dev port 3013 only if needed.

Read: AGENTS.md, STATUS.md, docs/24-G2-KICKOFF.md, docs/25-PARALLEL-PROMPTS.md,
docs/04-DATA-AND-MEMORY.md, docs/05-API-AND-ACTIONS.md, docs/09-EVALUATION.md
(T02-T08 as applicable), docs/10-BUILD-PLAN.md (G3), docs/19-AGENT-WORKFLOW.md,
docs/tasks/G1-00C-session-schema.md and both supabase/migrations files (RLS,
restricted RPC, capability pattern to follow).

Goal: make G3 ready to integrate the moment G2 passes. Gate G3 = approve one
preference; the next session uses it; a second user cannot access it. Smallest
path; no reflection model (G4), no transcripts stored.

Deliver, in order:
1. docs/tasks/G3-00-plan.md from docs/tasks/TEMPLATE.md: the minimal G3 design
   (which tables: likely profiles + personas + memory_proposals only; how a
   proposal is created before G4 exists, e.g. an explicit post-session
   "next time..." user statement; how approved profile pace/goal and a saved
   persona reach the next session's role context WITHOUT leaking private notes
   or prior simulated events), contracts, worker split G3-01..03 with owned
   paths, and risks. Stop and summarize this plan to the user before step 3
   if any decision is genuinely ambiguous.
2. Proposed new schema files only (do not edit existing lib/schemas files):
   lib/schemas/profile.ts, lib/schemas/persona.ts, lib/schemas/memory.ts.
3. supabase/migrations/<timestamp>_g3_memory.sql (NOT applied) with owner RLS,
   explicit grants, transactional version-checked approve/dismiss RPCs per
   docs/04, plus supabase/tests/g3_memory.sql assertions that roll back
   (two owners, stale version 409, repeated approval idempotent, dismissed
   never approved). Do not run any SQL against the linked Supabase project.
4. Repository + route code and Vitest unit tests (mocked Supabase) for
   profile/persona/proposal approve/dismiss, following lib/data/sessions.ts and
   lib/api/respond.ts patterns. Leave app/practice/practice-workspace.tsx,
   lib/session/server.ts and existing schemas untouched; write the exact
   integration diff you need there as a proposal in G3-00.
You may spawn up to two subagents inside your worktree on disjoint paths.

Allowed: npm run typecheck, npm test, npm run build inside your worktree.
Not allowed: applying migrations or any SQL on the shared project, editing
STATUS.md or numbered specs (propose changes in G3-00), live provider calls,
using the microphone, Playwright against port 3000, pushing to main, force
operations. You may commit to agent/g3-memory and push it, and open a DRAFT
PR against main titled "G3 prep
(unapplied migration)" plus GitHub issues for G3-01..03 in
esaba12/conversaton-practice. Never stage .env.local or secrets; copy
.env.local into the worktree only if a check truly needs it.

Finish with: G3-00 complete, verification evidence (only checks actually
run, with modes), the draft PR link, and the exact steps the coordinator must
take (apply migration, run SQL assertions, integrate diff, live check).
```

## Prompt B — demo and submission preparation (optional, docs only)

```text
You prepare the MHacks demo and submission for /Users/ethansaba/code/therapist
(conversation-rehearsal prototype; submit by Oct 4 11:30 AM America/Detroit).
Another coordinator is building in that checkout; do not edit code, build,
run the app, use the microphone, or write git there.

Setup: git -C /Users/ethansaba/code/therapist worktree add .worktrees/demo-prep -b agent/demo-prep main
Work only in .worktrees/demo-prep, docs only.

Read AGENTS.md, STATUS.md, README.md, docs/01-PRD.md, docs/11-DEMO-AND-SUBMISSION.md,
docs/16-MHACKS-STRATEGY.md, docs/22-LIVE-VIDEO.md, docs/24-G2-KICKOFF.md,
docs/tasks/G1-04-integration.md.

Deliver docs/tasks/DEMO-01-submission-prep.md (from TEMPLATE) containing:
a 3-minute pitch script with a 60-90 s live call segment (novel generated
situation, an edit, an interruption, End), a backup-demo shot list, Devpost
field drafts (what it does, how built, challenges, what's next, built-with
list naming Tavus CVI, ElevenLabs TTS, OpenAI Responses, Supabase, Next.js),
sponsor-track claims for Actually Intelligent and ElevenLabs mapped to
evidence that actually exists today (mark anything not yet verified as
pending), a judging-day checklist, and a list of claims we must NOT make
(therapy, prediction of real people, instant deletion, etc.). Propose edits
to docs/11 as a section in that record rather than editing docs/11.
You may commit to agent/demo-prep, push, and open a draft PR. Do not invent
sponsor rules or results; flag what needs organizer confirmation.
```

## Coordinator follow-up

After G2 passes and merges: review the G3 draft PR, apply its migration to the linked project, run its SQL assertions, integrate G3-01..03 one at a time, then live-check "approve one preference → next session uses it → second user denied".
