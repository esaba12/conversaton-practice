# UI-01: Landing page, signed-in home, and Google sign-in

Status: review
Updated: October 3, 2026, 20:20 EDT
Assigned writer: UI worktree agent
Coordinator: main checkout (planning agent is separate; do not edit STATUS.md here)
Gate: post-G5 polish
Requirements/tests: docs/02 public entry and home; browser public.spec.ts
GitHub issue: not opened
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `8f61d0968e1eba755c79281780f199f7960248f3` (local `main`, one commit ahead of `origin/main`)
- Branch: `agent/ui-landing` (pushed; contains only the base commit until this work is committed)
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/ui-landing`
- Dev port: 3012 for manual checks. Playwright used 3100 after that server was stopped.
- Owned files: `app/page.tsx`, `app/globals.css`, `app/auth/**`, `components/site/**`, `proxy.ts` matcher, `tests/browser/public.spec.ts`, `.env.example` comment, `docs/02-UX.md` as-built note, this record
- Shared resources: Supabase Auth project is shared. No migration. No provider call completed.
- Dependency tasks and contract revisions: none. Does not include UX-01 presets, duration, or captions.
- Unblock condition: none for the UI. Google itself needs the dashboard step below.

## Scope and acceptance

Outcome: Signed-out `/` explains the practice and leads to sign-in. Signed-in `/` is a home with Practice, About me, and Your data. Sign-in offers Google plus email/password. A successful email or Google return still opens `/practice`.

Non-goals: preset cards, changing the situation-first practice page, enabling the Google provider in Supabase, hosting.

- [x] Signed-out landing keeps “Find your words. Then take them with you.” and “Start with a conversation”, and adds the illustration label plus “What stays in your hands”.
- [x] Signed-in home links to `/practice`, `/practice/about-me`, and `/practice/data`. The wordmark returns to `/`.
- [x] Sign-in shows “Continue with Google” and an exact “Sign in” button. Email create-account still toggles.
- [x] OAuth and email confirmation still return through `/auth/callback`. A provider `error` query shows the Google message. A failed code exchange shows a generic message.
- [ ] Live Google account sign-in. Not run. The provider is not turned on from this task.

## Contract and documentation changes

- Inputs/outputs/errors: `GET /auth/callback` redirects to `/practice` after a code exchange, `/auth/sign-in?error=google` when the provider returns `error`, and `/auth/sign-in?error=callback` when the code exchange fails. No new API body.
- Shared change: `proxy.ts` matcher now includes `/` so the landing can refresh the session cookie. Proposed for coordinator review.
- Updated specs: `docs/02-UX.md` sign-in section, as-built paragraph. Preset cards stay out of this home.
- Decision/source: user request October 3, 2026 to round out the landing, the signed-in flow, and Google sign-in. Supabase `signInWithOAuth({ provider: "google" })` with `redirectTo` `{origin}/auth/callback`.

## Verification evidence

- Date/time/timezone: October 3, 2026, ~20:10 EDT
- Gate and requirement/test IDs: public entry, required sign-in
- Mode: static
- Outcome: pass
- Tested commit/dirty state: `8f61d09` plus uncommitted UI files
- Environment + working directory: local, Node 22.23.3, worktree
- Exact command: `npm run typecheck`
- Exit code: 0
- Observed result: `tsc --noEmit` completed with no errors
- Limitations: none for typecheck

- Date/time/timezone: October 3, 2026, ~20:18 EDT
- Gate and requirement/test IDs: public.spec.ts
- Mode: mock
- Outcome: pass
- Tested commit/dirty state: `8f61d09` plus uncommitted UI files
- Environment + working directory: Playwright Chromium, fresh context, port 3100, worktree
- Exact command: `PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright npm run test:ui -- tests/browser/public.spec.ts`
- Exit code: 0
- Observed result: 3 passed (public entry, Google error copy, signed-out `/practice` redirect)
- Limitations: does not sign in with Google or email

- Date/time/timezone: October 3, 2026, ~20:20 EDT
- Gate and requirement/test IDs: production build
- Mode: static
- Outcome: pass
- Tested commit/dirty state: `8f61d09` plus uncommitted UI files
- Environment + working directory: local, Next.js 16.3.8, Node 22.23.3, worktree
- Exact command: `npm run build`
- Exit code: 0
- Observed result: compiled and generated pages. `/` and `/auth/sign-in` are dynamic.
- Limitations: build does not exercise Google or a signed-in session

- Date/time/timezone: October 3, 2026, ~20:08–20:15 EDT
- Gate and requirement/test IDs: signed-in home and public landing visuals
- Mode: live
- Outcome: pass for navigation already covered by an existing signed-in browser session; Google provider not attempted to completion
- Tested commit/dirty state: `8f61d09` plus uncommitted UI files
- Environment + working directory: dev server `http://127.0.0.1:3012`; IDE browser was already signed in; a separate Playwright context was signed out
- Exact command or manual steps: opened `/` signed in; followed Practice, the wordmark, About me, and Your data; opened `/auth/sign-in` and toggled create-account. Signed-out Playwright captured `/` at 1280 and 390 and followed “Start with a conversation”.
- Exit code: N/A
- Observed result: signed-in home, situation field, About me, and Your data all opened. Signed-out landing and sign-in matched the layout. Did not click Sign out.
- Limitations: Google OAuth was not completed. One dev-only Next badge overlapped the illustration caption at 390px; it is not part of the page.

## Handoff

- Changed paths and commit(s): uncommitted. See `git status` on `agent/ui-landing`. `next-env.d.ts` was restored after `next dev` rewrote it.
- Remaining failures/risks: Google sign-in cannot succeed until the Supabase Google provider is enabled and `{origin}/auth/callback` is on the Auth redirect allow list. No app secret is required.
- External account action: In the Supabase dashboard for project `rcktybngebovyopregnt`, enable Google and allowlist `http://127.0.0.1:3012/auth/callback` plus any hosted origin. Then try Continue with Google once.
- Next smallest task: coordinator review. Do not merge ahead of the unpushed polish commit on `main` without deciding whether this branch should include `8f61d09`.
- Ready for review: yes, with the live Google check still open
