# 0E: UI rules test, state gallery and screenshot script

Status: planned (worker part starts after 0A is integrated)
Updated: October 3, 2026, 22:45 EDT
Assigned writer: 0E worker subagent (composer-2.5-fast) for the rules test and gallery; coordinator for the screenshot script and the docs/33 rules block
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 0
Requirements/tests: docs/next/05-UI-UPGRADE.md §2, §6
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/46
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` after 0A is integrated (SHA recorded by the coordinator at dispatch).
- Branch: `agent/0e-ui-gate`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/0e`
- Dev port: 3101 (free once 0A is done)
- Owned files (worker): `tests/unit/ui-rules.test.ts`, `app/design-preview/**`, CSS fixes in `components/**/*.module.css` and `app/**/*.css` needed to make the rule test pass, this record.
- Owned files (coordinator): `scripts/ui/screenshots.mjs`, the §2 rules at the top of docs/33, `.gitignore` entry for `artifacts/ui/`.
- Shared resources: Playwright port 3100 is not used by the screenshot script; it runs against a dev server on an assigned port.
- Dependency tasks and contract revisions: 0A integrated.

## Scope and acceptance

- [ ] `tests/unit/ui-rules.test.ts` checks 05-UI-UPGRADE §2 Never #5 (raw hex/`rgb()` in `*.module.css`), #6 (`opacity` inside `:disabled` rules), #7 (`outline: none` without `:focus-visible`), #9 (pure black/white), #10 (icon imports other than `lucide-react`; inline `<svg>` in components except logo/illustrations allow-list).
- [ ] Negative control: each check fails on a planted violation (test fixture strings), then passes on the integrated head with existing violations fixed or listed here.
- [ ] `/design-preview` gallery shows every 0A primitive in every state, plus today's screens' states, from fixtures (development only).
- [x] Screenshot script writes every gallery state at 390, 900 and 1440 px, light and night, reduced motion on and off, into `artifacts/ui/<branch>/` (ignored). Coordinator, `scripts/ui/screenshots.mjs`; smoke run on `main` `c2541e2` wrote 12 whole-page shots (no gallery markers yet), October 3, 23:25 EDT.

**Gallery contract for the worker.** Wrap each state in an element with `data-gallery-state="<component>-<state>"` (for example `chip-selected`, `primary-button-disabled`) and `data-surface="room"` or `"night"`. The script screenshots each such element separately; pages without markers are captured whole. Run: `PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright node scripts/ui/screenshots.mjs --base http://127.0.0.1:<port> --route /design-preview`.

## Verification evidence

(fills in)

## Handoff

- Changed paths and commit(s):
- Remaining failures/risks:
- External account action: none
- Next smallest task:
- Ready for review:
- Coordinator integration: pending

The writer owns this handoff; the coordinator records integration and updates STATUS.
Follow [documentation rules](../20-DOCUMENTATION-STANDARD.md) and
[agent/worktree workflow](../19-AGENT-WORKFLOW.md). Do not copy private prompts,
transcripts, credentials, or personal account identifiers into this record.
