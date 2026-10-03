# G4 handoff — October 3, 2026, 19:05 EDT

Read this after AGENTS.md and STATUS.md when starting a fresh coordinator context.

## Where things are

- **G1, G2 passed** (human live calls). **G3 and G4 accepted on automated evidence** under the user's 19:00 decision (AGENTS.md "Verification"): the coordinator advances gates on automated evidence and labels them "live not verified" until the human reports otherwise. Do not ask the human for live checks; they will verify when they choose.
- G3 merged via [PR #20](https://github.com/esaba12/conversaton-practice/pull/20); G4 via [PR #21](https://github.com/esaba12/conversaton-practice/pull/21). Evidence: [G3-04](tasks/G3-04-integration.md), [G4-04](tasks/G4-04-integration.md).
- Applied migrations: `20261003180000`, `20261003182400`, `20261003211000`. G4 added none. Any new migration is additive. The coordinator applies it (`supabase db push --linked --yes`) and runs SQL assertions.
- The dev server may be running at http://127.0.0.1:3000 (`npm run dev -- --port 3000`). The human uses Cursor's embedded browser, where HTML5 drag-and-drop likely doesn't work; click/keyboard paths must always exist.

## What G4 added

- **Transcript.** Tavus `conversation.utterance` app-messages become `utterance` media events (`lib/media/daily-controller.ts`). The workspace holds them in memory for the current attempt only.
- **Reflection.** `POST /api/sessions/[id]/reflect` (`lib/reflection/**`, `lib/schemas/reflection.ts`), and `ReflectionPanel` after End. Uses OpenAI with `store: false`, nothing stored, three generations per session per process.
- **Your data.** `/practice/data`, `GET /api/sessions`, `DELETE /api/practice-data` (`lib/schemas/practice-data.ts`).

## G5 scope (release gate: "no critical ownership/context/teardown defects", docs/10)

Automate everything automatable. Carried items:
1. **Two-user HTTP check for the G4 routes.** Add `--g4` to `scripts/preflight/auth-database-check.mjs` (and fold into `--g3-ui` if simpler). Cover: B can't list A's sessions; B gets 404 when reflecting on A's session; reflect returns 409 while active (use a fixture session row only if the RPCs allow it without a provider call, otherwise unit-only); delete-all removes only the caller's data and reports counts; signed-out 401s.
2. **Browser flow tests (Playwright, routes intercepted, real sign-in via preflight fixtures or mocked).**
   - After End, Reflect shows the request body is only `turns/goal/selfReflection`.
   - Skip and Done clear the panel.
   - Your data shows the cleanup labels; Retry calls End.
   - Sharing by click moves a fact.
   - Mobile 390 px screenshots of `/practice`, a person page, About me and Your data.
3. **G1 residual teardown paths as unit tests** where possible: lease/auth expiry teardown, 180 s auto-end, End with the server unreachable, the camera preview toggle staying local.
4. **G2:** a per-user draft rate limit (in-memory, like the reflection cap); an automated private-note probe on the draft path (unit and one real generation check, as in G2-01).
5. **G3:** session `person_id`/`person_version` attribution (additive migration plus RPC change, or document as deferred); duplicate same-named person on Save when the people list failed to load (disable Save until loaded, or re-check on save).
6. **A11y/mobile pass** of the new pages (labels, focus, live regions, 320/390 px).
7. Record results in `docs/tasks/G5-*`, update docs/09 with which T-IDs are automated vs live-pending, then STATUS.

Then **demo and submission prep**: docs/11 plus docs/25 Prompt B (it can run in parallel as a docs-only worktree worker). Update docs/11's pitch: G3 replaced memory proposals with saved people and sharing, and G4 has reflection without proposals. Draft the README, Devpost text, a list of claims we must not make, and a backup-demo shot list (the human records it). Freeze dependencies. Submission target: **October 4, 11:30 AM America/Detroit**.

## Working pattern

Unchanged from docs/27. Freeze contracts first and write `docs/tasks/G5-*` from TEMPLATE. Open GitHub issues (`gh` works on the human's machine), branch from `main`, and dispatch up to three background workers on disjoint paths, plus an optional read-only reviewer. Workers do not build, run Playwright, call providers or write Git. Integrate one at a time and run:

```sh
npm run typecheck && npm test && npm run build
sed -e 's/3100/3000/g' -e 's/webServer: {[^}]*},//' playwright.config.ts > playwright.tmp.config.ts && PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright npx playwright test -c playwright.tmp.config.ts; rm -f playwright.tmp.config.ts
PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright node_modules/.bin/node --env-file=.env.local scripts/preflight/auth-database-check.mjs --g3-ui
```

- The shell sandbox needs `all` permission for localhost HTTP, Playwright, `gh`, `git push` and `supabase`.
- `supabase db query` exits 0 even when an assertion fails; read the output.
- For a one-off real model check, use a temporary uncommitted Vitest file run with `node --env-file=.env.local node_modules/.bin/vitest run <file>`, then delete it.
- Never stage `next-env.d.ts`, `.env.local` or `artifacts/`.
- Merge PRs yourself after CI passes (`gh pr ready`, `gh pr merge --merge`).

## Paste-ready prompt

```text
Continue as coordinator in /Users/ethansaba/code/therapist. Read AGENTS.md,
STATUS.md and docs/28-G4-HANDOFF.md first. G1-G2 passed live; G3 and G4 are
merged and accepted on automated evidence (live not verified) under my 19:00
decision: do not wait for or ask me for live checks; automate everything you
can, label anything unverified live, and I'll verify when I choose.

Build G5 at full speed with the docs/28 "Working pattern": freeze contracts,
write docs/tasks/G5-* from TEMPLATE, open issues, branch from main, dispatch
up to three background workers on disjoint paths plus an optional read-only
privacy reviewer (workers: no build, no Playwright, no live provider calls,
no git writes). Integrate one at a time, run the verification recipe plus
the new automated checks, update docs/09/STATUS, push a PR, merge after CI.
Then demo and submission prep (docs/11, docs/25 Prompt B, docs/28). Keep
sign-in required, private notes out of counterpart context, sessions fresh,
no automatic memory writes, click/keyboard paths for every drag, and record
only checks actually run. Submission target: Oct 4, 11:30 AM America/Detroit.
```
