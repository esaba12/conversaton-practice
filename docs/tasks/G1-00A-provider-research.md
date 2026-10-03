# G1-00A-provider-research: Provider feasibility research

Status: integrated research handoff
Gate: G1 foundation research only
Owner: provider-research
Base revision: `4dc34a10b8206e8b375b9d767a780d5b1ea01968` plus preserved PREP-03 local documentation.
Issue: https://github.com/esaba12/conversaton-practice/issues/1
PR: https://github.com/esaba12/conversaton-practice/pull/8
Worktree: original checkout, read-only research except this task record.
Port: N/A
Dependencies: current project specs; official vendor documentation.
Shared contracts: proposals only; coordinator owns schemas, numbered specs and provider changes.
Owned paths: `docs/tasks/G1-00A-provider-research.md` only.

## Acceptance
Read current official Tavus CVI, ElevenLabs TTS, and Daily browser documentation. Return exact supported create/join/end/delete contracts, private-room authorization, per-call context, disabled recording/memory, camera privacy, interruption and retention limits. No provider mutation or live call.

## Handoff
Report source links, exact recommended contract, remaining live checks, and proposed spec corrections to coordinator. Update this record with actual evidence only if permitted; otherwise send exact handoff. No secrets or account payloads.

## Verification
October 3, 2026: static official-documentation research completed; coordinator integrated recommendations into docs/06, docs/22, the Tavus adapter and isolated preflight. Confirmed current PAL/face naming, explicit ElevenLabs TTS, private Daily token, stateless participant tags, perception/recording controls, camera suppression, interrupt event, End and hard-delete schemas. No transcript-disable or cascading ElevenLabs deletion guarantee was established. The worker performed no provider mutations or media tests. Later coordinator API results are recorded in G1-00; no audiovisual gate passed.

Sources: [Tavus OpenAPI](https://docs.tavus.io/openapi.yaml), [TTS](https://docs.tavus.io/sections/conversational-video-interface/pal/tts), [private rooms](https://docs.tavus.io/sections/conversational-video-interface/conversation/customizations/private-rooms), [Daily options](https://docs.daily.co/reference/daily-js/types/daily-call-options), [Daily destroy](https://docs.daily.co/reference/daily-js/instance-methods/destroy), [ElevenLabs retention](https://elevenlabs.io/docs/eleven-api/resources/zero-retention-mode).
