# Z: Faces and landing (3C + 2D combined)

Status: review (draft PR open). Live not verified.
Assigned writer: Z worker subagent
Coordinator: wow-pass coordinator
Gate: Compressed finish (docs/next/02-BUILD-PLAN.md §1a)
Issue: [#81](https://github.com/esaba12/conversaton-practice/issues/81). PR: see the draft PR "Z: Faces and landing" on `agent/z-faces-landing`.
Base revision: `d0a71c5`.
Requirements/tests: docs/32-FEATURE-SPECS.md B4, R6; docs/next/03-CONTRACTS.md §2.9 (starter map); migration `20261004020000_planned_and_presets.sql` (`people.preset_id`, RPC `person_set_preset(p_id, p_expected_version, p_preset)`)

## Assignment and isolation

- Branch `agent/z-faces-landing`; worktree `.worktrees/z`; dev port 3108.
- Owned: person editor "Look and voice" component (`components/presentation/people-look.tsx`) and its mount in the person page, `app/api/people/[id]/preset/route.ts`, `lib/data/people-preset.ts`, the saved-person branch of face/PAL resolution in `lib/session/**` and `lib/media/tavus.ts` (read `preset_id` from `people` directly; `person_context` is strict and unchanged), `app/page.tsx`, `components/site/**`, tests, this record.
- Not owned (propose exact diffs): `app/practice/practice-workspace.tsx`, `lib/schemas/**` shared shapes, migrations, package files, numbered docs, STATUS.md.

## Scope and acceptance

- [x] B4 with the four starter faces/voices only (existing PALs; no new provider setup): picker shows portraits via `/api/portraits/[presetId]`; saving calls `person_set_preset` with the version; saved-person start uses the mapped face and PAL (default when null); unknown preset rejected; bundle grep finds no provider ids. (Mock-tested; live not verified.)
- [x] R6 landing without a recorded clip: the live Meet card illustration works with zero network requests on interaction (browser test); reduced motion shows a still; "Fictional AI" labeling. (Mock browser.)

## Behavior

- **Look and voice** (`components/presentation/people-look.tsx`, mounted on `/practice/people/[id]` for saved people only): a radio group of Default plus the four starters (Alex, Ellis, Sam, Jordan) with portraits from `/api/portraits/[presetId]` (monogram fallback), labels only, no voice playback. Choosing saves immediately with the person's current version; the returned version replaces the page's `person.version`, so later edit/share saves send the bumped `expectedVersion`. A conflict shows a reload message; sign-out goes to sign-in.
- **Route** `app/api/people/[id]/preset/route.ts`: `GET` → `{ preset: { id, version, presetId } }` via owner-RLS read of `people`; `PUT { presetId: "roommate"|"professor"|"decline"|"manager"|null, expectedVersion }` → same shape via `person_set_preset`. Strict Zod body (extra fields such as `faceId` are 400). Markers: `NOT_FOUND` 404, `VERSION_CONFLICT` 409, `INVALID_INPUT` 400; other DB errors 503 without detail. Same-origin check from `handle`.
- **Start path** (`lib/session/server.ts`, normal saved-person branch only): after `person_context` succeeds, reads `preset_id` from `people` (`lib/data/people-preset.ts`). Set → `starterMedia(preset)` face and PAL; null → default `TAVUS_PAL_ID`/`TAVUS_FACE_ID`. A stored value outside the four, a failed read, or a missing row fails before the lease and provider call (503/404). The stand-in branch is untouched, so it always uses its reserved face. `p_preset` on acquire stays null for person starts. The preset is covered by the existing person-version fingerprint because a preset change bumps the version.
- **Landing** (`components/site/public-landing.tsx`, `components/site/meet-card-demo.tsx`): R6 Before / Call / After arc, an interactive Meet card (tabs plus two scripted replies, all local; no portrait, audio or fetch), "Fictional AI" tag, the privacy promise "Your notes never reach the character. Calls aren’t saved unless you choose.", one CTA ("Start with a conversation"; header "Sign in" link kept). The secondary "Sign in to practice" close button was removed. Under `prefers-reduced-motion: reduce` the card is a still (`data-still="true"`, no speaking pulse, no transitions). No "therapy"/"therapist" in landing or signed-in home copy.

## Verification (actually run, October 4, ~02:15–02:30 EDT)

- `npm run typecheck`: pass.
- `npm test`: 40 files, 648 tests pass. New: `tests/unit/people-preset-route.test.ts` (auth before storage; set/clear with version; 400 for unknown preset, provider-id fields, missing/zero version, bad JSON, bad id; markers to 404/409/400; raw DB error hidden; cross-site 403; GET 404/503 and no provider ids). Extended `tests/unit/session-server.test.ts` (stubbed `people` read; preset set → mapped face/PAL and no provider ids or preset name in the response; null → default; unknown stored preset / failed read / missing row rejected before lease and provider).
- `npm run build`: pass (`/api/people/[id]/preset` listed).
- Bundle grep (inline script over `.next/static`, values never printed) for all 18 `TAVUS_*_PAL_ID`/`TAVUS_*_FACE_ID`/`ELEVENLABS_*_VOICE_ID` names (default, stand-in, four starters) and their values from the main checkout's `.env.local` (read-only): 34 files, PASS.
- Playwright against `next dev -p 3108` with a local config (not committed): `tests/browser/landing.spec.ts` (signed out: no requests during tab and reply interaction; "Fictional AI"; privacy promise; no "therap" in page text; reduced motion still) and existing `tests/browser/public.spec.ts`: 5/5 pass.
- Not run: browser test of the person page picker (needs a signed-in session); real-Auth/database script for `person_set_preset`; any provider or live call. **Live not verified.**

## Handoff (proposed non-owned diffs)

1. `lib/schemas/people.ts` — move the preset shapes there so the client and server share one schema (currently defined in `lib/data/people-preset.ts` and mirrored in `components/presentation/people-look.tsx`):

```ts
import { sessionPresetSchema } from "@/lib/schemas/situation";
export const setPresetRequestSchema = z.strictObject({ presetId: sessionPresetSchema.nullable(), expectedVersion: z.number().int().positive() });
export const presetResponseSchema = z.strictObject({ preset: z.strictObject({ id: z.uuid(), version: z.number().int().positive(), presetId: sessionPresetSchema.nullable() }) });
```

   Then import them in `lib/data/people-preset.ts` and `people-look.tsx` and delete the local copies. Optional for P1 cards: add `preset_id` to `PERSON_COLUMNS` in `lib/data/people.ts` and `presetId: sessionPresetSchema.nullable().optional()` to the person schema, so lists can show the portrait.

2. `scripts/check-standin-bundle.mjs` — extend the name list to starter and default ids (the check I ran inline):

```diff
-const names = ["TAVUS_STANDIN_PAL_ID", "TAVUS_STANDIN_FACE_ID", "ELEVENLABS_STANDIN_VOICE_ID"];
+const starters = ["ROOMMATE", "PROFESSOR", "DECLINE", "MANAGER"];
+const names = [
+  "TAVUS_STANDIN_PAL_ID", "TAVUS_STANDIN_FACE_ID", "ELEVENLABS_STANDIN_VOICE_ID",
+  "TAVUS_PAL_ID", "TAVUS_FACE_ID", "ELEVENLABS_VOICE_ID",
+  ...starters.flatMap((s) => [`TAVUS_STARTER_${s}_PAL_ID`, `TAVUS_STARTER_${s}_FACE_ID`, `ELEVENLABS_STARTER_${s}_VOICE_ID`]),
+];
```

   (and "stand-in" → "provider" in the two log lines).

3. `app/practice/practice-workspace.tsx` — no change required: it loads the person fresh, so it sends the bumped version. Optional: show `/api/portraits/${presetId}` in the Meet card once diff 1 exposes `presetId`.

4. Playwright: the committed config is pinned to 3100; workers used an uncommitted `playwright.z.config.ts` (baseURL 3108, no webServer). Browsers needed `PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright` inside the sandbox.
