# Data and memory

All identifiers are UUIDs unless provider-issued. All timestamps are UTC. Every user-owned row carries owner_id referencing the authenticated user, with RLS enforcing ownership.

AWS backend update: add `users(id UUID, auth_issuer TEXT, auth_subject TEXT, created_at)` with a unique constraint on `(auth_issuer, auth_subject)`. Derive these values from verified sign-in, not the request body. Every owner_id references users.id; no Supabase auth schema dependency. See docs/18-DESIGN-AND-AWS.md. The remaining domain tables and approval transaction remain required.

## Tables
This is the full MVP model, not a requirement to build every table before the first call. G1 implements users plus minimal session leases and provider cleanup metadata; G3 extends them with saved domain records. For the G1 transient preset, scenario/persona references and persona_version may be null. Later saved-record references must belong to the same owner. Do not persist the transient prompt or transcript to fill absent domain rows.

| Table | Key fields |
|---|---|
| profiles | owner_id PK, version, display_alias, goals JSON, preferred_pace, default_duration_seconds, created_at, updated_at |
| personas | id, owner_id, version, alias, role, style JSON, voice_id, familiarity, constraints JSON, source_kind, deleted_at |
| scenarios | id, owner_id, persona_id, situation, behavioral_goal, counterpart_known_facts JSON, private_notes, challenge |
| sessions | id, owner_id, scenario_id, persona_id, persona_version, status, save_mode, started_at, ended_at, lease_expires_at, provider_conversation_id |
| reflections | id, owner_id, session_id UNIQUE, observed_action, takeaway, next_step, evidence_status |
| memory_proposals | id, owner_id, session_id, target_type, target_id, target_field, expected_version, old_value JSON, proposed_value JSON, source_type, evidence_text, status |
| deletion_jobs | id, owner_id, session_id, provider_conversation_id, state, last_attempt_at, error_code |

Do not persist raw transcript/audio or a full live prompt snapshot. For no-app-save mode, use only a minimal short-lived session record for authorization/concurrency, then remove it after cleanup. Its remaining provider deletion job, if any, must be shown as pending rather than hidden.
Only a verified provider conversation association may populate the authoritative provider_conversation_id used for provider access/deletion. A browser-supplied ID is an untrusted hint; unresolved association must remain visibly unresolved, not authorize a provider action. See the connected/End contracts in docs/05-API-AND-ACTIONS.md.

Private notes are optional. Persist only if the user explicitly saves the scenario. Prefer leaving them in browser session memory for one-off practice.

## Allowed persona fields
Alias, role, formality, directness, talkativeness, familiarity, selected voice, constraints.
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

Individual approved-memory removal uses the version-checked profile/persona PATCH routes. Allowlisted optional fields can be unset with `remove_fields`; list updates replace the approved list without the removed item. Removing a required preference resets it to its documented default and shows that default in the UI. Perform target/version updates and removal of matching proposal value/evidence copies transactionally for that owner. Current memory comes from the target record, never reconstructed from approved proposal history. A deleted value must be absent from future role context. Profile practice-data deletion remains the bulk removal path.

## Optional Photon data extension
Sessions gain channel=voice|text and a persona/profile version snapshot. A messaging_links record maps owner_id to a verified opaque provider identity; clients never choose owner_id. Linking challenges are short-lived, single-use, hashed, rate-limited, and stored separately. Message event IDs support deduplication without copying message bodies into logs.
Text context is temporary and isolated per session. Proposed default: purge application text bodies after reflection or within 30 minutes after session closure, whichever comes first; hard-delete within one hour of receipt even if abandoned. Persist approved summaries/preferences only when save mode permits. Infrastructure cleanup must enforce TTLs; app deletion does not promise deletion from iMessage or Photon. Disclose provider/device retention and verify available deletion capabilities. See docs/17-PHOTON-TEXT-PRACTICE.md.
