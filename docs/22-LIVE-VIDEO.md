# Required live video and foundation feasibility

A FaceTime-style conversation with a visible talking fictional AI counterpart is core scope. Real responsive speech and synchronized video are mandatory in G1. Audio-only, static portraits, prerecorded replies and mocks do not pass. Optional user camera starts off and remains local-only.

## Selected integration
Tavus CVI orchestrates conversation, ElevenLabs supplies explicitly selected speech, and Daily transports browser media. This supersedes the older ElevenLabs Agents/LiveAvatar candidate. No second agent, LiveAvatar account or custom audio bridge is needed. Details: [speech integration](06-ELEVENLABS.md).

Installed Daily version: 0.87.0. Server APIs use PAL/face naming. Coordinator-created PAL readback and test-mode conversation creation/deletion succeeded; human audiovisual verification is pending. Test mode ends without a live counterpart and cannot prove speech works.

## Isolated foundation preflight
Run `node_modules/.bin/node --env-file=.env.local scripts/preflight/video-server.mjs` from the project root, then open http://127.0.0.1:3010. Configuration must already exist; `scripts/preflight/provider-setup.mjs` creates the immutable PAL only if absent. Do not repeat creation after an ambiguous timeout without checking provider state.

This local harness binds loopback, validates Host/Origin and a same-site cookie, keeps keys server-side, and starts real calls only on an explicit click. It is a feasibility instrument, **not** the authenticated application or G1 acceptance. One three-minute call at a time; End and Tavus record deletion are reported separately. The harness's process-local ownership must never become the application persistence design.

Human checks:
1. Start friendly roommate; allow microphone; complete five short exchanges about kitchen chores.
2. Verify moving video, audible responsive speech and synchronization. Interrupt a reply and observe both speech and speaking animation.
3. End while speaking and during startup in separate probes. Verify microphone release and no future playback.
4. Optionally enable local camera then disable/End. Verify local release and no publication. Denied camera must not block practice.
5. Start reserved roommate in a fresh call; confirm changed behavior without earlier simulated history.
6. Record remote End and Tavus hard deletion separately; do not infer ElevenLabs erasure.

Freeze media contracts only after source/types and live feasibility agree. Independent auth/database foundation and isolated presentation work can proceed meanwhile. The external frontend agent owns no media acquisition or backend work.

## Application boundary
Verified nonanonymous Supabase user acquires durable owner-scoped lease before provider creation. Trusted provider response establishes conversation association. Browser-provided IDs never grant cleanup authority. No blind create retry after timeout; unresolved state relies on bounded provider duration while reconciling.

Return only private Daily URL/separate meeting token with no-store response. Join token expires after participant absence timeout; app session has separate expiry. Readiness requires usable counterpart audio/video. Video first (built October 3, 0D; live not verified): the counterpart element stays muted until its video is playing, and only then does the call go live. If no video plays within 45 s of joining, the call ends as video lost and audio never unmutes. If the browser blocks unmuting, the picture keeps playing muted and sound resumes on the next tap or key press. Auth/session receives connected acknowledgement; media sends it.

End/sign-out/expiry/navigation/failure stop local playback/capture independent of network success. Late starts cannot reactivate terminal sessions and must clean up remote resources. Ending does not imply deletion. Recording disabled does not imply transcript-free processing.

Full G1 acceptance repeats five turns through the signed-in application with two-owner isolation, concurrency, auth loss, video loss, denied camera and failed End. Follow [evaluation](09-EVALUATION.md), T14/T15 and [integration](tasks/G1-04-integration.md).

Sources: [OpenAPI](https://docs.tavus.io/openapi.yaml), [stock faces](https://docs.tavus.io/api-reference/faces/list-faces), [PAL strategies](https://docs.tavus.io/sections/onboarding-guide/pal-strategies), [private rooms](https://docs.tavus.io/sections/conversational-video-interface/conversation/customizations/private-rooms), [End](https://docs.tavus.io/api-reference/conversations/end-conversation), [deletion](https://docs.tavus.io/api-reference/conversations/delete-conversation), [Daily](https://docs.daily.co/reference/daily-js/types/daily-call-options).
