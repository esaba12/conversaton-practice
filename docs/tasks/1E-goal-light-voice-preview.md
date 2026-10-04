# 1E: Goal light and voice preview (G1, W3)

Status: assigned
Updated: October 4, 2026
Assigned writer: 1E worker subagent
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 1 (after the hero-path checkpoint)
Requirements/tests: docs/next/02-BUILD-PLAN.md §3 1E; docs/32-FEATURE-SPECS.md G1; docs/next/04-NEW-SPECS.md W3; docs/next/03-CONTRACTS.md
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/64
Pull request: none yet
CI run: not run

## Assignment and isolation

- Base ref: `main` `a6a1a9a` (Phase 1 slices 1A–1D, 1G and the hero-path spec merged).
- Branch: `agent/1e-goal-voice`; worktree `/Users/ethansaba/code/therapist/.worktrees/1e`; dev port 3104.
- Owned: `app/api/sessions/[id]/goal-check/route.ts`, `lib/goal-check/**`, `app/api/voice-preview/route.ts`, `lib/voice-preview/**`, `components/practice/goal-pill.tsx`, `components/practice/hear-button.tsx` (+ a CSS module), a design-preview route `app/design-preview/goal-voice/page.tsx`, tests, this record.
- Not owned (propose exact diffs in Handoff): `app/practice/practice-workspace.tsx`, `components/practice/meet-card.tsx` (has a `hear` slot), `components/practice/green-room.tsx` (has an `extras` slot), `components/practice/call-screen.tsx` (goal pill placement), `lib/schemas/**`, `.env.example`, `package.json`/lockfile, numbered docs (docs/08 privacy line), STATUS.md.
- Shared resources: no provider calls (mock OpenAI and ElevenLabs with `fetch` stubs), no live calls, no migrations, no dependency changes, no pushes to main.

## Scope and acceptance

- [ ] G1 route: owner of a live session only; Zod body `{ goal ≤200, turns: string[≤6] each ≤500 }` → `{ met }`; non-owner/missing → 404, ended → 409; rate limit 1 per 3 s and 40 per session (per process); model id from configuration (propose an env name, falling back to OPENAI_SETUP_MODEL); `store:false`; nothing logged or stored.
- [ ] G1 client: off sends nothing; only user turns are sent (debounced 1 s after a finished user utterance); the first `true` lights the pill once (clay, check, `aria-live` "Goal reached") and no further checks are sent. Goal and turns never go to Tavus or any interaction.
- [ ] G1 green-room toggle "Light up my goal when I say it" with the spec note, off by default.
- [ ] W3 route `POST /api/voice-preview` `{ text ≤300, presetId? }` → `audio/mpeg`; 401 signed out, 400 over 300, 429 after 10 per 10 minutes per user; `Cache-Control: no-store`; voice id and TTS model server-side only (starter voice env names in .env.example); nothing stored or logged.
- [ ] W3 button: "Hear {name}", replays from memory, refetches when the opening changes, disabled with "Voice preview isn't set up" when unconfigured; the client function takes only the opening string and presetId; bundle contains no voice ids.
- [ ] Fixtures for the goal check prompt (paraphrase counts; refusal or question does not) as unit tests against a stubbed model.

## Handoff

(writer fills in)
