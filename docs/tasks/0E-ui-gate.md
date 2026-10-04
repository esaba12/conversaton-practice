# 0E: UI rules test, state gallery and screenshot script

Status: ready for review (automated evidence only; live not verified)
Updated: October 3, 2026, 23:22 EDT
Assigned writer: 0E worker subagent (composer-2.5-fast) for the rules test and gallery; coordinator for the screenshot script and the docs/33 rules block
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 0
Requirements/tests: docs/next/05-UI-UPGRADE.md §2, §6
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/46
Pull request: https://github.com/esaba12/conversaton-practice/pull/55 (draft)
CI run: pending on PR

## Assignment and isolation

- Base ref + full SHA: `main` at `ca7f549` (0A integrated on branch).
- Branch: `agent/0e-ui-gate`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/0e`
- Dev port: 3101
- Owned files (worker): `tests/unit/ui-rules.test.ts`, `app/design-preview/**`, CSS fixes in `components/**/*.module.css` and `app/**/*.css` needed to make the rule test pass, this record.
- Owned files (coordinator): `scripts/ui/screenshots.mjs`, the §2 rules at the top of docs/33, `.gitignore` entry for `artifacts/ui/`.
- Shared resources: Playwright port 3100 is not used by the screenshot script; it runs against a dev server on an assigned port.
- Dependency tasks and contract revisions: 0A integrated.

## Scope and acceptance

- [x] `tests/unit/ui-rules.test.ts` checks 05-UI-UPGRADE §2 Never #5 (raw hex/`rgb()` in `*.module.css`), #6 (`opacity` inside `:disabled` rules), #7 (`outline: none` without `:focus-visible`), #9 (pure black/white), #10 (icon imports other than `lucide-react`; inline `<svg>` in components except logo/illustrations allow-list).
- [x] Negative control: each check fails on a planted violation (test fixture strings), then passes on the integrated head with existing violations fixed or listed here.
- [x] `/design-preview` gallery shows every 0A primitive in every state, plus today's screens' states, from fixtures (development only). **Screen states from §4 flows not added** (PracticePreview at top is unchanged; `components/presentation/**` is 0C-owned — lobby/briefing/meet/call/recap gallery entries deferred to Phase 1 slices).
- [x] Screenshot script writes every gallery state at 390, 900 and 1440 px, light and night, reduced motion on and off, into `artifacts/ui/<branch>/` (ignored). Coordinator, `scripts/ui/screenshots.mjs`; smoke run on `main` `c2541e2` wrote 12 whole-page shots (no gallery markers yet), October 3, 23:25 EDT.

**Gallery contract for the worker.** Wrap each state in an element with `data-gallery-state="<component>-<state>"` (for example `chip-selected`, `primary-button-disabled`) and `data-surface="room"` or `"night"`. The script screenshots each such element separately; pages without markers are captured whole. Run: `PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright node scripts/ui/screenshots.mjs --base http://127.0.0.1:<port> --route /design-preview`.

### Rule allow-list (until 0C / Phase 1 restyle)

Documented in `tests/unit/ui-rules.test.ts` as `UI_RULES_ALLOW_LIST`:

| Rule | Path | Reason |
|---|---|---|
| #5 raw hex/rgb in module CSS | `components/presentation/*.module.css` (7 files) | 0C presentation refactor |
| #7 outline none | `setup.module.css`, `people.module.css` | 0C; missing `:focus-visible` replacement |
| #10 inline `<svg>` | `components/presentation/practice.tsx` | 0C; Lucide migration for call controls |

Fixed in this task (not allow-listed): legacy `.button:disabled { opacity: .65 }` and `.skip-link { background: white }` in `app/globals.css`; active press styling on `PrimaryButton` and `Chip` module CSS.

## Verification evidence

All automated; dev server on port 3101; no provider, database, or live human check.

| Check | Command | Outcome |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0 |
| Unit tests | `npm test` | exit 0; 20 files, 259 tests (includes new `ui-rules.test.ts`, 10 tests) |
| Production build | `npm run build` | exit 0 |
| Gallery screenshots | `PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright node scripts/ui/screenshots.mjs --base http://127.0.0.1:3101 --route /design-preview` | exit 0; **168** PNGs, **28** distinct `data-gallery-state` ids → `artifacts/ui/agent-0e-ui-gate/` (gitignored) |

Sample artifacts: `primary-button-active--room--900--motion.png`, `chip-selected-active--room--1440--motion.png`, `portrait-120-night--night--390--rm.png`.

Live not verified.

## Handoff

- Changed paths and commit(s): `ab4c794` on `agent/0e-ui-gate` — `tests/unit/ui-rules.test.ts`, `app/design-preview/**`, `app/globals.css`, `components/ui/{chip,primary-button}.module.css`, this record.
- Remaining failures/risks:
  - Presentation CSS and inline SVG remain on the allow-list until 0C or Phase 1 UI slices.
  - §4 screen states (lobby, briefing, meet, call, recap) not in the gallery yet; only 0A primitives + night portrait.
  - Gallery still includes legacy `PracticePreview` without `data-gallery-state` markers (whole-page capture only for that block).
- External account action: none
- Next smallest task: 0C or Phase 1B restyle presentation modules and remove allow-list entries; expand gallery with screen fixtures.
- Ready for review: yes (automated gate only)
- Coordinator integration (October 3, ~23:45 EDT): rebased onto `a6c8409` (0C merged; header conflict in this record resolved to the worker's lines). `npm run test:ui` then failed at 390 px: `/design-preview` scrolled sideways because the single-column breakpoint was `max-width: 389px`, and fixed 6- and 3-column grids also let the loading button and 240 px portrait spill their cells at 760, 900 and 1440 px. Coordinator fix: state grid `repeat(auto-fill, minmax(min(100%, 232px), 1fr))` and a wrapping flex portrait row. Measured at 390/600/760/900/1440 px: no page overflow and no state wider than its cell. Some rows may end short; that's accepted over overflow. Then typecheck, npm test (411 pass), build and test:ui (9 pass, 1 production-only skip). Screenshot script: 28 gallery states, 168 PNGs; pressed and disabled states checked by eye. Coordinator part done: the UI rules block is now at the top of docs/33. Allow-list stands; restyling the legacy `components/presentation` CSS belongs to the Phase 1/2 screen work.

### Proposed shared-file changes (not edited here)

- **docs/33:** Paste §2 UI rules from `docs/next/05-UI-UPGRADE.md` at file top (coordinator per 0E plan).
- **STATUS.md:** Record 0E worker completion and PR link after merge review.

The writer owns this handoff; the coordinator records integration and updates STATUS.
Follow [documentation rules](../20-DOCUMENTATION-STANDARD.md) and
[agent/worktree workflow](../19-AGENT-WORKFLOW.md). Do not copy private prompts,
transcripts, credentials, or personal account identifiers into this record.
