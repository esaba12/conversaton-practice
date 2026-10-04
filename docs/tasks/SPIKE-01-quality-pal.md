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
- Owned files: `scripts/preflight/provider-setup.mjs`, `scripts/preflight/spike-01-read.mjs` (new, read-only probe), `scripts/preflight/spike-01-pals.mjs` (new, PAL creation + readback + test-mode round trip), `scripts/preflight/video-server.mjs` and `video.html` (A/B variants and timing probes), `.env.local` (never committed), `.env.example` (names only), this record.
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

## Results (October 3, 2026, 22:55–23:15 EDT)

Sources read the same night: Tavus docs (TTS, Perception, LLM, Conversational Flow, Emotion Control, Stock Faces, Interactions overview) and `https://docs.tavus.io/openapi.yaml`.

| Question | Answer | How known |
| --- | --- | --- |
| Tavus accepts `eleven_v4_turbo` | **Accepted at PAL create** (HTTP 200) and read back as `eleven_v4_turbo`, so `eleven_v3_conversational` was not needed. Audio on a call is **not verified** | API (live), no call |
| ElevenLabs models on this key | `eleven_v4`, `eleven_v4_turbo`, `eleven_v3`, `eleven_v3_conversational`, `eleven_flash_v2_5` and older | `GET /v1/models` HTTP 200 |
| Audio tags performed or read aloud | Direct ElevenLabs `eleven_v4_turbo` with `[sighs]`/`[laughs]`: HTTP 200, sample saved for listening. Through Tavus: **unknown** until variant T is called | API (live) + pending human listen |
| Faces | 144 system faces, all `available_for_plan: true`; models: phoenix-3, phoenix-4, phoenix-4.5; 30 tagged `pro`. The three featured Pro faces are present. **Today's call face ("Luna") is phoenix-3**, the oldest model, which may explain the lip-sync note from G1 | `GET /v2/faces` HTTP 200 |
| Face preview fields | Every face has `thumbnail_image_url` and `thumbnail_video_url` (host `cdn.replica.tavus.io`). W6 can map preset id → still or loop server-side. Terms for caching/re-hosting the stills are **not confirmed**; until then, proxy or hot-link by preset id and do not commit copies | API field names |
| Emotion expression | Automatic on phoenix-4/4.5 faces ("no parameter to set"), best with Raven-1 + Sparrow-2 + `tavus-gemma-4` | Tavus Emotion Control doc |
| `max_call_duration` from create or join | **Not stated** in docs ("maximum duration of the call"); only `participant_absent_timeout` is explicitly "from conversation creation". Not tested live. Per W5: keep create-on-ready | OpenAPI text |
| `append_context` timing | **Pending live call** (harness button "Probe: send wrap-up context" logs ms to the counterpart's next speech) | — |
| `conversation.respond` latency | **Pending live call** (harness "Send typed line") | — |
| Direct ElevenLabs TTS matches PAL voice | Pending human listen: `artifacts/local/spike-01/jordan-opening-v4turbo.mp3` (ignored) vs call variant B. Direct TTS took ~1.0 s (v4 turbo) and ~0.35 s (flash) for one sentence | API (live) |
| LLM readback | New PALs omit default-valued LLM fields; `PATCH /layers/llm/model = tavus-gemma-4` returned **304 Not Modified**, so the model is the default `tavus-gemma-4`. The existing PAL shows it explicitly | API (live) |

### PALs created

Both created with `POST /v2/pals` HTTP 200 and stored only in `.env.local`. Readback (`scripts/preflight/spike-01-pals.mjs`): ElevenLabs engine, `eleven_v4_turbo`, expected voice and default face, LLM `tavus-gemma-4`, `perception_model: raven-1`, `emotion_recognition: full`, no awareness/analysis queries, no perception/LLM tools, no `tool_ids`, no documents or skills, `sparrow-2`, patience high, interruptibility high, `idle_engagement: patient`. No callback URL is set (none is configured on the conversation either).

| PAL | Env names | Face | Voice |
| --- | --- | --- | --- |
| Quality (Q1 + T1), **not active** | `TAVUS_QUALITY_PAL_ID`, `TAVUS_QUALITY_FACE_ID` | "Anna - Casual", phoenix-4.5, Pro (`rc9cff32ceba`, public docs id) | same premade voice as today (Bella) so the A/B isolates model, face and perception |
| Stand-in (W10) | `TAVUS_STANDIN_PAL_ID`, `TAVUS_STANDIN_FACE_ID`, `ELEVENLABS_STANDIN_VOICE_ID` | "Jamie", phoenix-4.5. **Reserved**: never a person preset (B4 catalog must exclude it) | premade "River" (relaxed, neutral) |

Interruptibility stays `high` (the G1-verified setting); medium remains an A/B option. Rollback: `TAVUS_PAL_ID` is unchanged and still points at the original G1 PAL (perception off, `eleven_flash_v2_5`, last updated 18:07 EDT, unchanged by this spike). `.env.local.pre-spike01` (ignored) is the pre-spike copy.

### Verification evidence

- Date/time: October 3, 2026, 23:05 EDT. Mode: live (provider API, no audiovisual). Outcome: pass.
- Tested commit: `main` `9419820` plus uncommitted SPIKE-01 scripts.
- Commands: `node --env-file=.env.local scripts/preflight/spike-01-read.mjs` (exit 0); `node --env-file=.env.local scripts/preflight/spike-01-pals.mjs` (first run created both PALs then exit 1 on the LLM readback check; after the 304 finding the check accepts the documented default; second run exit 0).
- Observed: both PALs readback ok; test-mode conversation create returned `ended` with a token, then hard delete HTTP 204, for each PAL.
- Harness: `node --env-file=.env.local scripts/preflight/video-server.mjs` on `http://127.0.0.1:3010` (loopback). Page loaded in Chromium with variants A, B, S, T and zero page errors (`artifacts/local/spike-01/harness.png`). No call started by the coordinator.
- Limitations: no live call yet, so TTS audio, tags, append-context timing, respond latency, Raven behavior and stand-in behavior are **live not verified**.

### Owner A/B call (human-reported, October 3, ~22:50 EDT)

Mode: live, human. Harness `http://127.0.0.1:3010`, variants A, B, S, T. Reported by the owner, not itemized by the coordinator:

- **B felt more natural than A.** In A, Jordan did not soften. In B, Jordan seemed sensitive to the owner's feelings without naming specific emotions (T1 guard held).
- **Stand-in (S)** said the user's line, twice (once early, once after pushback, which matches "repeat the request"). Coaching and kindness were not separately reported.
- **Audio tag (T):** the sigh was performed, not read aloud, through Tavus with `eleven_v4_turbo`.
- **Voice match:** the direct ElevenLabs clip matches the call voice. W3 can keep the label "Hear {name}".
- **Mic** turned off after each End.
- Not reported: the timing log for `append_context` and `respond`. Those stay **live not verified**; 1A should keep the wrap-up at T–30 s and record actuals on the first hero call.

### Switch (October 3, 22:55 EDT)

`TAVUS_PAL_ID`/`TAVUS_FACE_ID` in `.env.local` now hold the quality values. The previous values are kept as `TAVUS_PAL_ID_PREVIOUS`/`TAVUS_FACE_ID_PREVIOUS` (rollback: copy them back), plus `.env.local.pre-switch` (ignored). `provider-setup.mjs` readback now requires Raven-1, emotion recognition full, and no queries or tools; run after the switch: exit 0, readback ok, test-mode create `ended` + hard delete ok. **Vercel production env is unchanged** (still the previous PAL) until the owner asks for a deploy. T1 notice added to the review card, saved-person start card and call notes; the browser strips inline analysis tags (unit test).

## Handoff

- Changed paths and commit(s): see the SPIKE-01 PR and the quality-PAL switch PR.
- Remaining failures/risks: `eleven_v4_turbo` may be accepted at create but fail or lag on a call; fallback is a new PAL with `eleven_v3_conversational`, then `eleven_flash_v2_5`. Raven `full` may make Jordan name emotions; the delivery line forbids it.
- External account action: owner A/B call on the harness (checklist in STATUS.md).
- Next smallest task: after the A/B, switch `TAVUS_PAL_ID`/`TAVUS_FACE_ID` to the quality values if B wins, update `provider-setup.mjs` readback to "raven-1 audio, no queries, no callbacks", and record the notes here.
- Coordinator integration: pending A/B

Follow [documentation rules](../20-DOCUMENTATION-STANDARD.md). Do not copy private prompts,
transcripts, credentials, provider ids beyond what is needed for rollback, or personal account identifiers into this record.
