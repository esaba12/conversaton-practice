# Data and memory

All identifiers are UUIDs unless provider-issued. All timestamps are UTC. Every user-owned row carries owner_id referencing the authenticated user, with RLS enforcing ownership.

Backend decision: Supabase Auth + PostgreSQL replaces the abandoned AWS plan. Every owner_id references the primary key `auth.users.id`, derived from verified sign-in; do not add the proposed AWS issuer/subject mapping. Require a non-anonymous account and owner-scoped RLS for every operation. Explicit table/function grants belong in the same migration as the policies. See [backend direction](18-DESIGN-AND-AWS.md) and [Supabase user-data guidance](https://supabase.com/docs/guides/auth/managing-user-data).

## Tables
**G3 update (docs/26):** the MVP builds `about_me_facts`, `people` (versioned saved personas with trait chips), `person_shared_facts` (which facts each person may know) and an optional `private_prep` row that is never read by the context builder. These take precedence over the broader table list below for G3. `memory_proposals` and `reflections` are deferred to G4 or later. Applied as `supabase/migrations/20261003211000_people_sharing.sql` (hard delete, RPC-only writes, composite owner keys; details in docs/26 "As built").

**DATA-01:** `public.practice_sessions` stores nullable `person_id` and `person_version`. Both are null for a preset or reviewed-role start, or both are set for a saved-person start. The server copies them only after `person_context` succeeds; the browser does not send a person name. There is no foreign key, so deleting a person leaves the session row. `GET /api/sessions` may include `personName`, resolved through owner RLS; a deleted person yields null rather than an error. The row and the list still omit transcripts, role text, private notes, and provider credentials. Signed-in users may select only `id`, `owner_id`, `status`, `created_at`, `expires_at`, `connected_at`, `ended_at`, `cleanup`, `person_id`, and `person_version` on `public.practice_sessions` (`supabase/migrations/20261004000000_session_column_select.sql`). `owner_id` stays selectable because the owner-read policy compares it. `idempotency_key`, `request_fingerprint`, and `provider_conversation_id` are not granted to `authenticated`. `practice_session_executor` keeps its table-level select, insert, and update. The coordinator applies this migration; until then the linked project still grants table-level select. `supabase/migrations/20261003220000_session_person.sql` replaces `practice_acquire` with `(p_secret text, p_key uuid, p_fingerprint text, p_duration integer, p_person_id uuid, p_person_version integer)` and drops the four-argument signature in the same migration. Applied to the linked project on October 3, 2026. On that apply, `supabase/tests/session_person.sql` and `supabase/tests/session_foundation.sql` passed and rolled back; the column-grant edits in those files have not been run. `20261003220100_revoke_session_executor.sql` is also applied; `supabase_admin` still grants `practice_session_executor` to `postgres`, and the executor role stays NOLOGIN, NOBYPASSRLS, and not superuser.

This is the full MVP model, not a requirement to build every table before the first call. G1 uses Supabase's managed Auth identity plus minimal session leases and provider cleanup metadata; G3 extends them with saved domain records. For the G1 transient preset, scenario/persona references and persona_version may be null. Later saved-record references must belong to the same owner. Do not persist the transient prompt or transcript to fill absent domain rows.

| Table | Key fields |
|---|---|
| profiles | owner_id PK, version, display_alias, goals JSON, preferred_pace, default_duration_seconds, created_at, updated_at |
| personas | id, owner_id, version, alias, role, style JSON, voice_id, avatar_id, familiarity, constraints JSON, source_kind, deleted_at |
| scenarios | id, owner_id, persona_id, situation, behavioral_goal, counterpart_known_facts JSON, private_notes, challenge |
| sessions | id, owner_id, scenario_id, persona_id, persona_version, status, save_mode, started_at, ended_at, lease_expires_at, avatar_provider, avatar_session_id, provider_conversation_id |
| reflections | id, owner_id, session_id UNIQUE, observed_action, takeaway, next_step, evidence_status |
| memory_proposals | id, owner_id, session_id, target_type, target_id, target_field, expected_version, old_value JSON, proposed_value JSON, source_type, evidence_text, status |
| deletion_jobs | id, owner_id, session_id, provider, provider_resource_id, state, last_attempt_at, error_code |

Do not persist raw transcript/audio/video, camera frames, or a full live prompt snapshot. For no-app-save mode, use only a minimal short-lived session record for authorization/concurrency, then remove it after cleanup. Its remaining provider deletion job, if any, must be shown as pending rather than hidden.
Keep verified avatar-session and conversation-provider associations separate. Each provider cleanup/deletion job has its own truthful status; stopping a call is not deleting content. Only a verified provider conversation association may populate the authoritative provider_conversation_id used for provider access/deletion. A browser-supplied ID is an untrusted hint; unresolved association must remain visibly unresolved, not authorize a provider action. See the connected/End contracts in docs/05-API-AND-ACTIONS.md.

Private notes are optional. Persist only if the user explicitly saves the scenario. Prefer leaving them in browser session memory for one-off practice.

## Database access and atomic operations
Owner repositories use a request-scoped Supabase client carrying the verified user's JWT. Policies use `auth.uid()` for reads/deletes and both existing-row and resulting-row ownership for updates; writes must never reassign ownership. Deny signed-out and anonymous Auth access. No ordinary request uses a service-role key. Review direct table/RPC access as well as application routes. [RLS reference](https://supabase.com/docs/guides/database/postgres/row-level-security).

Implement lease acquisition/expiry, version-checked approval, and approved-memory removal as transactional PostgreSQL functions exposed through narrowly granted RPCs. Lock/check the relevant rows and enforce idempotency in the database; separate JavaScript requests do not form a transaction. Prefer invoker rights. Where exclusive function writes are needed, a reviewed restricted definer function must validate identity/ownership, fix its search path, qualify relations, and prevent direct-grant bypass. Preserve RLS on underlying owner data and restrict trusted provider metadata mutations. Test two owners, duplicate starts, concurrent approvals, stale versions, and rollback. [Function security](https://supabase.com/docs/guides/database/functions).

## Allowed persona fields
Alias, role, formality, directness, talkativeness, familiarity, selected voice, allowlisted stock avatar, constraints. G3 stores no face or voice; every call uses the one configured pair. A later preset is an allowlisted stock face and premade voice, stored as a preset id and mapped to provider ids on the server (docs/00). Do not generate a real person's likeness. Appearance is presentation, not a fact about a real counterpart.
No fields for inferred real-person thoughts, diagnoses, hostility probability, or approval probability.

## Allowed profile fields
Explicit goal list, preferred pace, default duration, user-approved takeaway.
No inferred mental-health diagnosis, personality score, or ranking of social ability.

## Proposal lifecycle
proposed -> approved | edited_and_approved | dismissed | expired
Only pending proposals can be approved.
Approval transaction:
1. Check authenticated ownership of proposal and target.
2. Validate target field against allowlist and expected current version.
3. Revalidate edited value if supplied.
4. Update target and increment version.
5. Mark proposal approved/edited_and_approved.
6. Commit atomically.
Stale version returns 409; repeated approval returns existing result without a second mutation.
Rejected proposals never enter future prompt context. Expire unreviewed proposals after 24 hours as a product default.

## Evidence rules
- Explicit user editing can update a persona immediately.
- Post-session persona proposals require an explicit user correction, not simulated character behavior.
- Profile proposals require a user-stated preference or an optional reflection response.
- An agent line is never evidence for a real person's trait.
- Do not suggest You prefer longer pauses just because the user was quiet.
- Evidence snippets must be minimal and editable; do not quietly retain whole conversations.
- No more than two proposed changes per session.

## Example
User says in the reflection form: Next time, please give me longer to answer.
Proposal: profiles.preferred_pace from conversational to patient.
Source: explicit_user_reflection.
The next session's operational pacing changes; the character does not announce knowledge of the user's anxiety.

## Profile continuity versus character continuity
MVP remembers profile preferences and persona settings across sessions.
It does not automatically make a persona remember prior simulated events. Each practice begins as a new simulation. A future continuity feature must clearly label fictional shared history and keep it separate from real-world facts.

## Deletion
Deleting a persona removes dependent scenarios/sessions/reflections/proposals according to a tested cascade or explicit transaction. Queue provider deletion before removing IDs needed for cleanup. Delete memory entries independently. Provider deletion status is separate from application row deletion.

Practice-data deletion is separate from deleting the Supabase Auth account. Do not cascade away unresolved provider-cleanup jobs; finish or explicitly retain the minimal cleanup record before account removal. Background cleanup cannot depend on an expired user JWT: foundation must define a narrowly authorized worker/database function and its ownership checks. A broad service-role key in ordinary requests is not the fallback. Account removal and global token revocation are not implied by the practice-data deletion UI.

Individual approved-memory removal uses the version-checked profile/persona PATCH routes. Allowlisted optional fields can be unset with `remove_fields`; list updates replace the approved list without the removed item. Removing a required preference resets it to its documented default and shows that default in the UI. Perform target/version updates and removal of matching proposal value/evidence copies transactionally for that owner. Current memory comes from the target record, never reconstructed from approved proposal history. A deleted value must be absent from future role context. Profile practice-data deletion remains the bulk removal path.

## Optional Photon data extension
Sessions gain channel=video|text and a persona/profile version snapshot. A messaging_links record maps owner_id to a verified opaque provider identity; clients never choose owner_id. Linking challenges are short-lived, single-use, hashed, rate-limited, and stored separately. Message event IDs support deduplication without copying message bodies into logs.
Text context is temporary and isolated per session. Proposed default: purge application text bodies after reflection or within 30 minutes after session closure, whichever comes first; hard-delete within one hour of receipt even if abandoned. Persist approved summaries/preferences only when save mode permits. Infrastructure cleanup must enforce TTLs; app deletion does not promise deletion from iMessage or Photon. Disclose provider/device retention and verify available deletion capabilities. See docs/17-PHOTON-TEXT-PRACTICE.md.
