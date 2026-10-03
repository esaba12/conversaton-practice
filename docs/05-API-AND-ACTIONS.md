# API and action contracts

These are application contracts, not copied provider APIs. Validate all input and output with shared Zod schemas. Require authenticated owner context on all user-data endpoints. Server-derived identity is authoritative.

Authentication applies to draft generation and session credentials as well as storage, independently of page redirects. Public product/sign-in pages do not create practice data. Reject missing/expired identity before provider calls. The client responds to sign-out or detected expiry by tearing down all audio/video and releasing capture tracks and clearing transient private state. Shared schemas are frozen in G1 foundation before workers implement consumers; auth-library callback routes are chosen there against current installed types.

## Routes
G3 routes for About-me facts, saved people, per-person shared facts, private prep and starting with a saved person are specified in [docs/26](26-PEOPLE-AND-SHARING.md); the exact frozen HTTP contract is the comment block at the end of `lib/schemas/people.ts` (plus the saved-person branch in `lib/schemas/session.ts`). The table below is the earlier, broader plan.


| Route | Request essentials | Response / behavior |
|---|---|---|
| POST /api/scenarios/draft | situation, optional goal, optional private_notes | editable scenario/persona draft, proposed goal if omitted, and opening; no persistence; user confirms before session start. **Implemented (G2):** `draftRequestSchema` → `draftResponseSchema` `{role, goal, assumptions≤5}` in `lib/schemas/draft.ts`; auth before body/model; 422 `OUT_OF_SCOPE`, 503 `PROVIDER_UNAVAILABLE` (retryable, after one internal retry), 503 `NOT_CONFIGURED` |
| POST /api/personas | confirmed persona fields | id, version |
| PATCH /api/personas/:id | expected_version, allowed changes and/or remove_fields | updated record/version or 409; approved-memory removal follows the data spec |
| GET /api/profile | none | current user's profile |
| PATCH /api/profile | expected_version, explicit allowed changes and/or remove_fields | updated profile/version or 409; approved-memory removal follows the data spec |
| POST /api/sessions | confirmed scenario/persona IDs or transient draft, duration, save_mode | session ID, expiry, transport configuration/short-lived credentials. **Implemented (G1/G2):** `{idempotencyKey, durationSeconds}` plus either `preset: "roommate"` or a strict reviewed `role` (no goal/notes accepted); idempotency fingerprint hashes canonical `{durationSeconds, role}`; saved IDs and save_mode arrive in G3 |
| POST /api/sessions/:id/connected | connection acknowledgement, provider conversation ID if available | owner-authorized idempotent connecting -> active acknowledgement; expired/terminal session cannot reactivate |
| POST /api/sessions/:id/end | reason, provider conversation ID if known | idempotent current terminal status: ended, already interrupted, or retained deleted tombstone; never reopens a session |
| POST /api/sessions/:id/reflect | bounded turn list, optional user reflection | reflection and at most two proposals. **Implemented (G4):** `reflectRequestSchema` `{turns≤100 (≤40,000 chars), goal?, selfReflection?}` → `{reflection}` in `lib/schemas/reflection.ts`; only after End (409 SESSION_ACTIVE otherwise), 404 for missing/foreign/deleted, 429 after 3 generations per session per server process, 503 REFLECTION_UNAVAILABLE; no proposals, nothing stored |
| POST /api/memory/:id/approve | expected_version, optional edited_value | approved mutation, target version |
| POST /api/memory/:id/dismiss | none | dismissed state |
| DELETE /api/sessions/:id | explicit user action | app deletion state and provider deletion state |
| DELETE /api/personas/:id | explicit user action | cascade/deletion states |
| DELETE /api/profile/data | explicit confirmation | deletes user practice data; identity cleanup policy documented. **Implemented (G4) as** `DELETE /api/practice-data` with `{confirm: "delete my practice data"}` and `GET /api/sessions` (metadata list); contract in `lib/schemas/practice-data.ts`. Not one transaction: `remaining` reports anything left; session rows are kept for cleanup tracking; the Auth account is not deleted |

## Request limits
Proposed defaults: situation 1,000 chars; goal 200; persona constraints 5 entries of 200 chars; private notes 1,000; reflection transcript <=100 turns and <=40,000 chars; each user reflection <=1,000 chars.
Reject over-limit requests before model calls. Limit each session to selected duration plus bounded wrap-up.

## Structured reflection contract
Fields:
- evidence_status: complete | partial | insufficient
- observed_action: string or null
- takeaway: string or null
- suggested_next_step: string or null
- proposals: list length 0..2 of allowed target, value, source, and minimal evidence
- needs_support_exit: boolean

No confidence score, diagnosis, personality label, or inferred real-person feeling.
Server validates proposal provenance independently of JSON shape. Schema validity alone is not factual correctness.

## Error envelope
Return code, human-readable message, retryable boolean, request_id.
Codes: UNAUTHENTICATED, FORBIDDEN, VALIDATION_ERROR, VERSION_CONFLICT, SESSION_ACTIVE, PROVIDER_UNAVAILABLE, USAGE_LIMIT, REFLECTION_UNAVAILABLE, DELETION_PENDING.
Implemented set (`lib/schemas/errors.ts`) also includes NOT_CONFIGURED, SESSION_EXPIRED, OUT_OF_SCOPE (setup request outside everyday-conversation scope, not retryable) and INTERNAL_ERROR; REFLECTION_UNAVAILABLE was added in G4.
Do not include prompts, secrets, or provider raw bodies in errors.

## Actions and authorization
- Users create/edit personas and approve memory.
- Setup model creates drafts only.
- Live agent produces speech and may request session completion; no profile/database mutation tools.
- Reflection model proposes changes only.
- Application enforces duration, state, ownership, and allowed field changes.
- User controls challenge increases. No inferred-emotion-driven escalation.

## Retry/idempotency
Session creation uses an idempotency key tied to owner and request. One active lease per user.
The media adapter acknowledges usable remote video/audio readiness through the connected route. A lost acknowledgement can be retried within the existing lease; it never creates a second session or extends the duration cap. A terminal/expired response triggers local teardown. G1 foundation freezes this response and the caller/receiver contract before dispatch.

Browser-reported provider IDs are untrusted hints, including on End. Never authorize provider data retrieval/deletion from a supplied ID alone. Verify its association to the authorized application session through a supported server/provider mechanism before storing it as the authoritative provider_conversation_id. Foundation must verify the available mechanism with current vendor docs/types; do not invent a binding API. If association cannot be verified, report cleanup as unresolved and retain only the minimal permitted pending metadata. A client acknowledgement is not proof of live audiovisual quality. Credentials cover one managed call; camera preview is not sent to providers. For the selected Tavus full-mode route, retain the server-returned Tavus conversation association and provider-specific cleanup status. There is no separate ElevenLabs Agent conversation; never accept arbitrary browser IDs as authority. See docs/22-LIVE-VIDEO.md.
End and reflection are idempotent per session; duplicate reflection returns the stored approved-safe result if save mode allows it.
For no-save mode, allow an in-flight request retry token with short expiry, then discard result; do not persist a transcript to achieve idempotency.
Race between End and network disconnect resolves to the first committed ended/interrupted state; deletion supersedes either. See the architecture for persisted statuses versus UI phases. Teardown runs immediately in the browser independently of this request; an HTTP failure must not keep microphone/camera capture or playback active. On expired authentication, the server rejects further operations and lease expiry reconciles metadata.
A deleted session cannot accept a late reflection or recreate memory.

## Optional provider webhook
Deferred unless needed. Verify provider signature, correlate conversation ID to an authorized session, deduplicate events, reject unknown IDs, and respect deletion tombstones. Never accept an owner ID from webhook metadata without lookup.

## Optional text-channel application contracts
These are proposed internal routes, not claims about Photon SDK endpoint names.
- POST /api/text/link: authenticated request creates expiring single-use pairing challenge.
- POST /api/text/sessions: owner, confirmed scenario/persona, verified linked identity, and explicit consent; acquire the global session lease.
- POST /api/integrations/photon/events: authenticate by the actual provider-supported mechanism, resolve linked owner/session server-side, deduplicate, enforce limits, then queue a reply. Unauthenticated events cannot invoke models or send messages.
- POST /api/text/sessions/:id/end: owner-only, idempotent, cancels pending replies and releases lease.
- DELETE /api/text/link: owner-only unlink, ends active text session and blocks further deliveries.
Reuse reflection/proposal routes with channel-specific transcript handling. No inbound text can bypass memory approval. Confirm real Spectrum authentication, retries, message IDs, and delivery semantics before implementing the adapter.
