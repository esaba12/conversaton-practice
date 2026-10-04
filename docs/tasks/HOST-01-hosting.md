# HOST-01: Decide where the app is hosted

Status: review
Coordinator, October 3, 2026, 21:39 EDT: the human chose a deploy. Production is https://conversation-practice-zeta.vercel.app on a new Vercel project named `conversation-practice`. The static preview project was not changed. Framework was set to Next.js after the first deploy failed looking for a `public` output directory. SSO deployment protection was turned off so the URL is public. Signed-out `/` returned the landing (HTTP 200) and signed-out `/practice` returned 307 to `/auth/sign-in`. Email sign-in and a live call on this URL were not run. `OPENAI_REFLECTION_MODEL` is unset locally and on Vercel; reflection falls back to `OPENAI_SETUP_MODEL`.
Updated: October 3, 2026, 20:00 EDT
Assigned writer: human builder
Coordinator: Cursor coordinator session
Gate: submission demo link
Requirements/tests: N/A. A missing public app URL is an honest state, not a broken local demo.
GitHub issue: not opened
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` `8f61d0968e1eba755c79281780f199f7960248f3`
- Branch: `main`
- Worktree: `/Users/ethansaba/code/therapist`
- Dev port: 3000 for the judging demo, until a host is chosen
- Owned files: none until a decision. A later deploy task would own env configuration and a runbook. Do not add unused environment variables in this record.
- Shared resources: Vercel account if chosen; Supabase project `rcktybngebovyopregnt`; Tavus and OpenAI secrets. Secrets stay off the client and out of git.
- Dependency tasks and contract revisions: README already says Vercel is the recommended host and that the authenticated app is not deployed. `website/` is a separate static preview at https://conversation-practice-site.vercel.app.
- Unblock condition: the human chooses local-only for judging, or asks for a deploy. Agents do not deploy because this plan exists.

## Scope and acceptance

Outcome: one sentence in STATUS: either “judging demo is the local app on port 3000” or “the authenticated app is deployed at <url>”. Devpost’s demo field matches that sentence.

Non-goals: deploying during this planning task, pointing Devpost at the static preview and calling it the app, a production hardening pass.

If the choice is a deploy, the follow-up task (not this one) must:

- Use the existing server-only secret pattern. No service-role key in the client bundle.
- Set Supabase Auth redirect URLs for the real origin before calling sign-in done.
- Keep the static `website/` deployment distinct.
- Smoke-check sign-in and a signed-out redirect. A live video check on the deployed URL is a human step.

- [ ] Human chooses local-only or a host.
- [ ] Devpost demo field matches the choice. Empty is correct for local-only; the backup recording is the remote artifact.
- [ ] The static preview is not described as the practice app.

## Contract and documentation changes

- Shared change: none in this task
- Updated specs: STATUS and docs/11 demo-link line after the decision. docs/18 already notes hosting was undecided; correct that sentence when the decision exists.
- Decision/source: docs/10 “application hosting remains undecided.” README recommends Vercel and records that the app is not deployed.

## Verification evidence

- Date/time/timezone: October 3, 2026, 20:00 EDT
- Mode: not-run
- Outcome: blocked
- Tested commit/dirty state: `8f61d0968e1eba755c79281780f199f7960248f3`
- Exact command or manual steps: not run
- Exit code: N/A
- Observed result/artifact: local dev is the working app. The public Vercel URL is the static preview only.
- Limitations: no deploy was attempted for this plan

## Handoff

- Changed paths and commit(s): none
- Remaining failures/risks: a deploy the morning of judging can break Auth redirects. Local-only plus a prerecorded backup is the path already written in DEMO-01.
- External account action: human chooses. A deploy also needs env vars set in the host, never committed.
- Next smallest task: none until that choice
- Ready for review: no
- Coordinator integration: pending
