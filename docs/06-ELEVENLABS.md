# Tavus conversation and ElevenLabs speech

Current route: **Tavus CVI full mode + explicit ElevenLabs TTS**, with Daily's browser call object. Older ElevenLabs Agents/LiveAvatar contracts are superseded. See [live video](22-LIVE-VIDEO.md).

## Configuration and context
The coordinator owns one immutable Tavus PAL, a verified stock face and a premade ElevenLabs voice. Setup selects real provider IDs and saves them only in ignored local configuration. The ElevenLabs key is sent server-to-server to Tavus for the selected integration. TTS is explicitly `elevenlabs`, `eleven_flash_v2_5`, and `external_voice_id`; the existing Tavus LLM default is left unchanged.

Perception is off. Patient turn-taking, high interruptibility and no idle engagement are configured, but behavior still needs live verification. No provider database tools, documents or memory identities are configured.

Each private call receives only an allowlisted fictional role/context/opening, with `participant_tags: []`. No shared PAL prompt mutation. Different voice/flow settings require another immutable configuration. The counterpart never receives private preparation, fears, profiles or prior simulated history.

**Four starters (built October 4).** The owner reported a saved-person call on Alex’s look, the same morning, as part of "it all worked." Not itemized. Jordan, Alex, Ellis, and Sam each have a stock face and a premade voice. Each voice has its own PAL, using the quality-layer settings from the October 3 A/B. Ids stay in server environment variables (`TAVUS_STARTER_<PRESET>_PAL_ID`, `TAVUS_STARTER_<PRESET>_FACE_ID`, `ELEVENLABS_STARTER_<PRESET>_VOICE_ID`). A preset start, a reviewed role that sends `look`, and a saved person who picked that starter use that PAL and face. A saved person left on Default, and a reviewed role with no `look`, use `TAVUS_PAL_ID` and `TAVUS_FACE_ID`. The browser sends the starter name or omits it, never these ids. The stand-in PAL and face are separate and must not match a starter or the default face. Provider ids are not a new catalog beyond these four. Choosing a look while setting up a new practice has not had its own live call. See [docs/00](00-DECISIONS-AND-VIABILITY.md).

## Browser and lifecycle
Pinned transport: Daily 0.87.0. `createCallObject({videoSource:false,audioSource:true})` owns the call microphone and suppresses outgoing camera. Optional preview separately acquires video-only tracks and never supplies them to Daily. UI consumes media and emits controls; it does not acquire tracks.

Join is not readiness. Require usable remote audio/video, then human evidence of response and synchronization. Mute only disables microphone audio. End, cancelled start, auth loss, route exit and failure detach playback, stop owned tracks, reject late events and destroy the call independently of HTTP success.

Server-created Tavus conversation IDs are authoritative. Bind them through owner-scoped database RPCs; browser IDs never authorize cleanup. End uses POST with an empty body, then non-verbose GET to verify status. DELETE with `hard=true` is separate. Never JSON-parse empty success bodies or automatically retry ambiguous creation.

## Retention
Recording-off and captions-off **do not disable provider transcripts**. Reviewed schemas expose end-of-call transcripts without a verified retention-disable switch. App storage excludes raw transcripts/media. ElevenLabs retention remains separate; Tavus hard deletion does not establish cascading deletion. Report pending/unsupported provider deletion truthfully.

## Evidence and references
October 3: PAL creation/readback confirmed explicit ElevenLabs TTS and perception off. A private test-mode conversation was accepted and hard-deleted. Test mode does not exercise live TTS/video. See [foundation evidence](tasks/G1-00-foundation.md).

Official sources: [TTS](https://docs.tavus.io/sections/conversational-video-interface/pal/tts), [PAL creation](https://docs.tavus.io/api-reference/pals/create-pal), [conversation creation](https://docs.tavus.io/api-reference/conversations/create-conversation), [private rooms](https://docs.tavus.io/sections/conversational-video-interface/conversation/customizations/private-rooms), [Daily options](https://docs.daily.co/reference/daily-js/types/daily-call-options), [Daily destroy](https://docs.daily.co/reference/daily-js/instance-methods/destroy), [ElevenLabs retention](https://elevenlabs.io/docs/eleven-api/resources/zero-retention-mode).
