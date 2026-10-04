# Saved people, About me, and per-person sharing (G3)

Decided by the user October 3, 2026, 17:05 EDT. This replaces the earlier G3 emphasis on post-session memory proposals and is the G3 gate. Where this file conflicts with docs/01, 02, 04, 05 or 10, this file wins; those docs point here.

## Product decisions

1. **My people.** The user can save the people they practice talking to as editable personas ("Dana — my manager"). Each saved person is a fictional counterpart built from user-approved traits; it never claims to be, or predict, the real person.
2. **Chip editor.** A saved person is shaped with categorical trait chips plus short text fields, starting from a generated or manual draft. No personality percentages or sliders.
3. **About me.** The user keeps one profile of short, reusable facts about themselves ("I'm a junior engineer", "I joined in June", "I'm vegetarian").
4. **Per-person sharing by drag and drop.** On each person's page the user drags About-me chips into that person's **Knows about you** area, or drags them out. Nothing is shared by default. Clicking a chip and pressing Enter/Space, or a "Share with Dana" menu item, does the same thing for keyboard and screen-reader users.
5. **Private stays private.** Private preparation notes (fears, anxieties, coaching reminders) live in a separate section that can never be dragged or shared. The UI does not offer them as chips, and the server rejects any attempt to share them.
6. **The next practice uses it.** Starting a practice with a saved person builds the counterpart context from that person's traits plus only the About-me facts shared with that person. Each practice still starts fresh, with no prior simulated conversation.
7. **Saving after practice is one simple, explicit step.** After End, the user may choose "Save this person" (or "Update Dana") for the setup they just used. Nothing is saved automatically. Full reflection-generated memory proposals move to G4 or later and are optional.

## Data model (minimal)

All rows are owned by `auth.uid()`, use owner RLS for every operation, deny anonymous users, and grant table/RPC access explicitly in the same migration. No service-role key in request paths.

| Table | Fields | Notes |
| --- | --- | --- |
| `about_me_facts` | `id`, `owner_id`, `text` (1–120), `created_at`, `updated_at` | The user's shareable facts. Cap 30 per owner. |
| `people` | `id`, `owner_id`, `version`, `name`, `relationship`, `traits` (jsonb chip map), `style`, `public_context`, `opening`, `constraints` (jsonb ≤5), `challenge`, `pace`, `preset_id`, `created_at`, `updated_at`, `deleted_at` | A saved persona. `version` increments on every update; updates require `expected_version` (409 on mismatch). `preset_id` is null (default look) or one of `roommate`, `professor`, `decline`, `manager`. |
| `person_shared_facts` | `owner_id`, `person_id`, `fact_id`, `created_at`; PK (`person_id`, `fact_id`) | Join table of what a person knows about the user. Both ends must belong to the same owner, enforced in the RPC/policy. Deleting a fact or person removes its links. |
| `private_prep` | `owner_id` PK, `notes` (≤1000), `updated_at` | Optional, for the user's own reference. Never joined to people, never read by the context builder. A one-off practice may still keep notes only in browser memory. |

Trait chips (`traits` jsonb), each optional with one value:
- tone: warm, neutral, blunt
- formality: casual, professional, formal
- talkativeness: brief, balanced, chatty
- familiarity: stranger, acquaintance, close
- pace and challenge keep their existing enums.

Sessions store optional `person_id` and `person_version` for attribution (both null, or both set). No content is copied into the session row, and there is no foreign key, so deleting a person does not delete the session.

## Context building

`buildRoleContext` takes a strict role plus an optional `knownAboutUser: string[]` (≤30 items, each ≤120). The server assembles both from the database: the person's fields, its chips rendered as short style phrases, and the text of shared facts for that `person_id`. The browser never sends fact text or person fields to the start route when starting a saved person; it sends `{ personId, expectedVersion }` and the server loads and authorizes them. Private prep, unshared facts, goals, prior transcripts and other people's data are never inputs to the builder. Shared facts are presented to the character as things the user has told them, and as data, not instructions.

## API (proposed; coordinator freezes exact Zod in G3)

| Route | Behavior |
| --- | --- |
| `GET/POST /api/about-me`, `PATCH/DELETE /api/about-me/:id` | Owner's About-me facts |
| `GET/POST /api/people`, `GET/PATCH/DELETE /api/people/:id` | Saved people; PATCH requires `expectedVersion` |
| `PUT /api/people/:id/shared-facts` | Replace the set of shared fact IDs (`expectedVersion`); bumps person version; rejects foreign or unknown fact IDs |
| `POST /api/sessions` | Adds a third start variant `{ idempotencyKey, durationSeconds, personId, expectedVersion }`; the existing preset and transient-role variants remain. The body still does not include a face, a voice, or `preset_id`. The server loads `preset_id` for that owner and maps it. |
| `GET/PUT /api/people/:id/preset` | Look and voice. PUT body is `{ presetId, expectedVersion }`. `presetId` is one of the four starter names or null. Unknown values and extra fields such as a provider id are rejected. Success bumps `version`. |

All routes require sign-in before reading the body, and are owner-scoped. A different user's IDs return 404, without revealing whether they exist.

## UI

- **Home / My people:** a list of saved people cards, plus "Practice a new conversation".
- **Person page:** name and relationship; trait chips; short text fields (style, what they know about the situation, opening line, constraints); a two-column area with **About me** chips on one side and **Knows about you** on the other, with drag and drop plus a keyboard path; a private preparation section, visibly separate and labeled "Never shared"; actions "Practice with Dana", "Save" and "Delete".
- **After End:** "Save this person" or "Update Dana" with the edits made before the call; Dismiss is the default focus.
- Show the exact stored values and last updated time. Edits apply to future practices; an active call keeps its starting version.

## Acceptance (Gate G3)

1. Create an About-me fact and a saved person; drag one fact into that person's Knows about you; leave another fact unshared.
2. Start a practice with that person: the live character can use the shared fact and does not know the unshared fact or the private prep (T01, T16).
3. Edit a chip (for example formal to casual) and start again: the behavior change is visible, and no prior simulated conversation carries over.
4. A second signed-in user cannot list, read, edit, share into, or start a practice with the first user's people or facts (T03).
5. A stale `expectedVersion` returns 409 without a partial write (T05).

## As built (coordinator, October 3, 17:25 EDT)

Exact contracts: `lib/schemas/people.ts` (shapes and HTTP contract), `lib/schemas/role-context.ts` (`traitChipsSchema`, `buildRoleContext(role, { traits, knownAboutUser })`), `lib/schemas/session.ts` (saved-person start). Database: `supabase/migrations/20261003211000_people_sharing.sql`, assertions in `supabase/tests/people_sharing.sql`. Differences from the proposal above:

- **Hard delete, no `deleted_at`.** Deleting a person or fact removes the row and its links; nothing lingers.
- **Writes only through RPCs.** Authenticated users can `SELECT` their own rows; all writes go through `SECURITY DEFINER` RPCs owned by the restricted `people_executor` role (NOLOGIN, NOBYPASSRLS, owner RLS). Identity comes from the postgres-owned `practice_private.require_user()`, which also takes a per-owner advisory lock so caps and version checks are race-free.
- **Cross-owner links are structurally impossible.** `person_shared_facts` uses composite foreign keys `(person_id, owner_id)` and `(fact_id, owner_id)`.
- **Version bumps** on person edit, on any change to the shared set, and when a shared fact is edited or deleted (what that person knows changed).
- **Context path** is the single `person_context(p_id, p_expected_version)` function: `SECURITY INVOKER` under owner RLS, returns the person's fields and the text of its shared facts, and never references `private_prep`.
- **Private prep** has its own `GET/PUT /api/private-prep`; empty notes delete the row. One row per owner, shown on person pages under "Never shared".
- **Caps:** 30 facts and 50 people per owner (`USAGE_LIMIT` 409).
- **Session attribution.** A saved-person start stores `person_id` and `person_version` on the session. Preset and reviewed-role starts store null for both. `practice_acquire(text, uuid, text, integer, uuid, integer)` is in `supabase/migrations/20261003220000_session_person.sql`; the four-argument signature is dropped in that same migration. No foreign key, so person delete leaves the session. Your data may show `personName` when the person row still exists, and null when it does not. The idempotency fingerprint still includes the person version. Applied to the linked project on October 3, 2026. `supabase/tests/session_person.sql` and `session_foundation.sql` passed and rolled back.
- **Provider disclosure.** Shared facts and the person's fields are sent to Tavus as call context for that practice (subject to provider retention, docs/08). Private prep and unshared facts are never sent.
- **Future migrations** that replace, drop or re-own these functions must first `grant people_executor to postgres` and revoke it again afterwards, as this migration does. `service_role` keeps Supabase's default table/function privileges intentionally (test administration only; no service-role runtime).
- **Pages live under `/practice/…`** (`/practice/people/[id]`, `/practice/about-me`) to reuse the existing proxy and sign-in guard.

## Paste-ready G3 coordinator prompt

Historical: this prompt started the G3 build (done). For a fresh context use [docs/27](27-G3-HANDOFF.md).

```text
Continue as coordinator in /Users/ethansaba/code/therapist on main.
Read AGENTS.md, STATUS.md, docs/26-PEOPLE-AND-SHARING.md (the G3 design,
which wins over older docs), docs/24-G2-KICKOFF.md (the working pattern and
verification recipe), docs/tasks/G2-04-integration.md, docs/04, docs/05,
docs/09 (T01, T03, T05, T16), docs/tasks/G1-00C-session-schema.md and both
supabase/migrations files. G1 and G2 are passed and merged; do not redo them.

Build G3 at full speed with parallel subagents, the same way G2 was built.
First, freeze the contracts:
- Zod schemas for About-me facts, people (with trait chips and a version),
  shared facts, and the saved-person start variant.
- buildRoleContext's knownAboutUser input.
- One migration with owner RLS, explicit grants, and version-checked RPCs.
Write docs/tasks/G3-01..03 from TEMPLATE and open GitHub issues. Commit
on a new branch. Apply the migration to the linked Supabase project yourself
and run SQL assertions: two owners, cross-owner sharing denied, a stale
version returns 409, and private prep is never readable by the context path.

Then dispatch three background subagents on disjoint owned paths:
(1) data and routes for about-me, people and shared facts;
(2) session start with a saved person and the context builder, with tests
    proving shared facts are present and unshared facts and private prep
    are absent;
(3) the UI: My people list, person page with chips, About me, a drag-and-drop
    "Knows about you" area with a keyboard path, a separate "Never shared"
    private section, and "Save this person / Update" after End.
Add an optional read-only privacy and ownership reviewer.

Workers: no build, no Playwright, no live provider calls, no git writes.
Integrate each worker as it finishes and run the verification recipe. Extend
scripts/preflight/auth-database-check.mjs for a two-user browser check. Update
docs and STATUS, push a PR, then ask me for the live G3 call. Keep sign-in
required, private notes out of counterpart context, sessions fresh, and
record only checks actually run.
Submission target: Oct 4, 11:30 AM America/Detroit.
```

## Look and voice (built after G3)

Built October 4 in [PR #87](https://github.com/esaba12/conversaton-practice/pull/87). On the saved-person page, "Look and voice" offers Default plus the four starters (Alex, Ellis, Sam, Jordan). Each is a stock face and a premade voice. Choosing one saves immediately through `person_set_preset`, which checks `expected_version` and bumps the person version. The next practice with that person uses the mapped face and PAL. Null keeps the default pair. The choice does not change traits or shared About-me facts. `person_context` does not return `preset_id`. There is no upload and no voice cloning. A live call with a non-default face has not been reported. See [docs/00](00-DECISIONS-AND-VIABILITY.md) and [docs/06](06-ELEVENLABS.md).

## Out of scope for G3

Drag-to-reorder, importing contacts or real chats, inferring facts from conversation, automatic memory writes, and group conversations. Photo upload, a generated likeness, and voice cloning stay out. The four-starter picker above is the only look-and-voice choice.
