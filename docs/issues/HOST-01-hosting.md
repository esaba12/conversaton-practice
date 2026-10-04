# HOST-01: Host the app, or decide on local-only judging

GitHub issue: [#33](https://github.com/esaba12/conversaton-practice/issues/33)

Who: **human decision first.** If you choose deploy, give an agent this spec. Priority: medium. The safe default in [DEMO-01](../tasks/DEMO-01-submission-prep.md) is local-only plus a prerecorded backup.
Existing record: [docs/tasks/HOST-01-hosting.md](../tasks/HOST-01-hosting.md) (blocked on the decision).

## Decision for the human

- **Local-only:** judging uses `npm run dev -- --port 3000` on your laptop, and Devpost's demo field stays empty (the backup recording is the remote artifact). No agent work is needed. Tell the coordinator, who records one sentence in STATUS.
- **Deploy (Vercel recommended in README):** an agent does the steps below. Allow about an hour. Morning-of deploys can break Auth redirects.

## Deploy steps (agent, only after the human says "deploy")

1. Create a **new** Vercel project for the repo root. Do not reuse or overwrite the `website/` static preview project (`conversation-practice-site`).
2. Set environment variables in Vercel, never in git, using the names in `.env.example`:
   - public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - server-only: `TAVUS_API_KEY`, `ELEVENLABS_API_KEY`, `OPENAI_API_KEY`, `OPENAI_SETUP_MODEL`, `OPENAI_REFLECTION_MODEL`, `TAVUS_PAL_ID`, `TAVUS_FACE_ID`, `ELEVENLABS_VOICE_ID`, `SESSION_SERVER_SECRET`

   The human enters the secret values or approves copying them from `.env.local`. Do not echo them in logs.
3. Node 22 runtime, matching `package.json` engines.
4. Supabase → Authentication → URL Configuration: set the Site URL or add `https://<deployed-host>/auth/callback` to Redirect URLs (human dashboard step, or the CLI if it supports it). Also do this for Google if OPS-01 Option A is done.
5. Smoke check on the deployed URL: signed-out `/practice` redirects to sign-in, email sign-in with a fictional account reaches `/practice`, and an example opens review. Do **not** start a call; a live video check on the deployed URL is a human step.
6. Confirm the production bundle does not contain `__practiceTestMediaController` or any server secret name with a value.

## Owned files

- `docs/tasks/HOST-01-hosting.md` (update: decision, URL, evidence)
- a short deploy runbook section in `README.md`
- no application code unless a deploy-only defect is found (file it as a new issue)

## Acceptance

- [ ] STATUS has one sentence: "judging demo is the local app on port 3000" or "the authenticated app is deployed at <url>".
- [ ] Devpost's demo field matches. The static preview is never described as the practice app.
