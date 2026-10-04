# Design and backend direction

Updated October 3, 2026. The user cannot obtain AWS credits in time and approved Supabase. This supersedes the AWS/Cognito/Aurora/Amplify proposal; the filename remains unchanged to preserve existing links. The user supplied fresh Supabase project `rcktybngebovyopregnt`; local configuration is saved and Auth health returned HTTP 200. Foundation implementation is active; current checks and remaining live gaps are in STATUS.md.

## Confirmed decisions

- Warm and minimal, with crisp modern styling.
- FaceTime-style practice with a visible talking AI counterpart is the core experience. Live synchronized audio/video is mandatory; Tavus CVI with explicit ElevenLabs TTS is selected; live feasibility remains pending. See [the live video contract](22-LIVE-VIDEO.md).
- Sign-in is the basis of the entire product. Users authenticate before designing personas/conversations, generating setups, or practicing. No guest workspace or anonymous Auth users.
- Use Supabase Auth and PostgreSQL. The user supplied a fresh project; verify migration/admin access before applying migrations. No existing project is being reused or deleted.
- Live ElevenLabs roleplay and server-only OpenAI setup/reflection remain the selected providers.
- Vercel is the recommended application host because the static preview already runs there. That preview is not the authenticated video-call application and does not prove its deployment.

## Design proposal

The signed-in home should open with “What conversation would you like to practice?” and a prominent situation input. Place three short preset links underneath. Keep saved personas and preferences in quiet secondary navigation. The account control remains visible.

**As built:** signed-in `/` is a home whose primary card is Practice a conversation, with About me and Your data beside it. The situation field and the three examples (professor, roommate, saying no) are on `/practice`, not on that home. Sign-in offers Continue with Google plus email and password. Captions on the call are optional and collapsed. A stock-face catalog is still unbuilt.

| Element | Proposed treatment |
| --- | --- |
| Page | Warm ivory `#F7F5F0` |
| Surface | Near-white `#FFFEFB` |
| Primary text | Ink `#232A28` |
| Secondary text | Warm gray `#626963` |
| Primary action | Deep sage `#345A49` with near-white text |
| Borders | Soft neutral `#DDDCD5`; stronger focus outline |
| Typography | Clear sans-serif; medium-weight headings and readable body text |
| Shapes | 12-16px corners, thin borders, restrained shadows |
| Spacing | Consistent 8px rhythm, generous space between decisions |

These are proposed tokens, not a rendered or accessibility-tested interface. Verify contrast, focus, keyboard use, and mobile layout during implementation. Use a slightly compact heading scale and plain labels to keep the design crisp. Avoid pervasive pill shapes and ornamental gradients.

Flow: sign in → describe situation → review/edit fictional counterpart → live video practice → optional reflection/memory approval → finish. Persona review puts “What the character knows” and “Private preparation” in separate clearly labeled sections. The practice screen centers a large, live talking counterpart with a clear fictional AI roleplay label. Put an optional small self-view in a corner, with separate mic mute, camera on/off, and persistent End controls. Keep the goal and listening/speaking status legible but secondary; captions remain optional and collapsed.

Camera off until opt-in and local-only self-view are implementation defaults, not separately confirmed user choices. Do not send, analyze, or record user camera frames. Explain that the counterpart responds to speech and cannot see the user. A denied local camera must not block practice. End, sign-out, or auth expiry disconnects all audio/video and provider sessions and releases microphone/camera tracks. Frozen or missing counterpart video is an explicit interrupted state; an audio-only/static-portrait fallback must be labeled and cannot pass G1.

## Recommended backend path

| Layer | Recommendation | Implementation boundary |
| --- | --- | --- |
| Identity | Supabase Auth with `@supabase/ssr` | Verified non-anonymous identity and cookie refresh; sign-in method/callback URLs are foundation decisions |
| Database | Supabase PostgreSQL | Owner RLS, explicit grants, and transactional session/memory functions |
| Hosting | Vercel for the Next.js application | Pin supported Next.js/Node versions and verify the real application build/deployment |
| Secrets | Ignored local environment plus host-managed server environment | Keep OpenAI/ElevenLabs/video-provider keys and migration credentials out of client bundles |
| Live video and speech | Tavus CVI + ElevenLabs TTS + Daily | Browser uses private room credentials issued by the owner-authorized server |
| Counterpart video | Provider selection pending feasibility research | Live synchronized talking counterpart; authenticated session setup, truthful readiness/failure, and verified complete teardown |
| Setup/reflection | OpenAI structured-output adapter | Server-only model requests with configured model IDs |

Use separate browser/server clients and request-scoped cookies as described in the [Supabase SSR guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client). Verify the identity with `getClaims()` rather than trusting the cookie or `getSession()` user object; use `getUser()` when current Auth-record information is needed. Match cookie refresh to the pinned Next.js version. Authenticated responses must not enter a shared public cache.

No AWS CLI login, Cognito pool, Aurora cluster, IAM role, or AWS administration MCP is required for this build. Existing optional AWS documentation tooling can stay installed; it is not a setup gate.

## Database boundary

Retain profiles, personas, scenarios, sessions, reflections, memory_proposals, and deletion_jobs from the data specification. Use `auth.users.id` directly as the owner UUID; omit the AWS-specific identity mapping. App queries use the user's JWT, RLS, and scoped privileges. Do not use a service-role/secret key for ordinary runtime requests. Supabase's publishable project key is not a provider secret, but it never replaces authorization. [User-data model](https://supabase.com/docs/guides/auth/managing-user-data), [RLS and grants](https://supabase.com/docs/guides/database/postgres/row-level-security).

The browser's normal data path is through authenticated application routes. Direct Supabase access must still reject missing/anonymous identities, other owners, invalid transitions, and privileged-field changes. Check owner IDs for referenced rows as well as the row being edited. A signed-in page alone does not establish isolation.

Acquire/release session leases and approve/remove memories through reviewed atomic PostgreSQL RPCs with database-enforced ownership, allowed fields, and version checks. Prefer invoker rights; define and test restricted privileges for any necessary definer operation before implementation. Raw transcripts and private preparation notes are not saved by default. Cleanup keeps only the metadata needed for truthful provider deletion status; it needs a bounded worker authorization path independent of an expired user session. [Database functions](https://supabase.com/docs/guides/database/functions).

## Hosting and account readiness

The existing [public preview](https://conversation-practice-site.vercel.app) remains useful as a product page. Application deployment requires its own verified build, environment variables, and Supabase Auth redirect configuration; do not assume the preview's settings cover it. Next.js handles bounded authenticated JSON requests and does not proxy continuous media. Verify the provider-supported ElevenLabs/video transport and interruption behavior before freezing the media contract; provider selection must not introduce a custom speech pipeline. Local self-view camera tracks never join a provider transport.

The user supplied a fresh Supabase project. Its local URL/publishable configuration and Auth health response are verified. Migration/admin access, real sign-in, plan price, and quota remain unverified. Local scaffolding and clearly labeled mocks can proceed while access is pending; real G1 acceptance cannot.

## Next implementation step

Verify available Supabase project access, ElevenLabs access, and the selected video provider's real integration path, then implement one authenticated G1 video-call slice. G1 includes managed Auth identity plus minimal durable owner-scoped session/cleanup records for concurrency, expiry, and cleanup across every media provider. Five live synchronized video/audio exchanges, interruption, and complete teardown are mandatory; voice-only or static-portrait fallback cannot pass. G2 adds actual generated setup. G3 adds saved domain tables and transactional memory. Follow [the parallel task workflow](19-AGENT-WORKFLOW.md): shared foundation first, isolated auth/session, media, and UI tasks next, then combined verification. No authenticated browser/audio/video/database integration has been created or tested in this decision update.
