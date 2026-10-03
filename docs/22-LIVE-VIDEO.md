# FaceTime-style conversation rehearsal

Confirmed October 3, 2026: a visible, talking AI counterpart is the central product experience. Video is required in the first vertical slice. This replaces the voice-only scope and blanket avatar exclusion. Required sign-in, generated editable setups, fresh sessions, approved memory, and Supabase remain unchanged.

## Experience and implementation defaults

- The fictional counterpart fills the main call area and responds live with synchronized speech and facial motion. Identify it as AI practice; do not imply a real person is present.
- Use one provider-supplied stock avatar and one voice for the first slice. More appearances are optional; custom likeness creation and voice cloning remain outside scope.
- Offer an optional small local self-view, camera off until opted in. This is an implementation default, not a separately confirmed user requirement. Camera footage stays local: no publication to the provider room, upload, recording, or visual analysis. The character does not claim to see the user.
- Mic mute, camera on/off, and End are separate controls. Camera off stops its tracks; mute does not pause the conversation or billing. End releases all local media and initiates remote cleanup immediately.
- A video failure is explicit. Audio-only recovery, a static portrait, mock animation, or a prerecorded demo must be labeled and cannot pass the live video gate.

## Recommended feasibility path

Latest setup decision: the user confirms Tavus and ElevenLabs credits and requests setup for this combination. Use Tavus CVI + explicit ElevenLabs TTS for the first integration attempt. Follow docs/21-START-BUILD.md. The LiveAvatar section below remains alternative research; its API/SDK/agent requirements must not be applied to the current Tavus route. Keys, provider resources, and live behavior remain unverified.

Latest account information: the user supplied a screenshot of a Tavus YC Student Starter offer listing Builder-equivalent access for six months, 1,000 CVI minutes, and three custom face slots. They want to use ElevenLabs wherever practical. The offer is user-provided evidence, not proof of redemption or an available account balance.

New recommendation to evaluate first: Tavus full CVI for the live video/conversation pipeline with ElevenLabs explicitly selected as TTS. Tavus documents `layers.tts.tts_engine = elevenlabs`, external voice selection, model selection, and a provider key for private voices. This preserves ElevenLabs speech, but it does **not** run ElevenLabs Agents. It is an architectural alternative to the connector below, not a verified drop-in replacement or a confirmed provider migration. [Tavus TTS configuration](https://docs.tavus.io/sections/conversational-video-interface/pal/tts).

Tavus full mode manages the conversation pipeline; Echo and other integrations require different orchestration. Avoid building a custom ElevenLabs Agents-to-Echo bridge for the solo prototype. [Pipeline modes](https://docs.tavus.io/sections/conversational-video-interface/quickstart/pipeline-modes). Reusable Tavus PAL configuration can accept per-call context, while voice and other behavior fields belong to the PAL. Verify isolated persona behavior without editing a shared active PAL; per-session PAL creation is another documented option. [PAL strategies](https://docs.tavus.io/sections/onboarding-guide/pal-strategies).

Before choosing this alternative, verify redeemed credits/API access, real ElevenLabs TTS output, private-room authorization, persona/context separation, optional local-only camera, disabled recording/provider memory, interruption, End, and deletion. Use `TAVUS_API_KEY` as our server-only application configuration name. Do not assume Tavus credits cover separately billed provider usage or that TTS alone establishes sponsor eligibility. Keep stock faces as the first slice; custom face slots do not expand MVP scope. If adopted, replace the ElevenLabs Agents-specific contracts and setup requirements throughout, including GitHub tasks; do not mix both pipelines.

### Earlier candidate: ElevenLabs Agents + LiveAvatar

ElevenLabs Agents with HeyGen LiveAvatar's managed connector remains the alternative if retaining the full ElevenLabs Agents platform is the priority. It is not a user-selected vendor or a verified integration. No new account, payment, key registration, SDK installation, or live test has occurred. The connector-specific instructions below apply only to this route; the new Tavus recommendation above needs its own integration contracts if selected.

The connector requires a paid ElevenLabs account and a separate LiveAvatar API account. A restricted ElevenLabs key is registered with LiveAvatar and referenced by its secret ID; document this credential transfer before account configuration. The connector wraps the agent in a managed LiveKit room. It exposes speaking/transcript/interruption events and conversation metadata. Its inline LITE configuration documents per-session dynamic variables, while the stored voice-agent path rejects those overrides. Verify the inline path before relying on it for editable personas. [Official connector guide](https://docs.liveavatar.com/docs/lite-mode/connectors/elevenlabs-agent).

ElevenLabs handles conversation/audio; LiveAvatar renders streaming avatar video. Configure the supported audio formats and verify both accounts' current usage limits. Charges are separate. [ElevenLabs integration guide](https://elevenlabs.io/docs/eleven-agents/guides/integrations/live-avatar).

Use the official browser SDK after verifying and pinning its installed version. Source inspection of the current upstream session implementation found potential gaps around stopping during connection, asynchronous cleanup, and microphone-start failures. Those findings are risks to test against the installed version, not results from our application. Do not assume `stop()` alone guarantees release. [Official SDK source](https://github.com/heygen-com/liveavatar-web-sdk/blob/master/packages/js-sdk/src/LiveAvatarSession/LiveAvatarSession.ts).

## Foundation feasibility checks

Before freezing media contracts, run a bounded coordinator-owned provider spike with real accounts and fictional data. Use an isolated local harness with server-held credentials; it is not a public workspace or an authenticated application integration. Do not require G1-01's production Auth/database implementation before those workers can start. The spike supplies provider evidence and proposed contracts only; full authorization and lifecycle acceptance remain G1-04.

1. Mint an expiring provider session credential in the local harness and verify which server-returned IDs can bind avatar and conversation resources. Design the authenticated owner/lease contract for G1-01; do not claim the harness proves ownership isolation. Never authorize cleanup from an arbitrary browser-supplied ID.
2. Pass two distinct, allowlisted fictional persona/context configurations into separate fresh sessions. Verify the actual behavior changes and no private notes enter counterpart context. Do not mutate one shared remote agent prompt between concurrent users. Treat missing persona override support as a blocker, not permission to cut generation.
3. Render a real talking counterpart and exercise responses and interruption. Measure startup time, response wait, and visible synchronization. Silence/static video must not be reported as media readiness. G1-04 repeats the full five-exchange test through the authenticated application.
4. Probe SDK cancellation during startup and speaking, failed stop requests, and late callbacks; verify local track release and remote termination independently. Define the controller hooks for app auth loss and local camera ownership. G1-04 must test actual auth loss, camera denial, video loss, failed End, and all combined lifecycle paths after worker integration.
5. Freeze SDK/version, credential/expiry shape, trustworthy provider-ID correlation, media readiness events, interruption semantics, and cleanup behavior only after checking official docs, installed types, and actual results.

The general token reference and connector guide do not currently describe the inline configuration equally. Treat successful real requests and pinned types as necessary evidence. If the candidate cannot meet the requirements, record why and evaluate another compatible video provider; never silently downgrade the product.

## Application boundary

The backend owns authorization, role-context construction, provider secrets, session creation/stop, and durable cleanup metadata. It does not relay continuous audio/video through Next.js routes. The browser receives only bounded session credentials. Do not run an independent ElevenLabs browser conversation alongside a connector-managed call; that risks duplicate microphones, responses, and billing.

Coordinator owns `lib/schemas/media.ts`; auth/session owns `lib/media/server-credentials.ts`; media worker owns adapters, optional local camera capture, and the session controller. UI consumes stream handles and emits user actions; it never creates a second camera/microphone capture. See the G1 task briefs for final ownership.

Keep the current persisted lifecycle states. A call becomes active only when the required remote video and audio path are usable. Local preview is not remote readiness. End, sign-out, expiry, route exit, and connection failure cancel pending work, stop playback, detach media, release all acquired tracks, and reject late results. A cancelled asynchronous start must also clean up any session it eventually creates.

The server stops the avatar session using verified association and bounded retries; it separately verifies agent termination. A documented avatar stop API exists. Stopping a call does not establish deletion of retained provider data. Track each provider's cleanup/deletion independently and show pending or unsupported results truthfully. [LiveAvatar stop API](https://docs.liveavatar.com/api-reference/sessions/stop-session).

## Account actions and acceptance

User account actions: obtain LiveAvatar API access and a paid ElevenLabs plan compatible with the connector. Put secrets in ignored local configuration using `LIVEAVATAR_API_KEY` and `ELEVENLABS_API_KEY` as our application variable names. The coordinator can configure the agent/avatar once access is available; do not invent IDs or register keys during documentation research.

G1 requires real sign-in, owner isolation, a responsive synchronized video counterpart, five live exchanges, and complete media teardown. Follow T14/T15 and the live matrix in [evaluation](09-EVALUATION.md). A healthy Supabase endpoint or working audio call alone does not pass G1. No application/live evidence exists yet.
