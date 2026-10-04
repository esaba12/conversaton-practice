# Contract and migration changes (coordinator)

Status: **proposed, not frozen, not built.** Written October 3, 2026, 22:10 EDT against `main` `eff6014`. Every item here touches a coordinator-owned path (`lib/schemas/**`, `supabase/**`, provider configuration, env). The coordinator freezes each group in one commit **before** dispatching that phase (see [02-BUILD-PLAN](02-BUILD-PLAN.md)), updates docs/04, docs/05, docs/07 and docs/08 in the same change, and records the commit in each consuming task record.

Rules carried into every contract: Zod `.strict()` on all bodies and model outputs; 401 before reading the body; owner-scoped reads and writes with 404 for another owner's ids; nothing private logged; model ids in configuration; `store:false` on model calls.

## 1. Phase 0 (C0): provider configuration only

| Item | Change |
|---|---|
| Quality PAL (Q1 + T1) | New PAL. TTS model per spike, `external_voice_id` per audition, explicit LLM, `conversational_flow` sparrow-2 with patience high and interruptibility per A/B, `idle_engagement: patient`, `perception = { perception_model: "raven-1", emotion_recognition: "full" }` with no visual queries, analysis queries, tools or callbacks. |
| Stand-in PAL (W10) | Same settings as the quality PAL, its own premade voice. Env names `TAVUS_STANDIN_PAL_ID` and `TAVUS_STANDIN_FACE_ID` (server-only). The face is never used by a person preset. |
| Readback | `provider-setup.mjs` checks change from "perception off" to "raven-1 audio, no visual or analysis queries, no callbacks". |
| Env | `TAVUS_PAL_ID` switches only after the human A/B. Record the previous id in SPIKE-01 for rollback. |
| Media events | `MediaEvent` (`lib/schemas/media.ts`) is unchanged in C0. Q3 adds an internal `remote-video-playing` signal inside the controller only. |

## 2. Phase 1 (C1)

**Frozen October 4, ~00:30 EDT (coordinator).** Shapes below are in `lib/schemas/**`. To keep `main` green until the owning slice lands, these are staged:
- `draftResponseSchema.stanceOptions` is optional, and `draftModelOutputSchema` still omits stance fields. **1C** makes `stanceOptions` required and adds stance to the model output with the prompt version bump.
- `personFieldsSchema.background` is optional on writes; M1 stores `left(publicContext, 600)` when absent. **1C** returns it on every read (and may make it required in `personSchema`). Stance chips are not person fields (`baseRoleContextSchema`).
- `personSchema.hasPracticed` is optional. **1G** derives it.
- `lib/session/server.ts` rejects `standIn`, `situation` and `openingOverride` bodies with 400 until **1C** (situation, openingOverride) and **1G** (stand-in) remove that guard.
- `sessionPresetSchema` and `situationSchema` live in `lib/schemas/situation.ts` (re-exported from `session.ts`) to avoid a people ↔ session import cycle.
- New files: `lib/schemas/goal-check.ts` (1E), `lib/schemas/voice-preview.ts` (1E), `fixtures/manager.ts` (W2, with default stance chips). Tests: `tests/unit/contracts-c1.test.ts`.

### 2.1 Role context (`lib/schemas/role-context.ts`)

*Amended by 1C (coordinator, October 4):* `roleExtrasSchema` gains `background` (1–600, server-assembled from `person_context` for person starts) and `buildRoleContext` emits `BACKGROUND_LINE` when it is present.

```ts
const stanceChip = z.string().trim().min(1).max(40);
// added to roleContextSchema, all optional so presets and saved roles stay valid
wants: stanceChip.optional(),
holdsBackBecause: stanceChip.optional(),
softensWhen: stanceChip.optional(),
```

`buildRoleContext` adds three fixed lines (text in docs/32 Q2, plus one new line):

1. Stance: "Keep your want and reason consistent across the call. Change your stance only when what the user does matches softensWhen; then soften gradually." Emitted only when at least one stance field is present.
2. Freeze rule: "If the user goes quiet for a while, check in once briefly in character, then wait."
3. Delivery: "Let your face and voice show how the character feels, within the role's tone. React to how the user sounds in character; never name or diagnose the user's emotions." The second sentence is the T1 guard (02-BUILD-PLAN §8).

Snapshot test: fields and lines present; no goal, hard-moment line, fear, or notes.

### 2.2 Draft (`lib/schemas/draft.ts`)

```ts
draftRequestSchema += { personId: z.uuid().optional() }
draftResponseSchema += {
  stanceOptions: z.object({
    wants: z.array(stanceChip).min(3).max(4),
    holdsBackBecause: z.array(stanceChip).min(3).max(4),
    softensWhen: z.array(stanceChip).min(3).max(4),
  }).strict(),
}
```

- With `personId`: the server loads that owner's person identity (name, relationship, style, background, traits), never shared facts or private prep, and the model generates situation fields only. The response `role` has the person's identity fields copied in unchanged; a mismatch from the model is overwritten by the server. Another owner's id or a missing one → 404 before any model call.
- The first chip of each `stanceOptions` array is the default and equals the corresponding `role` field.
- FIX-01 private-note probe runs on every string in `role` and `stanceOptions`.
- Setup prompt version bump (`lib/setup/prompt.ts`).

### 2.3 Start (`lib/schemas/session.ts`)

```ts
sessionPresetSchema = "roommate" | "professor" | "decline" | "manager"   // W2

const situationSchema = z.object({
  publicContext, opening, constraints, challenge, pace,          // same limits as roleContextSchema
  wants?, holdsBackBecause?, softensWhen?,                        // stanceChip
}).strict();

startRequestSchema branches:
  { idempotencyKey, preset, durationSeconds, openingOverride? }                       // retry from a preset
  { idempotencyKey, role, durationSeconds }                                           // unchanged; retry edits role.opening
  { idempotencyKey, personId, expectedVersion, durationSeconds, openingOverride? }   // unchanged default situation
  { idempotencyKey, personId, expectedVersion, situation, durationSeconds }          // new: P2
```

- `openingOverride` (1–300) is the docs/30 retry: the server resolves the role the usual way, then replaces `opening`. No other field can be overridden.
- Person + situation: the server loads identity and shared facts by id (as today), validates `situation`, merges `role = identity + situation`, then `buildRoleContext(role, { traits, knownAboutUser })`. Stale version → 409 before the lease check (same order as today).
- Client body tests: no identity fields or fact text in a saved-person body; no goal, hard-moment line, fear, likelihood or notes in any body.
- Durations stay 180 and 300. A retry uses 180.

### 2.4 People (`lib/schemas/people.ts`)

- `personFieldsSchema` gains `background` (1–600). The existing scenario fields (`publicContext`, `opening`, `constraints`, `challenge`, `pace`) remain and are labeled the person's **default situation** in the UI.
- New `personSituationSchema`: `{ id, label ≤60, situation: situationSchema, createdAt, updatedAt }`.
- Routes:
  - `GET /api/people/[id]/situations` → `{ situations }` (≤5, newest first).
  - `POST /api/people/[id]/situations` `{ label, situation }` → 201; 409 `USAGE_LIMIT` at 5; 404 for another owner's person.
  - `DELETE /api/people/[id]/situations/[situationId]` → 200; 404.
- Saving a situation does not bump the person's version (situations never enter the person's identity or context).

### 2.5 Migration M1 (`supabase/migrations/2026100xxxxxxx_person_situations.sql`)

1. `alter table people add column background text check (char_length(background) between 1 and 600)`; backfill `background = left(public_context, 600)`; then `not null`.
2. `create table person_situations (id uuid pk, owner_id uuid not null, person_id uuid not null references people on delete cascade, label text ≤60, situation jsonb not null, created_at, updated_at)`. RLS owner-only; direct DML revoked; owner RPCs for list, create (with the cap of 5, enforced in the RPC under a row lock), delete.
3. `person_context` RPC returns `background` and is unchanged otherwise (still no private prep).
4. Delete-all RPC removes `person_situations`.
4a. `alter table practice_sessions add column kind text not null default 'practice' check (kind in ('practice','stand_in'))` and `add column preset text null` (the starter id on preset starts, else null). The acquire RPC takes both. Both columns are added to the FIX-02 select grant. Metadata only. They drive W10's "first time with this person" button order: `people` responses gain a derived `hasPracticed`, and `GET /api/practice-history` returns `{ practicedPresets }`.
5. SQL test `supabase/tests/person_situations.sql`: two owners; cross-owner read/create/delete denied; cap at 5; cascade on person delete; backfill preserved existing people; `person_context` has no private prep; direct DML denied. Re-run `people_sharing.sql`, `session_person.sql`, `session_foundation.sql`.

### 2.6 New routes

**Goal check (G1).** `POST /api/sessions/[id]/goal-check`, body `{ goal ≤200, turns: string[] (1–6, each ≤500) }` → `{ met: boolean }`. Owner of a session in `active` only (404 otherwise; 409 if not active). Rate limit 1 per 3 s and 40 per session (per process). Model `OPENAI_GOAL_CHECK_MODEL`, falling back to `OPENAI_SETUP_MODEL`. Structured output `{ met: boolean }`, strict. Nothing stored or logged. docs/08 gets a line for this second in-call processor.

**Voice preview (W3).** `POST /api/voice-preview`, body `{ text 1–300, presetId? }` → `audio/mpeg`, `Cache-Control: no-store`. Signed-in only. 10 per 10 minutes per user (per process). Server maps the preset (or default) to the ElevenLabs voice id and model. Unknown preset → 400.

### 2.7 Show me first (W10)

```ts
// a separate union member; the only start body that may carry the goal
{ idempotencyKey, standIn: z.literal(true),
  goal: z.string().trim().min(1).max(200),
  hardMomentLine: z.string().trim().min(1).max(200).optional(),
  durationSeconds: z.literal(180),
  ...one of: { role } | { preset } | { personId, expectedVersion, situation? } }
```

- Server resolves the counterpart identity and situation as for a normal start, then calls `buildStandInContext` (`lib/session/stand-in-context.ts`, `server-only`) instead of `buildRoleContext`. Shared facts and traits are loaded for nothing: the stand-in path does not read them.
- `buildStandInContext` fixed lines: "You are a fictional stand-in playing the user in a short practice, so they can see the conversation once before trying it. The user is playing {name}. Say the user's line below close to word for word early in the conversation. When {name} pushes back, acknowledge their concern once and repeat the request. Stay warm, civil and brief (one to three sentences). Do not over-apologize, add new demands, coach, comment on how the user is playing, or claim to be the real user." Then the JSON `{ counterpartName, counterpartRole, situation: publicContext, yourLine: goal, whenItGetsHard?: hardMomentLine }`.
- `custom_greeting`: "Hey, {name}, do you have a minute?" (server template).
- Stand-in face and PAL from env, never from the client. The session row gets `kind = 'stand_in'`.
- The same lease rules apply. Only one live session at a time, so the Your-turn call starts after the stand-in session has ended.
- Client: `lib/practice/stand-in-client.ts` is the only module that builds this body. A unit test asserts that `lib/session/api-client.ts` has no code path that sends `goal` or `hardMomentLine`.

### 2.8 Live interactions (`lib/media/interactions.ts`, worker-owned, coordinator-reviewed)

Typed builders only for `conversation.append_llm_context` (the documented name; the October 3 harness used `conversation.append_context`), `conversation.interrupt` and `conversation.respond`, sent through the Daily app-message path. The builders accept only fixed templates plus the reviewed name, or the user's typed turn (≤300). Payload shapes are confirmed against the Tavus Interaction docs at build time and the source and date are recorded in the 1A task file.

Event parsing additions: `conversation.utterance.streaming` (captions), `conversation.started_speaking` / `stopped_speaking` with role `pal` or legacy `replica` (speaking glow). Any `user_audio_analysis` field is dropped at parse time and never reaches React state.

### 2.9 Starter faces and portraits (owner, 22:41 EDT)

- `lib/media/presets.server.ts` (server-only, imports `server-only`) starts in C1 with the four starters: `sessionPreset → { faceEnv, palEnv, voiceEnv }`. Env names follow `TAVUS_STARTER_<PRESET>_FACE_ID`, `TAVUS_STARTER_<PRESET>_PAL_ID`, `ELEVENLABS_STARTER_<PRESET>_VOICE_ID`. Starters sharing a voice share a PAL. Missing env falls back to `TAVUS_PAL_ID`/`TAVUS_FACE_ID`.
- Preset starts use the mapped PAL and face; role, person and stand-in starts are unchanged (the stand-in keeps its reserved face).
- `GET /api/portraits/[presetId]` (signed-in): the server fetches that face's `thumbnail_image_url` only when it is `https://cdn.replica.tavus.io/...` (no redirects) and streams the image with `Cache-Control: private, max-age=86400`. Any other URL is a 503 and is not fetched. Unknown id → 404. No provider id or CDN URL reaches the browser. Committing copies of the stills waits on confirmed Tavus terms (SPIKE-01).
- Phase 3 (C3, B4) extends the same module to the ~8-face catalog and `people.preset_id`.
- **Provisioned October 4, ~00:10 EDT** by `scripts/preflight/starter-faces.mjs` (ids only in `.env.local`; Vercel unchanged). Each starter has its own voice, so each has its own PAL with the quality layers. Readback is verified for all four; no live audiovisual check yet.

  | Starter | Face (phoenix-4.5 stock) | Premade voice |
  |---|---|---|
  | Jordan, manager | Victor - Office | Eric |
  | Alex, roommate | Lucas - Studio | Will |
  | Ellis, professor | Daniel - Library | George |
  | Sam, decline | Priya - Office | Jessica |

  Implemented: `starterMedia(preset)` returns `{ palId, faceId, voiceId }` (the env-name mapping above) and `starterPortrait(presetId)` backs the route. **1C** wires `starterMedia` into preset starts.

## 3. Phase 2 (C2)

### 3.1 Reflection (`lib/schemas/reflection.ts`)

```ts
reflectRequestSchema += {
  feedbackStyle: z.enum(["gentle", "plain", "list"]).optional(),   // default "gentle"
  wantAlternative: z.literal(true).optional(),                      // A1, see below
}
reflectionSchema += {
  quotedLine: z.string().trim().min(1).max(200).nullable(),
  alternative: z.string().trim().min(1).max(200).nullable(),        // only when wantAlternative
}
```

- `quotedLine` must be a verbatim substring (after whitespace normalization) of one **user** turn in the request. The server checks it and replaces a failing value with `null`. Never counterpart text.
- A1: the coordinator chooses between `wantAlternative` on the reflect route (counts toward the 3-per-session limit) and a separate `POST /api/sessions/[id]/alternative` with `{ goal }` only (one per session). **Recommendation: separate route**, so the transcript isn't re-sent just to rephrase the user's own goal line.
- Reflection prompt: docs/30 step 5 rule; feedback style changes wording only; version bump.

### 3.2 Migration M2 (`user_preferences`)

`create table user_preferences (owner_id uuid pk, feedback_style text check in ('gentle','plain','list') not null default 'gentle', updated_at)`. Owner RPC get/upsert. Covered by delete-all. Routes: `GET /api/preferences` → `{ feedbackStyle }`; `PUT /api/preferences` `{ feedbackStyle }`. Sounds stay in `localStorage` (device-only) and are not part of this table.

## 4. Phase 3 (C3)

### 4.1 Migration M3

| Table / column | Fields | Notes |
|---|---|---|
| `planned_conversations` | `id`, `owner_id`, `person_id` (cascade), `planned_on date`, `label ≤120`, `fear ≤200 null`, `likelihood_before smallint 0–100 null`, `likelihood_after smallint 0–100 null`, `checkin text null check in ('not_yet','decided_not','yes')`, `checkin_note ≤200 null`, `checked_in_at`, timestamps | One open row per person (unique partial index where `checkin is null`). W4 fields only when the user opted in. |
| `brave_things` | `id`, `owner_id`, `person_id null` (set null on delete), `text ≤160`, `happened_on date`, timestamps | No counters, no views that aggregate. |
| `people.preset_id` | `text null` | Validated against the server catalog in the route, not by the database. |

All owner-only with RLS, direct DML revoked, owner RPCs, delete-all coverage, two-owner SQL test `supabase/tests/bridge.sql`.

### 4.2 Routes

- `GET/POST /api/planned`, `PATCH/DELETE /api/planned/[id]` (date, label, opt-in W4 fields, check-in answer).
- `GET/POST /api/brave-things`, `PATCH/DELETE /api/brave-things/[id]`.
- `PATCH /api/people/[id]` accepts `presetId` with `expectedVersion` (bumps version).

### 4.3 Appearance catalog (B4)

`lib/media/presets.server.ts` (server-only, imports `server-only`): a fixed list of preset ids (for example `p1`…`p8`), each with a display name, a portrait path and env var names for its Tavus face id and PAL id (one PAL per premade voice, all with the quality PAL's settings). The browser sees only preset ids, display names and portrait paths. A bundle grep test fails the build on any provider id pattern.

## 5. Phase 4 (C4, per slice)

| Contract | Change |
|---|---|
| C4a R2 | `draftResponseSchema.questions?: { id, text ≤120, choices: string[2–4] ≤40 }[] ≤3`; `POST /api/scenarios/draft/patch` `{ draft, answers }` → draft. Never asks about diagnoses, trauma or private history (prompt fixture). |
| C4b R3 | Start body `mode?: "face" | "voice"` (default face; "type" is a separate text path decided in its spike). Server maps voice to Tavus `audio_only`. |
| C4c R4 | Start body `curveball?: true`. The server appends one constraint from a fixed list, respecting the cap of 5, and returns which one so the recap can disclose it. |
| C4d R5 | Draft and start `language?` enum from the spike-verified list; Tavus `languages` set per conversation. |

## 6. Docs to amend with each freeze

| Freeze | docs/04 | docs/05 | docs/07 | docs/08 |
|---|---|---|---|---|
| C0 | – | – | Delivery line | Tone perception notice (T1) as built |
| C1 | `background`, `person_situations`, `practice_sessions.kind` | Draft, start (incl. stand-in branch), situations, goal-check, voice-preview | Stance and freeze lines; setup prompt version; stand-in context; "the counterpart never receives the goal" kept, with the stand-in exception | Goal-check processor; voice preview (opening text only); stand-in receives the goal for one call |
| C2 | `user_preferences` | Reflect fields; alternative route | `quotedLine`, style, A1, docs/30 rule | Reflection default-on disclosure as built |
| C3 | Bridge tables, `preset_id` | Planned, brave things, preset | – | Stored fear and likelihoods (opt-in) |
