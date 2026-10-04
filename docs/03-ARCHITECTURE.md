# Architecture

## Selected stack
- Next.js App Router + TypeScript, npm and a committed lockfile.
- Plain CSS/CSS Modules and small presentational components, based on the UX specification.
- Tavus CVI full mode with explicit ElevenLabs TTS and Daily browser transport. See docs/22-LIVE-VIDEO.md. No parallel ElevenLabs Agents or LiveAvatar pipeline.
- Supabase PostgreSQL and Supabase Auth. The user reverted the AWS plan because credits are unavailable in time and supplied a fresh Supabase project. Local configuration/Auth health are verified; sign-in/database access remain untested.
- Required non-anonymous account sign-in before all workspace actions; no guest workspace.
- Vercel is the recommended application host alongside the existing static preview. The authenticated app is not deployed; verify and pin compatible Next.js/Node versions during foundation.
- Server-only OpenAI Responses structured output for setup and reflection; model ID in configuration.
- Zod shared schemas, Vitest for domain logic, Playwright tests for UI and ownership flow.
No vector database or model fine-tuning.

These are selected implementation defaults. Verify installed SDK types before coding against examples. Sources: S08-S13, S18-S20.

## Data flow
Browser authenticates -> backend validates owner -> loads confirmed scenario/persona/profile -> context builder constructs role-safe input -> backend creates an authorized avatar/conversation session with allowlisted per-session context -> browser receives bounded transport credentials and opens the managed live video call. Optional camera preview stays local and is never published to the room.

Live transcript events remain in session memory. At end, browser submits bounded transcript to the authenticated reflection route. The server validates size and ownership, treats transcript as untrusted data, generates a structured reflection, and persists only the allowed summary/proposals. Raw content is discarded from application memory after processing rather than stored in Postgres.

Browser-supplied transcripts can be incomplete or manipulated. Reflection is advisory, not a trusted achievement or clinical assessment. Post-call webhooks are an optional later source of authoritative provider transcripts, not required for the demo.

## Proposed modules
- app/: pages and route handlers.
- components/: setup, persona editor, conversation controls, reflection, memory review.
- lib/schemas/: Zod contracts.
- lib/context/: pure role-context builder and profile allowlist.
- lib/media/: conversation/avatar adapters, local camera capture, server credentials, and mock adapter.
- lib/ai/: setup/reflection adapters and schema handling.
- lib/auth/: validated account identity and session rules.
- lib/supabase/: request-scoped SSR browser/server clients and cookie-refresh helper.
- lib/data/: Supabase PostgreSQL adapter, owner-scoped repositories, and transactional RPCs.
- lib/session/: reducer, teardown, expiry.
- fixtures/: fictional demo scenarios and synthetic test transcripts.
- tests/: unit/integration/browser checks.

## Context separation
Maintain separately:
1. Counterpart-known scenario facts.
2. Persona behavior and constraints.
3. Private user goal/notes.
4. Session operation settings.
The live prompt receives 1, 2, and necessary operational settings only. Private fears and debrief notes are excluded. The reflection stage may receive the goal and transcript. An allowlist, not a prompt request alone, enforces this boundary.

## Identity and access
Use `@supabase/ssr` with request-scoped cookie clients. Verify identity server-side with `auth.getClaims()`; use `getUser()` when a current Auth user record is required. Do not authorize from an unverified `getSession()` result. The verified subject is the `auth.users.id` UUID used as owner_id; no custom identity-mapping table. Reject anonymous Auth users as well as missing/expired identities. Gate generation, voice, and every database operation independently of page redirects. Implement cookie refresh using the entrypoint appropriate to the pinned Next.js version; do not publicly cache authenticated responses. [Supabase SSR guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client).

Runtime server clients carry the signed-in user's JWT and a publishable project key; ordinary app requests never use service-role/secret keys that bypass RLS. Browser code handles sign-in and calls application routes; all protected tables and RPCs must remain safe if a caller reaches Supabase directly. Set grants and owner policies for each operation, derive ownership from `auth.uid()`, and reject anonymous Auth claims. Enforce the same-owner relationship for linked rows. Test signed-out, anonymous, cross-owner, and concurrent requests; separate migration credentials from runtime. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

Session leases and memory approval execute atomically in reviewed PostgreSQL functions called through RPC. Prefer `security invoker`; any necessary definer function needs explicit owner checks, a restricted role, fixed search path, qualified relations, and limited execute grants. Function/table privileges must prevent callers bypassing version checks or editing trusted provider-association metadata. Freeze that privilege design before dispatch; an application route alone is not a database boundary. [Database functions](https://supabase.com/docs/guides/database/functions).

### G1 database boundary

`public.practice_sessions` is owner-readable with direct client DML revoked. Five narrow RPCs acquire a lease, bind the trusted provider ID, acknowledge readiness, end, and update cleanup. Every mutation requires the current nonanonymous user JWT plus a global server capability, whose hash is provisioned administratively in a private table. A caller-chosen capability cannot establish server trust. Public mutation functions use a restricted NOLOGIN/NOBYPASSRLS executor that does not own the tables; fixed search paths and RLS retain owner isolation. No runtime service-role key, room credentials, transcripts or prompts are stored in the table. See the ordered migrations and SQL test evidence in G1-00C.

## State machine
Persisted live-session statuses: `connecting`, `active`, `ending`, `ended`, `interrupted`, `deleted`.

- Normal path: connecting -> active -> ending -> ended. End during connection also goes through teardown to ended.
- Transport failure or lease expiry: connecting/active/ending -> interrupted unless another terminal result already committed.
- Explicit deletion: any retained session -> deleted tombstone, before final cleanup/purge. An active session must also stop all audio/video and release local capture.
- The first committed ended/interrupted result wins the End/disconnect race. Deletion supersedes it. Late provider events never reactivate a terminal session.

UI phases `draft`, `ready`, `reflecting`, and `closed` are not persisted session statuses. Reflection is a separate operation after ended/interrupted and cannot reopen a session; deleted sessions reject it. The UI may close without reflecting.

One active session lease per user in the prototype. Duplicate starts return conflict except an idempotent replay of the same request. End is idempotent and returns the current terminal status. Browser teardown stops playback and releases microphone/camera tracks even if the server End request fails; retry metadata cleanup separately. Durable lease expiry reconciles abandoned sessions. Sign-out or detected authentication expiry also tears down all media and clears transient private state.

## Foundation before parallel implementation
G1 uses the verified Supabase Auth identity plus minimal owner-scoped session/cleanup records for authorization, concurrency, expiry, and provider cleanup. Broader saved profile/persona/scenario and memory tables arrive in G3; G1 can use a validated transient fictional preset. Supabase project selection, sign-in method, redirects, migrations, and restricted cleanup execution remain foundation work; no project is implicitly reused or provisioned.

The coordinator freezes Zod/TypeScript contracts for verified identity, start/end responses, persisted statuses versus UI phases, media readiness/control events, and sanitized errors before auth, media, and UI tasks run concurrently. Module boundaries above guide file ownership; assigned paths and revisions live in [task records](19-AGENT-WORKFLOW.md). Shared-contract changes have one writer and a documented consumer handoff.
The authenticated connected acknowledgement in [API contracts](05-API-AND-ACTIONS.md) bridges browser transport events and persisted session state. Auth/session owns its receiver; media owns its caller. Acknowledgement requires actual remote video/audio readiness, not only a room connection or local preview. Provider conversation IDs require verified session association before provider retrieval/deletion; browser claims alone cannot authorize those actions.

## Runtime constraints
Keep media streaming between browser and the managed avatar/conversation transport; Next.js routes do not proxy continuous audio/video. Follow docs/22-LIVE-VIDEO.md for per-provider correlation and teardown.
Use HTTPS or localhost for microphone/camera access. Do not use process memory as a durable rate limiter on serverless hosting. Use a transactional database session lease/expiry for concurrency and an account spend cap.
Public deployment must protect session creation against abuse. If that cannot be completed, run a supervised private demo.

## Fallback
A labeled mock media adapter enables UI development and automated tests only. Live demo evidence must use a responsive real synchronized counterpart video/audio stream; audio-only recovery cannot pass G1. Hosted failure may fall back to a local running build; this still needs internet for voice.

## Text channel

Specified in [docs/17](17-PHOTON-TEXT-PRACTICE.md), not built. `lib/text/` is the only Spectrum adapter. The website links a phone number, then either the review screen or an in-thread app-card picker starts a text session. That start reuses role resolution, `loadPersonContext`, and the one-active lease, and it does not create a Tavus conversation. Inbound events hit a signed webhook, resolve the owner from the verified number, and use `buildTextRoleContext`. Turns live in a server-only table until reflection or expiry. Video keeps Daily, Tavus, and ElevenLabs speech.
