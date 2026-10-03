# Architecture

## Selected stack
- Next.js App Router + TypeScript, npm and a committed lockfile.
- Tailwind and a small component set; custom design based on the UX specification.
- ElevenLabs Agents React SDK for live voice.
- AWS-hosted PostgreSQL replaces Supabase. Recommended deployment candidate: Aurora PostgreSQL Serverless v2 with RDS Data API; verify region/engine support and account access before selecting concrete infrastructure.
- Required account sign-in before all workspace actions. Amazon Cognito user pools are the recommended implementation target; anonymous entry is superseded.
- Server-only OpenAI Responses structured output for setup and reflection; model ID in configuration.
- Zod shared schemas, Vitest for domain logic, Playwright tests for UI and ownership flow.
No vector database or model fine-tuning.

These are selected implementation defaults. Verify installed SDK types before coding against examples. Sources: S08-S13, S18-S20.

## Data flow
Browser authenticates -> backend validates owner -> loads confirmed scenario/persona/profile -> context builder constructs role-safe input -> backend issues short-lived ElevenLabs connection credentials -> browser opens voice session.

Live transcript events remain in session memory. At end, browser submits bounded transcript to the authenticated reflection route. The server validates size and ownership, treats transcript as untrusted data, generates a structured reflection, and persists only the allowed summary/proposals. Raw content is discarded from application memory after processing rather than stored in Postgres.

Browser-supplied transcripts can be incomplete or manipulated. Reflection is advisory, not a trusted achievement or clinical assessment. Post-call webhooks are an optional later source of authoritative provider transcripts, not required for the demo.

## Proposed modules
- app/: pages and route handlers.
- components/: setup, persona editor, conversation controls, reflection, memory review.
- lib/schemas/: Zod contracts.
- lib/context/: pure role-context builder and profile allowlist.
- lib/voice/: ElevenLabs adapter and mock adapter.
- lib/ai/: setup/reflection adapters and schema handling.
- lib/auth/: validated account identity and server session handling.
- lib/data/: AWS PostgreSQL adapter and owner-scoped repositories.
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
Validate the sign-in provider's issuer, audience/client, token use, signature, and expiry server-side. Map the validated issuer and subject to an internal users.id UUID; use that ID for owner_id. Never use a client-supplied owner ID. Gate setup/generation as well as voice and database operations.
Enforce ownership in every repository operation and PostgreSQL RLS. The application database role must not bypass RLS or own protected tables. Set owner context only within the current transaction, with no reusable connection state; test missing identity, cross-owner reads/writes, and pooled-request isolation. Keep migrations/admin credentials separate from the runtime role. No direct browser database access.

## State machine
Persisted voice-session statuses: `connecting`, `active`, `ending`, `ended`, `interrupted`, `deleted`.

- Normal path: connecting -> active -> ending -> ended. End during connection also goes through teardown to ended.
- Transport failure or lease expiry: connecting/active/ending -> interrupted unless another terminal result already committed.
- Explicit deletion: any retained session -> deleted tombstone, before final cleanup/purge. An active session must also stop audio.
- The first committed ended/interrupted result wins the End/disconnect race. Deletion supersedes it. Late provider events never reactivate a terminal session.

UI phases `draft`, `ready`, `reflecting`, and `closed` are not persisted session statuses. Reflection is a separate operation after ended/interrupted and cannot reopen a session; deleted sessions reject it. The UI may close without reflecting.

One active session lease per user in the prototype. Duplicate starts return conflict except an idempotent replay of the same request. End is idempotent and returns the current terminal status. Browser teardown stops playback and releases the microphone even if the server End request fails; retry metadata cleanup separately. Durable lease expiry reconciles abandoned sessions. Sign-out or detected authentication expiry also tears down audio and clears transient private state.

## Foundation before parallel implementation
G1 needs a verified identity-to-user mapping and minimal owner-scoped session/cleanup records for authorization, concurrency, expiry, and provider cleanup. Broader saved profile/persona/scenario and memory tables arrive in G3; G1 can use a validated transient fictional preset.

The coordinator freezes Zod/TypeScript contracts for verified identity, start/end responses, persisted statuses versus UI phases, voice adapter events, and sanitized errors before auth, voice, and UI tasks run concurrently. Module boundaries above guide file ownership; assigned paths and revisions live in [task records](19-AGENT-WORKFLOW.md). Shared-contract changes have one writer and a documented consumer handoff.
The authenticated connected acknowledgement in [API contracts](05-API-AND-ACTIONS.md) bridges browser transport events and persisted session state. Auth/session owns its receiver; voice owns its caller. Provider conversation IDs require verified session association before provider retrieval/deletion; browser claims alone cannot authorize those actions.

## Runtime constraints
Keep transport streaming between browser and ElevenLabs; Next.js routes do not proxy continuous voice.
Use HTTPS or localhost for microphone access. Do not use process memory as a durable rate limiter on serverless hosting. Use a transactional database session lease/expiry for concurrency and an account spend cap.
Public deployment must protect session creation against abuse. If that cannot be completed, run a supervised private demo.

## Fallback
A labeled mock voice adapter enables UI development and automated tests only. Live demo evidence must use the real provider. Hosted failure may fall back to a local running build; this still needs internet for voice.

## Optional Photon channel
Add lib/text/ as a server-side Spectrum adapter only after all core gates pass and demo/submission preparation is covered. The authenticated web app creates a pending text session and verifies a messaging identity through a short-lived linking flow. Verified inbound provider events resolve identity/session server-side, pass through state checks and deduplication, and use the existing role-context allowlist. The text model is a separate transport adapter; do not route text through ElevenLabs speech.
Use channel=voice|text and immutable persona/profile snapshots per session. Keep the one-active-session-per-user lease across both channels. Text history is temporary session context, isolated from voice; reflection stays in the web app. Durable delivery deduplication, short-lived encrypted context, and provider retention require explicit implementation decisions before public use. Full contracts and failure behavior are in docs/17-PHOTON-TEXT-PRACTICE.md.
