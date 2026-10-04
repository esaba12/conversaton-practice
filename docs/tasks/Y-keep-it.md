# Y: Keep it (2C + 3A combined: pocket card, feedback style, planned date and check-in)

Status: review (draft PR open)
Updated: October 4, 2026, 02:20 EDT
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/80
Pull request: https://github.com/esaba12/conversaton-practice/pull/86 (draft)
Assigned writer: Y worker subagent
Coordinator: wow-pass coordinator
Gate: Compressed finish (docs/next/02-BUILD-PLAN.md §1a)
Requirements/tests: docs/32-FEATURE-SPECS.md L2, L3, B1, B2; docs/next/04-NEW-SPECS.md W4 (storage); migration `supabase/migrations/20261004020000_planned_and_presets.sql` (RPCs `planned_set`, `planned_checkin`, `planned_delete`; table `planned_conversations`, owner-read RLS)

## Assignment and isolation

- Branch `agent/y-keep-it`; worktree `.worktrees/y`; dev port 3107.
- Owned: `components/practice/pocket-card*.tsx`, `lib/pocket-card/**` (canvas PNG export), `lib/practice/feedback-style.ts` (device-only `localStorage`, enum `gentle` | `direct` | `list`, default `gentle`), a feedback-style control mounted in `app/practice/about-me/about-me-workspace.tsx`, `app/api/planned/**`, `lib/data/planned.ts`, `lib/schemas/planned.ts`, `components/practice/checkin-banner.tsx`, `components/practice/planned-date.tsx`, `app/design-preview/keep/page.tsx`, tests, this record.
- Not owned (propose exact diffs): `app/practice/practice-workspace.tsx`, recap components (slice X), people pages, migrations, package files, numbered docs, STATUS.md.

## Scope and acceptance

- [x] L2 (mock/unit/browser gallery; live not verified): pocket card renders and exports PNG offline; no network on export; works with no date; "Add a day (optional)" is a quiet link.
- [x] L3 (unit; the recap send is a proposed diff, below): feedback style stored on the device only; read by the client and sent as an enum in the reflect request (slice X validates it).
- [x] B1 (unit with stubbed db; recap mount is a proposed diff): optional date and ≤120 label on a saved person and the recap; never required or re-prompted; routes are owner-authorized; cross-owner → 404.
- [x] W4 storage: "Keep my guess to check after the real conversation" off by default; only then send fear and likelihood to `planned_set`.
- [x] B2: check-in shows only when a date exists, on or after it, once; Not yet / I decided not to / Yes (optional note ≤200); Not yet offers a new day; "Talked for real" mark when the answer is Yes; no reminders outside the app.

## Built

- L2: `lib/pocket-card/{model,export}.ts` (content model, word-wrap, canvas draw, PNG blob, local download, print via a temporary `@media print` style that shows only `[data-pocket-card-print]`), `components/practice/pocket-card.tsx`. "Open with" defaults to the goal and is editable; the hard-moment line appears under "If it gets hard"; no date is fine; "Add a day (optional)" is a quiet link that reveals a date field on the card and calls `onDayChange` so a host can offer to save it through B1. Nothing is sent or stored by the card.
- L3: `lib/practice/feedback-style.ts` (`gentle` | `direct` | `list`, default `gentle`, `localStorage` key `practice.feedbackStyle`, SSR-safe, never throws), `components/practice/feedback-style-control.tsx` ("How should feedback sound?": Gentle words / Plain and direct / Short list), mounted in `app/practice/about-me/about-me-workspace.tsx`. Export for the recap: `getFeedbackStyle()`.
- B1/W4 server: `lib/schemas/planned.ts`, `lib/data/planned.ts`, routes `GET|PUT /api/planned`, `POST /api/planned/[id]/checkin`, `DELETE /api/planned/[id]` (HTTP contract is at the bottom of the schema file). Owner is enforced twice: the user-JWT client (RLS) and the RPCs; the list also filters `owner_id`. Another owner's person or plan returns 404 through the `NOT_FOUND` marker. `owner_id` never leaves the server. Without `guess` in the PUT body the RPC receives `p_fear` and `p_likelihood_before` as null.
- B1/B2 client: `lib/planned/{api-client,checkin,input}.ts`, `components/practice/planned-date.tsx` (optional day, label ≤120, "Keep my guess to check after the real conversation" off by default, offered only when a day and a guess exist, not seeded from a saved plan), `components/practice/checkin-banner.tsx` (due only when a plan exists, on or after its day, unanswered; Not yet / I decided not to / Yes with optional note ≤200 and the kept fear recalled when there is one; Not yet offers a new day, tomorrow or later; Yes leaves a "Talked for real" mark; in-app only), `components/practice/planned-section.tsx` (loads and wires both; exports `PlannedSection` for a person and `HomeCheckin` for home).
- Mount: `PlannedSection` is mounted in `app/practice/people/[id]/person-workspace.tsx` (two added lines; the file was simple to touch).
- Gallery: `app/design-preview/keep/{page,keep-gallery}.tsx` at `/design-preview/keep` with `data-gallery-state` markers (pocket card with/without date and hard moment, feedback style, planned date empty/set/keep-guess-offer/error, check-in ask/yes-with-fear/new-day/hidden-before-day, talked-for-real mark). Fake data only.
- Styles: `components/practice/keep.module.css` (tokens only).
- Added files outside the listed owned names, all under the feature: `lib/planned/**`, `components/practice/planned-section.tsx`, `components/practice/feedback-style-control.tsx`, `components/practice/keep.module.css`.

## Verification evidence

All runs: local, macOS, Node v20.19.4, worktree `/Users/ethansaba/code/therapist/.worktrees/y`, base `945ac92` plus the uncommitted change set that became the PR head. No provider, live, or database call was made.

- `npm run typecheck`: unit/static, pass, exit 0.
- `npm test`: unit, pass, 41 files, 646 tests (new: `planned-routes`, `planned-checkin`, `pocket-card`, `feedback-style`). Covers: 401 on every planned route before the body or storage; 400 on unknown fields, bad day, label over 120, empty guess, note over 200, note with a non-Yes answer, oversized body; list is owner-filtered and omits `owner_id`; 503 does not leak the database message; W4 RPC args are null without the opt-in and carry the guess only with it; cross-owner `NOT_FOUND` on set, check-in and delete maps to 404; check-in visibility rules (no plan, before the day, on the day, after, answered); Yes recalls the fear only when kept; Not yet offers a day after today; client body rebuilt field by field (no goal or fear unless `guess` passed); feedback style default/round-trip/invalid/blocked storage/no window; pocket card with no date, with a date, quiet link only without a day, wrap, draw order, PNG blob with fetch, XHR and `sendBeacon` stubbed and never called, failure paths. The existing `ui-rules` tests also scan the new CSS and TSX.
- `npm run build`: static/build, pass, exit 0 (dev server stopped first). The three `/api/planned` routes and `/design-preview/keep` appear in the route table.
- Browser (mock, dev server on 3107, Cursor browser): `/design-preview/keep` renders every state; "Save as picture" produced the status "Saved to your device. Nothing was sent anywhere." with `window.fetch` wrapped and recording zero calls. The Next dev overlay shows one hydration warning that comes from the browser tool injecting `data-cursor-ref` attributes into the DOM, not from the page. Print was not exercised (no print dialog in the tool).
- Not run: the SQL isolation test (coordinator owns M23 and its test), a signed-in browser pass against the real database, Playwright specs, a real print.

## Live not verified

Nothing here was verified against the real Supabase project, real Auth, or a person. The routes are tested with a stubbed client. The PNG output was not inspected by eye on a real device, and print layout was not checked in a print preview.

## Handoff: proposed diffs for files this task does not own

1. Send the feedback style (slice X validates it). In `lib/reflection/api-client.ts` (X) add `feedbackStyle?: FeedbackStyle` to `ReflectRequest` and, after `selfReflection`:

```diff
+  if (input.feedbackStyle) body.feedbackStyle = input.feedbackStyle;
```

   and in `app/practice/practice-workspace.tsx` `requestReflectionNow`:

```diff
+import { getFeedbackStyle } from "@/lib/practice/feedback-style";
...
-      const result = await requestReflection(sessionId, { turns, goal: goal || undefined, selfReflection: selfReflection.trim() || undefined });
+      const result = await requestReflection(sessionId, { turns, goal: goal || undefined, selfReflection: selfReflection.trim() || undefined, feedbackStyle: getFeedbackStyle() });
```

2. Home check-in banner, `app/practice/practice-workspace.tsx` (wrap the Lobby so the banner sits above it; each banner stays mounted so Not yet can offer a day):

```diff
+import { HomeCheckin } from "@/components/practice/planned-section";
...
-          : <Lobby people={people} status={peopleStatus} ... notice={setupMessage || undefined} />
+          : <><HomeCheckin people={people} />
+            <Lobby people={people} status={peopleStatus} ... notice={setupMessage || undefined} /></>
```

3. Recap: "Make pocket card" and the day, in `components/practice/recap-stage.tsx` (X) rendered after the save card when `ended`. `origin`, `reflect.goal` and the hard-moment line are already available to the workspace; pass the line in as a prop so the stage does not read private state:

```tsx
// new props: hardMomentLine: string; practicedOn: string (localDay() from "@/lib/planned/checkin")
const [cardOpen, setCardOpen] = useState(false);
...
{ended && origin && <>
  <button type="button" className="button secondary" onClick={() => setCardOpen((open) => !open)}>Make pocket card</button>
  {cardOpen && <PocketCard name={origin.kind === "person" ? origin.person.name : origin.role.name} goal={reflect.goal} hardMomentLine={hardMomentLine} practicedOn={practicedOn} />}
  {origin.kind === "person" && <PlannedSection personId={origin.person.id} personName={origin.person.name}
    guess={{ fear: prediction, likelihoodBefore }} />}
</>}
```

   `prediction` and `likelihoodBefore` come from `readPrivateState()` in the workspace and are passed down. `PlannedSection` only sends them when the user turns on "Keep my guess to check after the real conversation" and a day is set; they are never added to any other body. `PlannedSection` must not unmount between a "Not yet" and the new-day prompt.

4. The W4 "After" slider (X) can write `likelihoodAfter` to the stored plan only through `POST /api/planned/[id]/checkin`; today the check-in sends none, so the stored `likelihood_after` stays empty unless X adds it. This is a decision for the coordinator.

## Decisions and risks

- `planned_set` replaces the plan and clears any check-in, so "Pick a new day" also drops a kept guess. That matches the RPC; the copy does not promise otherwise.
- A "Not yet" answer is stored as the answer for that date. If the user skips the new day, they are not asked again for that date (one prompt per date).
- The check-in compares `plannedOn` with the browser's local calendar day, so it fires at local midnight.
- `PlannedSection` fetches `/api/planned` itself, so the person page makes one extra read.

### Coordinator integration (October 4, ~02:30 EDT)

- Rebased onto `d0a71c5` (conflict in About me: kept both the feedback-style control and 1F's Sounds switch). Wired the home check-in banner above the lobby (Handoff diff 2) and gave the banner the lobby's width. Diffs 1 and 3 (feedback style in the reflect request, pocket card and planned day on the recap) wait for slice X.
- Signed-in walk on real Auth/database (`artifacts/local/keep-walk.mjs`, ignored; two fictional users created and deleted): 9/9 — day saved on the person page; guess off sends only `personId, plannedOn, label`; home shows the check-in after the day; Yes with a note stored, fear null; not asked again for the same day; owner B lists no plans and gets 404 setting a day on owner A's person; signed out 401; no page errors.
- Checks: typecheck clean; 673 unit tests. Live not verified (no print preview; PNG not inspected by eye).
- Privacy review (opus-thinking): approve with fixes. Applied: plan list capped with `.limit(MAX_PLANS)`; feedback-style comment no longer claims wiring that doesn't exist. The W4 guess opt-in is passed from the recap (wired with slice X); the person page offers the day without a guess.
