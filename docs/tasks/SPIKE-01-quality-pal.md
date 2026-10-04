# SPIKE-01 (0B): Provider spikes, quality PAL and stand-in PAL

Status: active
Updated: October 3, 2026, 22:45 EDT
Assigned writer: wow-pass coordinator (main checkout)
Coordinator: same
Gate: Wow pass Phase 0
Requirements/tests: docs/32 Q1, T1; docs/next/04-NEW-SPECS.md W3, W5 (Q4), W6, W10; docs/next/03-CONTRACTS.md §1; R04 §7
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/43
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref: `main` at the C0 contract commit.
- Branch: coordinator commits on a docs/config branch.
- Worktree: `/Users/ethansaba/code/therapist`
- Dev port: N/A (no browser); preflight port 3000 reserved to the coordinator.
- Owned files: `scripts/preflight/provider-setup.mjs`, `.env.local` (never committed), `.env.example` (names only), this record.
- Shared resources: Tavus account and ElevenLabs account (remote; one live call at a time). The existing PAL is never edited.

## Scope and acceptance

Record, with exact HTTP outcomes and no payloads:

- [ ] TTS model acceptance: `eleven_v4_turbo`, then `eleven_v3_conversational`.
- [ ] Audio-tag behavior (performed or read aloud): needs a human listen.
- [ ] Pro/stock faces available on this account; preview/thumbnail fields; terms.
- [ ] `append_context` timing (mid-turn vs next turn): needs a live call.
- [ ] `conversation.respond` latency: needs a live call.
- [ ] `max_call_duration` counted from create or join.
- [ ] Direct ElevenLabs TTS matches the PAL voice: needs a human listen.
- [ ] Quality PAL created (Raven-1 audio perception, emotion_recognition full, no visual/analysis queries, no tools or callbacks, idle_engagement patient), readback verified.
- [ ] Stand-in PAL created with its own premade voice and a face no person preset uses, readback verified.
- [ ] Test-mode create and hard-delete pass for each new PAL.
- [ ] Previous `TAVUS_PAL_ID` recorded for rollback. `TAVUS_PAL_ID` not switched until the human A/B call.
- [ ] Human A/B notes, dated and attributed, or "live not verified".

## Verification evidence

(coordinator fills in)

## Handoff

- Changed paths and commit(s):
- Remaining failures/risks:
- External account action:
- Next smallest task:
- Coordinator integration: pending

Follow [documentation rules](../20-DOCUMENTATION-STANDARD.md). Do not copy private prompts,
transcripts, credentials, provider ids beyond what is needed for rollback, or personal account identifiers into this record.
