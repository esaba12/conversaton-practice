# Coordinator handoff

**October 3, 2026, 20:00 EDT.** This file’s “next evidence” steps below are historical. Current state is [STATUS.md](../STATUS.md). Remaining work is [docs/29](29-REMAINING-WORK.md). Next task is [POST-01](tasks/POST-01-workspace-polish.md).

The user is moving to Cursor. Frontend PR #7 and foundation PR #8 are merged to main at c178d37. **Read [the complete Cursor handoff](23-CURSOR-HANDOFF.md) and STATUS.md for current state, commands, evidence and a paste-ready prompt.** Read AGENTS.md, README.md, PRD, build gate and assigned task before edits.

Continue in the original checkout from current `main`, using a new focused task branch. The historical foundation branch remains preserved. External frontend has `.worktrees/g1-frontend` / `agent/g1-frontend`, port 3003, and [an exact presentation-only contract](tasks/G1-03-frontend-preview.md). Do not overlap its writes. Research/SQL authoring handoffs are in G1-00A/B/C. Coordinator owns shared contracts, dependencies, numbered docs, provider configuration, migration execution, STATUS and integration.

Next critical evidence is a human live Tavus/ElevenLabs call through the isolated loopback harness, followed by real sign-in and the authenticated G1 integration. API test-mode acceptance does not prove audiovisual behavior. Keep the app's disabled-call preview truthful until integrated.

Use the [startup runbook](21-START-BUILD.md), [build plan](10-BUILD-PLAN.md), [agent workflow](19-AGENT-WORKFLOW.md), [documentation standard](20-DOCUMENTATION-STANDARD.md), and [live-video requirements](22-LIVE-VIDEO.md).

Settled direction: required sign-in; generated editable situations; fictional counterpart; fresh sessions; optional local-only camera; Tavus CVI with ElevenLabs TTS; Supabase; server-only OpenAI setup/reflection. No new product discovery, AWS prerequisites, LiveAvatar pipeline, name selection, provider migration or stretch work.

Record checks as static/unit/mock/live, preserving failures and repairs. Do not close issues or mark gates passed from scaffolding alone. Review and integrate one task at a time; keep useful GitHub handoffs.

Submission target remains October 4 at 11:30 AM America/Detroit, before the recorded noon deadline. Photon/Relay stay deferred until every core gate and submission preparation are covered.
