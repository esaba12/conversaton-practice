# UI-02 Redesign: landing, dashboard, practice

Owner request (October 4, ~10:10 EDT): "UI is too lackluster all around." Landing needs stats and visual energy; a signed-in dashboard with stats and "Try again with"; the practice page needs more polish. Scope limits waived by the owner ("Dont worry about scope").

Branch `ui/redesign`. Coordinator plus two workers in the same checkout with separate files.

## Behavior

- **Dashboard (`/` when signed in).** `lib/data/dashboard.ts` reads owner-RLS metadata only: session timestamps, kind, preset and person id; people names, relationships and preset; the About-me count; planned dates and before/after likelihood. No role text, transcripts, private prep or provider ids. It shows a greeting and the date in the user's clock, a week streak card, four count-up stats (practice calls, minutes talking, day streak, people saved), "Try again with" (most recent counterparts, saved people first by recency, linking to `/practice?person=` or `/practice?preset=`), starter chips, "Coming up" planned conversations with a confidence meter and an average lift, a 24-week heatmap, recent calls (date and length only), and links. If the read fails, the dashboard says so and still offers the starters.
- **Deep links.** `/practice?preset=<starter>` opens that starter's briefing; `/practice?new=1` opens Someone new. Both clear from the URL the same way `?person=` does.
- **Sign-in** now lands on the dashboard (`/`), not `/practice`. Two-panel layout with a cited stat. The hero-path spec and preflight scripts navigate to `/practice` after sign-in.
- **Briefing** restyled in CSS only: sticky identity card, the form as a card, a serif title.
- **Landing** (worker) and **lobby** (worker): see their sections below.

Landing stats are real and cited on the page: Bravely 2019 (7 in 10 avoid hard conversations at work; 34% stay silent more than a month and 25% more than a year, the Crucial Conversations 2009 figures as reported by Bravely); BMC Medical Education 2025 (role-play self-efficacy +55.7% vs +0.8% for lectures). No invented users, testimonials or usage numbers.

## Verification

October 4, ~10:45 EDT, on `ui/redesign`:

- `npm run typecheck` pass; `npm test` 792/792 (adds `tests/unit/dashboard-stats.test.ts`); `npm run build` pass (adds `/icon.svg`, `/apple-icon`, `/opengraph-image`).
- `npm run test:ui`: 12 pass, 3 skipped. `hero-path.spec.ts` skips because `.env.local` has no `SUPABASE_SERVICE_ROLE_KEY`; it was updated for the new sign-in landing but not run.
- Signed-in screenshots with the demo account (sign-in → `/` dashboard, `/practice`, `/practice?preset=manager`, `/practice?new=1`, `/practice/about-me`) at 1440 and 390 px: no horizontal overflow. Lobby worker checked `/design-preview` lobby states at 390/900/1440, plus keyboard navigation and the delete confirm.
- UI rules: the redesign's module CSS uses translucent gradient colors, so those files are on the `moduleCssRawColors` allow-list with a reason; the logo and landing illustrations are on the `inlineSvg` allow-list.

## Logo

`components/site/logo.tsx` (`LogoMark`): a speech bubble with four voice bars, one in honey. Used in `Wordmark` (every header and the landing footer), the landing closing band, and the sign-in panel. `app/icon.svg` is the favicon; `app/apple-icon.tsx` and `app/opengraph-image.tsx` render PNGs.

Not done: saved people with a starter face still show a monogram in the lobby, because `Person` does not carry `presetId`. **Live not verified** for calls; no call was made.
