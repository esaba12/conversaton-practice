# ElevenLabs integration

Sources: S08-S13 and S16 in [sources](14-SOURCES.md). Verify current installed SDK types and dashboard options before implementation.

## One base agent
Create one roleplay agent for the prototype. Store its ID server-side. G1 uses a validated transient fictional preset; G3 saves personas in our database. Both become per-session configuration, rather than one remote agent per persona. The coordinator owns changes to this shared remote agent when coding workers run in parallel.

Use confirmed runtime variables for scenario facts and style. Enable only required prompt/voice/first-message overrides. Construct prompts server-side from validated fields; never hand the browser unrestricted authority to replace core instructions.

## Live video connection
The confirmed product is a FaceTime-style call with a talking AI counterpart. Follow [the live video contract](22-LIVE-VIDEO.md). Evaluate the managed ElevenLabs/LiveAvatar connector first; no provider integration is tested yet.

For this candidate, use LiveAvatar's official browser SDK and a server-created session token. Do not also start an independent `@elevenlabs/react` session. The managed connector owns the conversation audio path and synchronized video. Server construction must carry only validated counterpart context; private notes stay out. Verify inline per-session dynamic variables with a real request before freezing this path. A global shared-agent prompt edit is not safe per-user configuration.

Use one media adapter boundary for connection, remote readiness, speech/video activity, optional local camera, mute, End, and transcript events. A connected room alone is not proof of usable video/audio. Browser code receives bounded session credentials, never provider API keys. The candidate requires a paid ElevenLabs plan and separate LiveAvatar access; registration of the restricted ElevenLabs key with LiveAvatar is an explicit provider setup action.

Mock mode implements the same application interface and is visibly labeled. Standalone voice can support diagnosed fallback, but cannot pass the video gate.

## Voice and timing
Test V3 Conversational expressive delivery on the actual account. Use a curated voice allowlist.
Voice style represents the fictional character, not the user's supposed emotional state.
Choose patient versus conversational turn-taking settings using supported configuration. Measure whether patient mode really waits longer; do not display a setting that only changes a label.
Agent responses should usually be one to three sentences.
Permit interruption where supported.
No automatic scoring of voice tremor, nervousness, pauses, accent, or fluency.

## Session lifecycle
These are user experience stages. Persist only the session statuses defined in [architecture](03-ARCHITECTURE.md); reflection/closed are UI phases, not alternate database states.

Preflight: validate credits/configuration, authenticate, request mic permission, offer optional local-only camera preview, load scenario.
Connecting: show progress and a usable cancel control.
Active: render responsive synchronized counterpart video/audio; append transcript events in memory.
Ending: cancel pending playback, disconnect provider, stop local media tracks, mark session terminal. Stop and reconcile both avatar and agent resources; stopping does not establish data deletion.
Reflection: use captured text; label incomplete evidence if disconnect occurred.
Closed: clear transient transcript and private setup notes after reflection or cancellation.

End during connection, sign-out, detected authentication expiry, and provider/network failure all release microphone/camera tracks and cancel future audio/video playback, including a late-resolving start. Local cleanup must complete even when the server End request fails. Record/reconcile server cleanup separately; no late provider event can reactivate a terminal session. Schedule real microphone verification through the coordinator so workers do not compete for the device.

Mute only disables user audio. It does not freeze the agent or stop billing.
MVP has End practice, not a misleading Pause control. True pause/resume is deferred.

## Transcript handling
Prefer client transcript events for immediate reflection in the prototype.
Do not make the UI wait indefinitely for a post-call webhook.
A later webhook integration can reconcile provider events but must obey ownership, idempotency, and deletion.
Never store transcripts in analytics, console logs, error monitoring, or browser localStorage by default.

## What the character receives
- Fictional identity and role.
- Public scenario context and counterpart-known facts.
- Behavioral constraints and selected challenge.
- Conversation operating settings.
It does not receive private user fears, diagnoses, private preparation notes, or the entire profile/history.

## Account setup checklist
- Verify available voices and TTS model.
- Select a supported LLM and test response speed.
- Enable exactly the required personalization options.
- Review transcript and audio retention.
- Configure session maximum duration and spending/concurrency limits.
- Test visible synchronized video, microphone, interruption, quiet replies, camera privacy, and complete End on a real browser.
- Record actual configuration identifiers outside public documentation.

## Cost and failure modes
Budget ~200 development/demo minutes; verify current plan/credits. Standard additional-minute pricing was advertised at $0.08/minute plus applicable LLM costs at research time; the exact bill depends on plan and concurrency.
Keep sessions serial during judging if concurrency is limited.
A browser mock is not proof of audiovisual quality. Verify avatar-provider usage charges separately.
If expressive delivery is unreliable, prefer a stable supported voice model over a dramatic but broken demo.
