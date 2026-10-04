# OPS-01: Make Google sign-in work or hide it

GitHub issue: [#32](https://github.com/esaba12/conversaton-practice/issues/32)

Who: **the human decides first.** Option A is human dashboard work plus one human check. Option B is a small agent task. Priority: high for the demo, because a judge who clicks a broken "Continue with Google" button sees an error.
Context: [UI-01](../tasks/UI-01-landing-oauth.md). The button calls Supabase `signInWithOAuth({ provider: "google" })` with `redirectTo` `{origin}/auth/callback`. The callback (`app/auth/callback/route.ts`) is built and mock-tested. The Supabase Google provider is **not enabled**.

## Option A: enable Google (human, ~10 minutes)

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID (Web application). Authorized redirect URI: `https://rcktybngebovyopregnt.supabase.co/auth/v1/callback`. Configure the consent screen if prompted (External, testing mode is fine, and add your own Google account as a test user).
2. Supabase dashboard → project `rcktybngebovyopregnt` → Authentication → Providers (label may vary) → Google: enable, then paste the client ID and secret. Never paste them into chat or the repo.
3. Authentication → URL Configuration → Redirect URLs: add `http://127.0.0.1:3000/auth/callback`, plus the hosted origin's `/auth/callback` if HOST-01 deploys.
4. On `http://127.0.0.1:3000/auth/sign-in`, click Continue with Google once, finish, and confirm you land on `/practice`.
5. Tell the coordinator the result. It goes into UI-01 as a human-reported `live` check.

## Option B: hide the button until enabled (agent)

Owned files: the sign-in page component under `app/auth/**` or `components/site/**` (find "Continue with Google"), `.env.example` (add `NEXT_PUBLIC_GOOGLE_SIGN_IN=` with a comment), `tests/browser/public.spec.ts`, `docs/02-UX.md` (as-built sign-in note), and `docs/tasks/OPS-01-google-sign-in.md`.

- [ ] The button renders only when `NEXT_PUBLIC_GOOGLE_SIGN_IN === "enabled"`. Email/password is unchanged.
- [ ] The `?error=google` message still renders correctly when the flag is on.
- [ ] `public.spec.ts` covers both states. Run `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:ui -- tests/browser/public.spec.ts` (one `test:ui` run at a time; port 3100).
- [ ] The coordinator adds the variable to `.env.local` only after Option A is done.

## Not in scope

Other OAuth providers, account linking, or changing email sign-in.


## Decision (October 4, ~02:55 EDT)

Owner chose option B: email and password only. The Google button, its handler and styles are removed; the auth callback stays for email confirmation and now reports failures as "Sign-in didn’t finish". The Google provider can stay enabled in Supabase; nothing in the app calls it.
