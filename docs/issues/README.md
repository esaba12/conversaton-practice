# Open issues

Created October 3, 2026, 20:45 EDT from `main` at `223e87a` (pushed, CI green). Each file is a self-contained brief you can paste to one agent. Status and history live in [STATUS.md](../../STATUS.md) and [docs/29](../29-REMAINING-WORK.md); task evidence goes in `docs/tasks/`.

Submission target: **11:30 AM America/Detroit, October 4**. Dependencies are frozen.

## Index

| ID | GitHub | Issue | Who | Priority | Can start |
| --- | --- | --- | --- | --- | --- |
| [FIX-01](FIX-01-private-note-probe.md) | [#27](https://github.com/esaba12/conversaton-practice/issues/27) | Private-note leak check misses short excerpts, split copies, names and numbers | Agent | High | Now |
| [FIX-02](FIX-02-session-column-grant.md) | [#28](https://github.com/esaba12/conversaton-practice/issues/28) | Signed-in users can read internal columns of their own `practice_sessions` rows | Agent writes, coordinator applies migration | Medium | Now |
| [FIX-03](FIX-03-reflect-owner-check-first.md) | [#29](https://github.com/esaba12/conversaton-practice/issues/29) | Reflect route reads a 96,000-character body before the ownership check | Agent | Medium | Now |
| [VERIFY-01](VERIFY-01-regression-on-main.md) | [#30](https://github.com/esaba12/conversaton-practice/issues/30) | Real-Auth browser regressions not re-run since the post-gate merges | Agent (coordinator-run) | High | Now, and again after fixes |
| [POST-01](POST-01-polish-browser-pass.md) | [#31](https://github.com/esaba12/conversaton-practice/issues/31) | Workspace polish and post-gate UI never browser-checked | Agent | Medium | After VERIFY-01 frees port 3000 |
| [OPS-01](OPS-01-google-sign-in.md) | [#32](https://github.com/esaba12/conversaton-practice/issues/32) | Google button is visible but the provider is not enabled | Human decision, then agent or human | High (demo risk) | Needs a decision |
| [GH-01](GH-01-close-issue-6.md) | closes [#6](https://github.com/esaba12/conversaton-practice/issues/6) | GitHub issue #6 is open although its last item is done | Agent | Low | Now |
| [HOST-01](HOST-01-hosting.md) | [#33](https://github.com/esaba12/conversaton-practice/issues/33) | App runs only locally | Human decision, then agent | Medium | Needs a decision |
| [NAME-01](NAME-01-project-name.md) | [#34](https://github.com/esaba12/conversaton-practice/issues/34) | Project has no name | Human decision, then agent | Low | Needs a name |
| [LIVE-01](LIVE-01-live-checks.md) | [#35](https://github.com/esaba12/conversaton-practice/issues/35) | G3–G5 not verified on a live call | Human (agent corroborates) | High for the pitch | When the human chooses |
| [SUB-01](SUB-01-submission.md) | [#36](https://github.com/esaba12/conversaton-practice/issues/36) | Devpost, backup recording, rehearsal not done | Human | Required | When the human says the product is ready |
| [APPEAR-01](APPEAR-01-appearance.md) | [#37](https://github.com/esaba12/conversaton-practice/issues/37) | Per-person face and voice catalog not built | Agent, after submission | Deferred | Not before submission |

When an agent opens a PR for an item, put `Closes #<n>` in the PR body. Close human items only when their acceptance is met.

## Dispatch order

1. **Now, in parallel:** FIX-01, FIX-02, FIX-03 (separate files, no server needed) and VERIFY-01 (uses ports 3000 and 3100). GH-01 any time.
2. **After VERIFY-01:** POST-01 (port 3000).
3. **After FIX-01–03 are merged:** coordinator applies the FIX-02 migration, then re-runs VERIFY-01 on the new `main`.
4. **Human:** decide OPS-01 (enable or hide Google), HOST-01, and NAME-01; run LIVE-01 when you choose; SUB-01 last.

Resource conflicts:

- `scripts/preflight/*.mjs` hardcode `http://127.0.0.1:3000`. Only one of VERIFY-01 and POST-01 can use port 3000 at a time.
- `npm run test:ui` starts or **reuses** a server on port 3100 (`reuseExistingServer`). Two worktrees running it at once would test the wrong code. One `test:ui` run at a time.
- The Supabase project `rcktybngebovyopregnt` is shared. Only the coordinator applies migrations.
- One live call (microphone, Tavus) at a time.

## Rules for every agent (paste with the spec)

```text
Read AGENTS.md, STATUS.md, and this spec before changing anything. Follow docs/19-AGENT-WORKFLOW.md and docs/20-DOCUMENTATION-STANDARD.md.
- Work in your own worktree: git worktree add .worktrees/<id-lowercase> -b agent/<id-lowercase> main. You are the only writer there.
- Edit only the files the spec lists as owned. Propose changes to anything else in your handoff.
- Do not edit STATUS.md, package.json, package-lock.json, or apply migrations. The coordinator does that.
- Do not call Tavus, ElevenLabs, or OpenAI unless the spec says so. Never print or commit secrets, .env.local, transcripts, or private notes.
- Record your work in docs/tasks/<ID>.md (copy docs/tasks/TEMPLATE.md, or update the existing record if the spec names one). Record only checks you actually ran, with mode static/unit/mock/live.
- Before handoff run: npm run typecheck && npm test. Run npm run build if you changed app code.
- Commit focused changes, push the branch, open a draft PR against main on esaba12/conversaton-practice describing behavior, verification, and what was not checked.
```
