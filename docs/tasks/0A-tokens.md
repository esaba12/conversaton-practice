# 0A: Design tokens, display serif and UI primitives

Status: ready
Updated: October 3, 2026, 22:45 EDT
Assigned writer: 0A worker subagent (claude-opus-5-5-medium)
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 0
Requirements/tests: docs/next/02-BUILD-PLAN.md §2 0A; docs/33 §2–3; docs/next/05-UI-UPGRADE.md §2, §8
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/42
Pull request: not opened
CI run: not run

## Assignment and isolation

- Base ref + full SHA: `main` at the C0 contract commit (exact SHA in STATUS.md "Wow pass"); record it here when you start.
- Branch: `agent/0a-tokens`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/0a`
- Dev port: 3101 (`npm run dev -- --port 3101`)
- Owned files: `app/globals.css`, `app/layout.tsx` (font loading only), `components/ui/**` (new), `lib/ui/motion.ts` (new), `app/design-preview/**`, `tests/unit/ui-*.test.ts` (new), this record.
- Shared resources: `package.json` and lockfile are coordinator-owned (C0 already added `lucide-react` and `motion`). No provider, database or Playwright port 3100 use.
- Dependency tasks and contract revisions: C0 contract commit.
- Unblock condition: none.

## Scope and acceptance

Outcome: the docs/33 token set (color, shadow, type scale, radius, motion) exists in `app/globals.css` under the documented names, a display serif loads through `next/font`, spring presets live in `lib/ui/motion.ts`, and the primitives Portrait, Chip, Primary button and Private card exist in `components/ui/` and render in every state in `/design-preview`.
Non-goals: restyling existing screens (Phase 1 slices do that), the UI rules test (0E), new dependencies.

- [ ] Existing tokens keep their names; new tokens from docs/33 §2 added (colors, `--shadow-1..3`, `--r-sm/md/lg/pill`, `--t-quick/base/calm/breath`, type scale).
- [ ] Existing pages unchanged in layout: before/after screenshots of `/`, `/practice` (signed-out redirect is fine) and `/design-preview`, compared by eye and recorded here.
- [ ] `prefers-reduced-motion: reduce` disables transitions and animations globally except ≤150 ms fades.
- [ ] Serif chosen by rendering Fraunces, Newsreader and Source Serif 4 at 56 px and 20 px with real names ("Jordan", "Alex", "Ellis") in `/design-preview`; choice and screenshot path recorded here.
- [ ] Contrast table with measured ratios for every pairing marked "verify" in docs/33 (muted on background, white on danger, night-muted on night, focus rings).
- [ ] Primitives: Portrait (sizes 40/64/120/240, monogram fallback on clay→sage gradient, alt "{name}, fictional AI character"), Chip (selected with check, Space toggles), Primary button (48 px, disabled shows a reason line, not opacity alone), Private card (lock icon, "Only you see this", dashed border). Lucide icons only; Motion springs with `useReducedMotion()` fallbacks; six interactive states.
- [ ] Unit tests in `tests/unit/ui-*.test.ts` for the primitives' logic (monogram, accessible names, disabled reason).
- [ ] Typecheck and `npm test` pass in the worktree.

## Contract and documentation changes

- Inputs/outputs: component props exported from `components/ui/*`; tokens are CSS custom properties.
- Shared change: none expected. Propose any shared change in Handoff.
- Updated specs: update docs/33 only via Handoff proposal (coordinator-owned numbered spec).
- Decision/source: docs/00 UI deps (22:35); `lucide-react` and `motion` versions in the C0 section below.

### C0 dependency versions (coordinator)

- `lucide-react` 1.51.0 and `motion` 14.0.0, pinned exactly, added by the coordinator in the C0 contract commit. `motion` 14.0.0 was published October 2, 2026; it is the npm `latest` tag.

## Verification evidence

(worker fills in)

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
