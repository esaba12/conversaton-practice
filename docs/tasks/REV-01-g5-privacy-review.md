# REV-01: Read-only privacy review of G3–G5

Status: integrated
Updated: October 3, 2026, 20:03 EDT
Assigned writer: REV-01 read-only privacy reviewer
Coordinator: Cursor coordinator session
Gate: G5
Requirements/tests: T01, T03, T08, T12, T13, T16
GitHub issue: not opened
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` `8f61d0968e1eba755c79281780f199f7960248f3`
- Branch: `agent/rev-01-privacy`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/rev-01`
- Dev port: N/A
- Owned files: this record only. No application edits.
- Shared resources: none
- Dependency tasks and contract revisions: tree at the base SHA above. Review did not wait on LIVE-01.
- Unblock condition: none

## Scope and acceptance

Outcome: finding list for the tree at the base SHA. A blocker is private notes or unshared About-me facts entering counterpart context, a cross-owner read or write, a provider secret in the client bundle, or a path that stores a transcript, audio, or video.

Non-goals: refactors, new tests, a live call, running the app, provider calls, Supabase, or npm install.

- [x] Findings written into this record with file references.
- [x] Each finding is blocker, should-fix, or accepted risk.
- [x] No application code change from the reviewer.

Counts: **0 blockers**, **3 should-fix**, **5 accepted risks**.

## Findings

### Blockers

None.

Checked paths, with the result that kept each one off the blocker list:

- Counterpart context is `buildRoleContext` (`lib/schemas/role-context.ts`) plus `role.opening` as `custom_greeting`. `lib/session/server.ts` passes only a Zod role and, for a saved person, `RoleExtras` from `loadPersonContext`. `lib/media/tavus.ts` `conversationBody` sets `enable_recording` and `auto_start_recording` to false. No private-prep field is an argument.
- Saved-person context is `public.person_context` (`supabase/migrations/20261003211000_people_sharing.sql`): owner and version check, then person fields plus `about_me_facts` rows that have a `person_shared_facts` link for that owner. The function does not read `private_prep`. `loadPersonContext` (`lib/data/person-context.ts`) parses that payload with a strict schema; extra keys fail the start instead of being forwarded.
- Describe-box private notes go to `POST /api/scenarios/draft` and the setup model only (`lib/setup/prompt.ts`, `lib/setup/generate.ts`). `startSession` in `lib/session/api-client.ts` sends the reviewed role, not the goal or notes. Saved `private_prep` is read and written only through `/api/private-prep` (`lib/people/api-client.ts`, `lib/data/people.ts`).
- Reflection (`lib/reflection/api-client.ts`, `lib/reflection/generate.ts`, `app/api/sessions/[id]/reflect/route.ts`) sends in-memory turns, optional goal, and optional self-reflection, with `store: false`. The route returns JSON and does not write a row. `reflectRequestSchema` is strict. Turns live in component state (`app/practice/practice-workspace.tsx`); sign-out calls `clearPrivateSetup`, which clears them.
- `practice_sessions` (`supabase/migrations/20261003180000_session_foundation.sql`) has no transcript, audio, or video column. List query columns are `id, status, cleanup, created_at, ended_at` (`lib/data/practice-data.ts`). `publicSession` (`lib/data/sessions.ts`) returns id, status, expiresAt, and cleanup.
- Session and people writes go through owner-checked RPCs. Authenticated grants on content tables are select-only; executor roles are `NOBYPASSRLS`. People and prep policies are owner-scoped and forced. `person_set_shared_facts` rejects fact ids that are not the caller’s. Foreign and missing people and sessions do not return the other owner’s row (`NOT_FOUND` / `FORBIDDEN` markers).
- Provider keys are read in `server-only` modules (`lib/media/tavus.ts`, `lib/setup/generate.ts`, `lib/reflection/generate.ts`, `lib/session/server.ts`). Client auth uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`lib/auth/config.ts`). The media credential schema is room URL, meeting token, and expiry (`lib/schemas/media.ts`). No service-role key is referenced from `app/` or `components/`.
- Practice sign-out (`app/practice/practice-workspace.tsx` `signOut`) calls `releaseMedia`, then `clearPrivateSetup`, then ends the session as `auth_loss`, then Supabase `signOut`. `WorkspaceHeader` (`components/presentation/workspace-header.tsx`) uses that callback when it is passed. `SIGNED_OUT`, page hide, and unmount call `abandon`, which releases media first. Camera preview is a local `getUserMedia` stream; Daily is created with `videoSource: false` (`lib/media/daily-controller.ts`).
- `selectMediaController` (`lib/media/controller-factory.ts`) reads `window.__practiceTestMediaController` only when `NODE_ENV !== "production"`. The call screen labels test mode.

### Should-fix

1. **Private-note probe can miss text that then becomes counterpart context.** `leaksPrivateNotes` in `lib/setup/generate.ts` flags a role only when some role field contains five consecutive normalized words from the notes (the whole note, if it is shorter). It does not catch a paraphrase, a shorter excerpt of a longer note, or the same words split across fields. `goal` and `assumptions` are not probed. On a match the attempt is discarded and a second failure returns an error, so a detected copy is not returned. An undetected copy is returned as the editable role; Start sends that role to Tavus. The describe field says the notes are never shared with the character (`components/presentation/setup-describe.tsx`).
2. **Browser-key select on `practice_sessions` is wider than the list API.** Authenticated users are granted select on the whole table (`supabase/migrations/20261003180000_session_foundation.sql`) under owner RLS. The app list omits `provider_conversation_id`, `request_fingerprint`, and `idempotency_key`, but a direct request with the user JWT can read those columns on the caller’s own rows. There is still no content column. Tighten the grant or expose a column-limited view.
3. **Reflection reads the transcript before the owner check.** `app/api/sessions/[id]/reflect/route.ts` authenticates, then parses a body up to 96,000 characters, then calls `requireEndedSession`. A non-owner gets 404 and the model is not called, and nothing is stored. Check that the session is an ended session of the caller before accepting the transcript body.

### Accepted risks

1. **OpenAI sees setup and reflection text for the request.** Draft private notes, and reflection turns plus goal and self-reflection, are sent with `store: false` (`lib/setup/generate.ts`, `lib/reflection/generate.ts`). This app does not write them. Your data discloses that OpenAI retention can still apply (`components/presentation/data-overview.tsx`).
2. **Live media is processed by Tavus and Daily, and ElevenLabs voice copies are not deleted here.** Recording flags are off. The app stores no audio or video. Cleanup can stay `pending` or `unresolved` until a later verified end and hard delete. The data page states that ElevenLabs copies are not tracked.
3. **Reviewed role text, the situation, and explicitly shared About-me facts are counterpart context on purpose.** The user can type private material into the situation or the role. Saved private prep is a different store and is not loaded into `person_context`.
4. **A model-written goal can echo private notes in text shown to the user.** The goal is not part of `buildRoleContext` or the start request. The review screen marks the goal as not shared with the character (`components/presentation/setup-review.tsx`). Same acceptance as the G5-04 note.
5. **Delete-all keeps session rows.** `deletePracticeData` (`lib/data/practice-data.ts`) deletes people, About-me facts, and private prep, then reports session cleanup counts. Rows stay so provider cleanup can be retried. The data page says they hold no practice content. The table matches that claim.

## Contract and documentation changes

- Inputs/outputs/errors and relevant ownership/privacy boundary: no code change. Boundaries reviewed are counterpart context, owner RLS and RPCs, client env, and retention.
- Shared change: none. No blocker for a fix task. Should-fix items are optional follow-ups.
- Updated specs: this record
- Decision/source: G5-04 handoff gap; this read is the missing reviewer record

## Verification evidence

- Date/time/timezone: October 3, 2026, 20:03 EDT
- Gate and requirement/test IDs: G5; T01, T03, T08, T12, T13, T16 (static read of the implementing code, tests not re-run)
- Mode: static
- Outcome: pass
- Tested commit/dirty state: `8f61d0968e1eba755c79281780f199f7960248f3` on `agent/rev-01-privacy`. Application tree clean. Untracked `node_modules` in the worktree was not reviewed and not committed.
- Environment + working directory: local read-only, `/Users/ethansaba/code/therapist/.worktrees/rev-01`
- Exact command or manual steps: read and search of the files named in the assignment, plus `person_context` / session RPCs, grants and policies, `lib/data/sessions.ts`, `lib/data/people.ts`, `lib/media/daily-controller.ts`, `lib/auth/server.ts`, `lib/auth/config.ts`, start and reflect schemas, and the data-page disclosure. No app server, provider call, Supabase CLI, or npm install.
- Exit code: N/A (file reads)
- Observed result/artifact: this record. No secrets printed.
- Limitations: production bundle was not rebuilt, so the G5-04 report that `__practiceTestMediaController` is absent from `.next/static` was not repeated. No live call and no two-browser ownership check in this pass. Cross-tab sign-out was read (`handleAuthLoss` → `abandon`) and not executed.

## Handoff

- Changed paths and commit(s): `docs/tasks/REV-01-g5-privacy-review.md` on `agent/rev-01-privacy`
- Remaining failures/risks: no blockers. Three should-fix items above. Live behavior remains unverified.
- External account action: none
- Next smallest task: coordinator may open a fix task for should-fix 1 if they want a stronger private-note control before submission. Not required to submit on this review.
- Ready for review: yes
- Coordinator integration: reviewer marked this record integrated because the read is finished and the only change is this document. `STATUS.md` was not edited.
