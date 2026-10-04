# R04: Platform capabilities (Tavus, ElevenLabs, Daily, Next.js)

Status: research report (planning input, not a spec). Docs read October 3, 2026. Nothing here is live-verified unless stated. No provider configuration was changed while writing it.

Owner direction (October 3, 21:28): **optimize for quality; ignore pricing.** The build runs on free credits for a short life. Cost appears below only where a plan limit affects quality (for example, the maximum call length).

## 1. Where quality is being left on the table today

Current PAL (from `scripts/preflight/provider-setup.mjs`, created once; immutable):

| Layer | Current | Problem | Highest-quality option found |
|---|---|---|---|
| Face | First `completed` system face returned by the API | Arbitrary; not chosen for realism or expression | A deliberately chosen **Pro** stock face (Tavus' "hand-picked, top-performing set", e.g. Anna-Casual `rc9cff32ceba`, Luna `rb32069a3012`, Lucas-Studio `r3f4182ef554`) on Phoenix-4/4.5 [P1, P2] |
| Voice | First ElevenLabs voice with `category === "premade"` | Arbitrary; not matched to the face's apparent age, gender or warmth | A hand-picked premade voice per face, auditioned |
| TTS model | `eleven_flash_v2_5` (~75 ms) | Fastest but least expressive; no audio tags | `eleven_v4_turbo` ("most expressive, real-time", ~100 ms, audio tags) or `eleven_v3_conversational` (~280 ms) [E1]. **Unverified that Tavus accepts either** as `tts_model_name` |
| LLM | Not set (Tavus default) | Emotion delivery depends on instruction-following | Tavus recommends "a Tavus-hosted model with strong instruction-following capabilities such as `tavus-gemma-4`" for emotional expression [P2]; or a custom LLM (see §6) |
| Turn-taking | `sparrow-2`, patience `high`, interruptibility `high` | Good; `high` interruptibility may cut the counterpart off on small sounds | Keep sparrow-2 + high patience; test `medium` interruptibility (Tavus: "lower values are recommended for most experiences") [P3] |
| Silence | `idle_engagement: off` | Counterpart never breaks a long freeze | `patient`: "re-engages after longer silences. Suited to tutors, coaches, or contemplative use cases" [P3]. Pairs with the freeze rule in [R02 §2.12a] |
| Perception | `off` | Counterpart cannot hear tone (sarcasm, hesitation) | Raven-1 audio-only perception (see §3.5). **Needs decision** |
| Emotion | Phoenix-4 default-on (no parameter) | Unused: role context does not ask for emotional range | Add emotion guidance to the role context: "Phoenix-4 and Phoenix-4.5 faces can dynamically express emotions … while speaking and listening" [P2] |

Recommendation: a one-time **"quality PAL"** pass (coordinator-owned provider configuration): pick face(s) and voice(s) by audition, set the TTS model the Tavus API accepts that is most expressive, set the LLM explicitly, `idle_engagement: patient`, and record the before/after in a live A/B check. Because the PAL is immutable by project rule, this creates new PAL(s) instead of editing the current one.

## 2. Tavus CVI: what we can control

### 2.1 Per-conversation (no PAL change)

- `face_id` overrides the PAL's default face for one call [P4]. → **Appearance presets are possible without new PALs, for the face only.**
- `conversational_context`, `custom_greeting` (in use).
- `objectives_id` per conversation [P5]. Not suitable for the private goal (see §2.4).
- `policy: "eu"` switches `auto` disclosure/emotion fields [P6].
- `properties.max_call_duration`, `languages` (in use).

### 2.2 Per-PAL only

- **Voice.** `layers.tts.external_voice_id` (ElevenLabs) takes precedence over everything; the voice is fixed per PAL [P7, P8]. → Each premade voice preset needs **its own PAL**. A small catalog (for example 6 PALs = 6 voices) × any stock face per call covers appearance presets without cloning. The PAL Strategies page documents "reuse with conversational context vs. create-per-session" [P9]; we are in the reuse model.
- `voice_settings` for ElevenLabs: `speed` 0.7–1.2, `stability`, `similarity_boost`, `style`, `use_speaker_boost` [P7]. Pace presets (patient/conversational) could map to a slower/faster voice; a per-call change would need separate PALs.
- Conversational flow (§1), perception, LLM, guardrails, disclosure (`disclosure_type`, `verbal_disclosure`, `visual_disclosure`) [P6].
- Pronunciation dictionaries (for names in the user's situation) [P10].

### 2.3 Live interactions (browser → Tavus over Daily `sendAppMessage`) [P11]

| Interaction | Use in this product |
|---|---|
| `conversation.respond` | "Type instead" and the type-it-first ladder rung [R02 2.14, 2.22] |
| `conversation.interrupt` | "Ask them to wait" [R02 2.12] |
| `conversation.append_context` / `overwrite_context` | Wrap-up whisper at T-30 s; curveball injection; ask-to-wait instruction [R02 2.4, 2.10, 2.12] |
| `conversation.echo` | Not needed in full pipeline. In echo mode it supports `<emotion value="…"/>` tags (neutral, angry, excited, elated, content, sad, dejected, scared, contempt, disgusted, surprised) [P2] |
| `conversation.sensitivity` | Possible runtime tuning; not needed initially |

All interactions are client-side. The browser holds the conversation id already, and nothing private is sent unless we put it in `append_context`. **Rule:** a wrap-up or curveball text must come from the reviewed role, never from the user's private notes or goal.

### 2.4 Observable events (Tavus → browser) [P11, P12]

- `conversation.utterance` (in use for captions) and `conversation.utterance.streaming` (smoother captions; word-by-word).
- `conversation.started_speaking` / `stopped_speaking` with `role` `"pal"`/`"user"`, and on stop `duration` (seconds) and `interrupted` [P12]. → **Speaking indicators, talk balance, and "who interrupted whom" without audio analysis.** Accept legacy `"replica"`.
- Every event carries `timestamp`, `seq`, `turn_idx`, `inference_id` for ordering [P11].
- `conversation.joined` / `left`.

Objectives are wrong for the goal light. They are "goal-oriented instructions … guide conversations" and attach to the PAL's LLM [P5]. Using them would leak the private goal into counterpart behavior (AGENTS.md: private notes must not enter counterpart context). Use our own server-side evaluator over in-memory utterances.

### 2.5 Server callbacks [P13]

`application.transcription_ready` (full transcript) and `application.perception_analysis`. Not needed: the browser already has utterances, and the project stores no raw transcripts by default. Do not enable callbacks for transcripts.

### 2.6 Memory and knowledge

Tavus `memory_stores` (pinned and learned memory per PAL+participant) [P14] and a Knowledge Base exist. **Do not use**: "learned" memory would write facts about the user outside our approval flow (AGENTS.md: approved memories only; fresh sessions). Our approved About-me sharing already supplies context through `conversational_context`.

### 2.7 Other

- Magic Canvas (on-call UI cards), Skills (internet search, presentation, browser use), screen share [P15]. Not relevant to rehearsal; screen share would conflict with "counterpart cannot see you."
- 42+ languages; `languages` per conversation [P16]. Multilingual practice is feasible with the same voice ("the same provider voice speaks every language … carrying its own accent") [P7].

## 3. Quality levers in detail

### 3.1 Face realism and uncanny valley

Evidence (see [R05], [R03]): eeriness rises when audio leads video and with near-real but imperfect faces; stylized faces reduce it. Tavus "Pro" faces are the curated top performers [P1]. Free and Starter accounts saw 25 stock faces; Growth lists 100+ [P17], so the best faces may need a higher tier. Quality approach: shortlist Pro faces, run a 2-minute live audition of each (lip sync, idle motion, emotional range), pick 4–8 as appearance presets.

### 3.2 Voice quality

- Model choice is the biggest audible lever. ElevenLabs lists `eleven_v4` (most emotionally rich), `eleven_v4_turbo` (~100 ms, real-time, expressive), `eleven_v3_conversational` (~280 ms), `eleven_flash_v2_5` (~75 ms) [E1]. The latency difference v4_turbo vs flash is about 25 ms of model time. That is negligible next to network and avatar rendering.
- First spike: create a test PAL with `tts_model_name: "eleven_v4_turbo"`, run one call, confirm audio. Fallback order: `eleven_v3_conversational`, then `eleven_flash_v2_5`.
- Audio tags (`[sighs]`, `[laughs]`, `[hesitates]`) are a v3/v4 feature. Whether the Tavus LLM output passes tags through to ElevenLabs and how the face reacts is **unknown**; test with one tag in the system prompt.
- Voice Design (`eleven_ttv_v3`) can generate a new synthetic voice from a text description [E1]. It is not cloning, but docs/00 limits appearance to "premade voice". **Needs decision.**

### 3.3 Turn-taking feel

Sparrow-2 is the documented default from September 8, 2026, and is already pinned in our PAL [P3]. Keep high patience. Live-test `pal_interruptibility: medium` against `high` with backchannels ("mm-hm") to see whether the counterpart stops mid-sentence too easily.

### 3.4 Emotional range

Phoenix-4 expression is automatic and is shaped by the system prompt [P2]. The current system prompt asks for "one to three sentences" but no emotional cues. Add per-role direction generated at setup, for example "If the user blames you, show mild hurt; if they name a specific plan, relax." This also counters the "too agreeable" complaint [R06].

### 3.5 Hearing tone (Raven-1 audio perception)

Raven-1 audio perception sends the LLM short tone notes ("The user sounded sarcastic") and supports `audio_awareness_queries` [P18]. Visual perception needs the user's camera stream; our camera is local-only and must stay so (AGENTS.md). **Audio-only perception** would make the counterpart react to hesitation or sharpness, which is a large realism gain. But it is emotion inference from voice. Options: `emotion_recognition: "limited"` (no biometric emotion; spoken content only) or `full` with an explicit in-product notice [P6]. **Owner answer (October 3, ~21:50):** `full`, with a clear notice on the character card. Spec T1 in [docs/32](../32-FEATURE-SPECS.md). Not built; docs/08 must be amended first.

### 3.6 Call length

Earlier research recorded a 5-minute maximum on Free/Starter, 15 on Builder, and no duration limit on Growth [P17]. Values for the lower tiers did not render in the text fetch on October 3; verify in the dashboard. If 10-minute practices are wanted, the plan limit, not cost, is the constraint.

## 4. Daily (already installed: `@daily-co/daily-js` 0.87.0)

- `startLocalAudioLevelObserver(interval)` and `startRemoteParticipantsAudioLevelObserver(interval)`, minimum 100 ms, levels 0–1 [D1]. → A live mic meter in the green room and a speaking glow ring on both tiles. Tavus speaking events (§2.4) are an alternative for the counterpart.
- Device selection (`setInputDevicesAsync`, `enumerateDevices`) for a green-room mic picker. Verify method names against installed types before use.
- Captions already come from Tavus utterances; Daily's own transcription is not needed.

## 5. Next.js 16 / React 19 (installed)

- React `<ViewTransition>` works in the installed Next.js without configuration (see `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`). → Shared-element morph from the character card in the green room to the call tile, and from the call to the recap. No new dependency.
- Web Audio API for the local mic meter before joining Daily (no dependency).
- Optional additions (each a dependency decision): Motion (spring physics), Rive (character idle animation for the "type it" and "say it" rungs).

## 6. Bigger quality bets (larger effort, flagged)

| Bet | What it buys | Cost in effort | Status |
|---|---|---|---|
| Custom LLM on the PAL (OpenAI-compatible endpoint we host) | Full control of counterpart prompting, curveballs, emotion tags, stricter character consistency | L; adds a live server path on the turn-critical route | Tavus documents custom LLM support [P19]. AGENTS.md "no custom speech pipelines": this is an LLM, not speech, but it is runtime orchestration. **Needs decision** |
| Multiple PALs (voice catalog) | Appearance presets with matched voices | M; coordinator creates PALs; mapping table | Decided direction in docs/00, not built |
| Echo mode with our own LLM + emotion tags | Exact control of what and how the face says it | L; we own turn-taking text flow | Not recommended; loses Sparrow and Tavus LLM integration |

## 7. Unknowns to spike first (cheap, high information)

1. Does Tavus accept `tts_model_name: "eleven_v4_turbo"` (and `eleven_v3_conversational`) with `external_voice_id`? One test PAL + one call.
2. Do ElevenLabs audio tags in LLM output get spoken as effects or read aloud?
3. Which Pro faces are available on the current account (`GET /v2/faces?face_type=system`)?
4. Does `conversation.append_context` take effect mid-turn, or only on the next turn (affects wrap-up timing)?
5. Latency of `conversation.respond` (typed input) to face speech.
6. Is `idle_engagement: patient` too eager at 3-minute call lengths?

## Sources

- [P1] Tavus, Stock Faces. https://docs.tavus.io/sections/faces/stock-faces.md
- [P2] Tavus, Emotion Control with Phoenix-4 and Phoenix-4.5. https://docs.tavus.io/sections/conversational-video-interface/quickstart/emotional-expression.md
- [P3] Tavus, Conversational Flow. https://docs.tavus.io/sections/conversational-video-interface/pal/conversational-flow.md
- [P4] Tavus OpenAPI (Create Conversation `face_id`). https://docs.tavus.io/openapi.yaml
- [P5] Tavus, Objectives. https://docs.tavus.io/sections/conversational-video-interface/pal/objectives.md
- [P6] Tavus, EU AI Act Compliance. https://docs.tavus.io/sections/onboarding-guide/eu-ai-act.md
- [P7] Tavus, Text-to-Speech. https://docs.tavus.io/sections/conversational-video-interface/pal/tts.md
- [P8] Tavus, Voices. https://docs.tavus.io/sections/conversational-video-interface/voices.md
- [P9] Tavus, PAL Strategies. https://docs.tavus.io/sections/onboarding-guide/pal-strategies
- [P10] Tavus, Pronunciation Dictionaries. https://docs.tavus.io/sections/conversational-video-interface/pal/pronunciation-dictionaries.md
- [P11] Tavus, Interaction Events. https://docs.tavus.io/sections/conversational-video-interface/interactions-protocols/overview.md
- [P12] Tavus, Started/Stopped Speaking Event. https://docs.tavus.io/sections/event-schemas/conversation-started-stopped-speaking.md
- [P13] Tavus, Webhooks and Callbacks. https://docs.tavus.io/sections/webhooks-and-callbacks.md
- [P14] Tavus, Memories. https://docs.tavus.io/sections/conversational-video-interface/memories.md
- [P15] Tavus, Skills overview. https://docs.tavus.io/sections/conversational-video-interface/skills/overview.md
- [P16] Tavus, Language Support. https://docs.tavus.io/sections/conversational-video-interface/language-support.md
- [P17] Tavus, Pricing. https://www.tavus.io/pricing
- [P18] Tavus, Perception. https://docs.tavus.io/sections/conversational-video-interface/pal/perception.md
- [P19] Tavus, Large Language Model (LLM). https://docs.tavus.io/sections/conversational-video-interface/pal/llm.md
- [E1] ElevenLabs, Models. https://elevenlabs.io/docs/overview/models
- [D1] Daily, startRemoteParticipantsAudioLevelObserver(). https://docs.daily.co/reference/daily-js/instance-methods/start-remote-participants-audio-level-observer
