# 0A: Design tokens, display serif and UI primitives

Status: ready for review (mock and automated evidence only; live not verified)
Updated: October 3, 2026, 23:05 EDT
Assigned writer: 0A worker subagent (claude-opus-5-5-medium)
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 0
Requirements/tests: docs/next/02-BUILD-PLAN.md §2 0A; docs/33 §2–3; docs/next/05-UI-UPGRADE.md §2, §8
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/42
Pull request: not opened
CI run: see PR checks

## Assignment and isolation

- Base ref + full SHA: `main` at `9419820b4330d0ef2b74a017445c216cfd560a53` (merge of PR #47, C0 contract).
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

- [x] Existing tokens keep their names; new tokens from docs/33 §2 added (colors, `--shadow-1..3`, `--r-sm/md/lg/pill`, `--t-quick/base/calm/breath`, type scale).
- [x] Existing pages unchanged in layout: before/after screenshots of `/`, `/practice` (signed-out redirect is fine) and `/design-preview`, compared by eye and recorded here.
- [x] `prefers-reduced-motion: reduce` disables transitions and animations globally except ≤150 ms fades.
- [x] Serif chosen by rendering Fraunces, Newsreader and Source Serif 4 at 56 px and 20 px with real names ("Jordan", "Alex", "Ellis") in `/design-preview`; choice and screenshot path recorded here.
- [x] Contrast table with measured ratios for every pairing marked "verify" in docs/33 (muted on background, white on danger, night-muted on night, focus rings).
- [x] Primitives: Portrait (sizes 40/64/120/240, monogram fallback on clay→sage gradient, alt "{name}, fictional AI character"), Chip (selected with check, Space toggles), Primary button (48 px, disabled shows a reason line, not opacity alone), Private card (lock icon, "Only you see this", dashed border). Lucide icons only; Motion springs with `useReducedMotion()` fallbacks; six interactive states.
- [x] Unit tests in `tests/unit/ui-*.test.ts` for the primitives' logic (monogram, accessible names, disabled reason).
- [x] Typecheck and `npm test` pass in the worktree.

## Contract and documentation changes

- Inputs/outputs: component props exported from `components/ui/*`; tokens are CSS custom properties.
- Shared change: none expected. Propose any shared change in Handoff.
- Updated specs: update docs/33 only via Handoff proposal (coordinator-owned numbered spec).
- Decision/source: docs/00 UI deps (22:35); `lucide-react` and `motion` versions in the C0 section below.

### C0 dependency versions (coordinator)

- `lucide-react` 1.51.0 and `motion` 14.0.0, pinned exactly, added by the coordinator in the C0 contract commit. `motion` 14.0.0 was published October 2, 2026; it is the npm `latest` tag.

## Verification evidence

All evidence is automated or a local mock browser run against this worktree's dev server (port 3101). No provider calls, no database, no live check. Screenshots live under `artifacts/local/0a/` in the worktree (ignored by Git, not committed).

| Check | Mode | Command | Outcome |
|---|---|---|---|
| Typecheck | automated | `npm run typecheck` | exit 0 |
| Unit tests | automated | `npm test` | exit 0; 19 files, 249 tests passed (includes the 3 new `ui-*` files, 79 tests) |
| Production build | automated | `npm run build` | exit 0; `/design-preview` still prerenders as the development-only 404 in production |
| Layout unchanged | mock browser (Playwright, Chromium, 1440×900, full page) | `PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright node artifacts/local/0a/shoot.mjs before` before any edit, then `… shoot.mjs after serif` | `/` and `/practice` (signed-out redirect to `/auth/sign-in`): before and after PNGs are **byte-identical** (`cmp`). `/design-preview`: the existing practice preview at the top is unchanged by eye; the new "Design system" section is added below it (981 → 3488 px tall). |
| Hydration | mock browser, dev log | same run | One mismatch found and fixed (Motion adds `tabindex` when `whileTap` is set, and reduced motion is only known on the client); final run logs no hydration warning. |
| Reduced motion | mock browser, `emulateMedia({ reducedMotion: "reduce" })` | `shoot.mjs after serif` | Primary button computed `transition-duration` is `0.15s` (the `data-reduced-fade` opacity-only fade); spinners stop; screenshot `primitives-reduced-motion.png`. |
| Keyboard and disabled | mock browser | `node artifacts/local/0a/keyboard.mjs` | Space toggles a Chip `aria-pressed` false → true → false; the disabled Primary button stays focusable, `aria-describedby` resolves to "Allow the microphone first so Jordan can hear you.", computed opacity 1. |
| UI rules self-check | automated grep | `rg -i "#[0-9a-f]{3,8}\b|rgb\(|outline:\s*none|\bblack\b|\bwhite\b|opacity" components/ui/*.module.css app/design-preview/*.module.css` | Only `white-space` false positives. Icons are Lucide named imports only. |

### Serif choice: Newsreader

Rendered side by side in `/design-preview` (section "Display serif candidates") at 56 px and 20 px, weight 500, −0.02em, with "Jordan", "Alex & Ellis" and a sentence naming all three. Screenshot: `artifacts/local/0a/serif-candidates.png` (worktree).

- **Newsreader (chosen):** crisp, warm and modern at 56 px thanks to its optical-size axis, and the most readable of the three at 20 px. Fits "warm and minimal, crisp, modern typography" without stealing attention from the face.
- Fraunces: the most character, but its soft, ornate forms (note the "&") read as bookish and heavy beside the Avenir UI sans.
- Source Serif 4: very readable at 20 px but its display cut looks thin and slightly cold at 56 px.

Loaded in `app/layout.tsx` via `next/font/google` (`Newsreader`, `subsets: ["latin"]`, `axes: ["opsz"]`, `display: "swap"`, `variable: "--font-display-serif"`); components use `--font-serif` (`var(--font-display-serif), Georgia, "Times New Roman", serif`). The class only sets a variable, so no existing text changes font.

### Contrast (WCAG 2.x, computed from the hex values in `app/globals.css` by `tests/unit/ui-contrast.test.ts`)

Text needs 4.5:1; focus rings (non-text) and large text need 3:1. Every row is asserted in the test.

| Pairing | Ratio | Needs | Result | Use |
|---|---|---|---|---|
| `--muted` on `--background` | 5.18:1 | 4.5:1 | pass | Secondary text on room background (verify) |
| `#ffffff` on `--danger` | 5.38:1 | 4.5:1 | pass | White text on End/destructive (verify; reference, pure white is not used) |
| `--surface` on `--danger` | 5.34:1 | 4.5:1 | pass | Light text on End using `--surface` |
| `--night-ink` on `--danger` | 4.76:1 | 4.5:1 | pass | Night text on End in call mode (verify) |
| `--night-muted` on `--night` | 8.14:1 | 4.5:1 | pass | Secondary text on night (verify) |
| `--focus` on `--background` | 6.47:1 | 3:1 | pass | Focus ring, room (verify) |
| `--focus` on `--surface` | 6.99:1 | 3:1 | pass | Focus ring on cards (verify) |
| `--focus-night` on `--night` | 9.70:1 | 3:1 | pass | Focus ring, night (verify) |
| `--focus` on `--surface-sunk` | 6.01:1 | 3:1 | pass | Focus ring around disabled controls |
| `--muted` on `--surface` | 5.60:1 | 4.5:1 | pass | Secondary text on cards |
| `--muted` on `--surface-sunk` | 4.82:1 | 4.5:1 | pass | Disabled button/chip text, Private card title |
| `--ink` on `--surface-sunk` | 12.51:1 | 4.5:1 | pass | Private card body |
| `--surface` on `--sage` | 7.70:1 | 4.5:1 | pass | Primary button label |
| `--sage` on `--sage-soft` | 6.51:1 | 4.5:1 | pass | Selected chip label |
| `--night-ink` on `--clay` | 3.37:1 | 3:1 | pass (large text only) | Portrait monogram, clay end |
| `--night-ink` on `--sage` | 6.87:1 | 3:1 | pass | Portrait monogram, sage end |

### What was built

- **Tokens** (`app/globals.css`, second `:root` block; existing names and values untouched): all docs/33 §2 colors, `--shadow-1..3`, `--r-sm/md/lg/pill`, `--t-quick/base/calm/breath`, plus type tokens `--font-sans`, `--font-serif`, `--text-12…--text-56`, `--leading-body`, `--leading-display`, `--tracking-display`, and `--hit-min: 44px`.
- **Reduced motion:** global rule sets every transition and animation to 0.01 ms; elements marked `data-reduced-fade` keep an opacity-only 150 ms fade. `--t-base`/`--t-calm` become `150ms linear`.
- **Motion presets** (`lib/ui/motion.ts`): `springs.press/lift/pop/settle`, `durations` mirroring the CSS tokens (tested), `reducedFade` (150 ms), `motionTransition(name, reduced)`.
- **Primitives** (`components/ui/`, barrel `index.ts`):
  - `Portrait` sizes 40/64/120/240, radius 10/16/28/28 (28 on a 40 px tile would be a circle), monogram (serif, up to two initials) on a clay→sage gradient, `alt`/`aria-label` "{name}, fictional AI character", falls back to the monogram when the image fails, including failures before hydration.
  - `Chip` 36 px pill with a 44 px hit area, `aria-pressed`, check icon springs in when selected, Space/Enter toggle (native button).
  - `PrimaryButton` 48 px, sage, optional Lucide icon, `loading` + `loadingLabel` (`aria-busy`).
  - Disabled Chip and PrimaryButton use `aria-disabled` (still focusable), a dashed `--surface-sunk` look with `--muted` text (4.82:1), and a visible reason line linked by `aria-describedby`. Prop types require `disabledReason` when `disabled` is set.
  - `PrivateCard`: `--surface-sunk`, dashed border, Lock icon, "Only you see this" heading, labelled `<section>`.
- **Gallery** (`/design-preview`, still development-only): serif candidates; Primary button and Chip (unselected and selected) in all six states, with hover/focus-visible/active forced via `data-preview-state`; an interactive chip group; Portrait sizes and fallbacks; Private card variants. Portrait and Private card are not interactive, so the six interactive states do not apply to them; their variants are shown instead.

## Handoff

- Changed paths and commit(s): `app/globals.css`, `app/layout.tsx`, `app/design-preview/page.tsx`, `app/design-preview/serif-candidates.tsx`, `app/design-preview/primitives-gallery.tsx`, `app/design-preview/gallery.module.css`, `components/ui/{index.ts,labels.ts,portrait.tsx,portrait.module.css,chip.tsx,chip.module.css,primary-button.tsx,primary-button.module.css,private-card.tsx,private-card.module.css}`, `lib/ui/motion.ts`, `tests/unit/{ui-contrast,ui-primitives,ui-tokens}.test.ts`, this record. Commits on `agent/0a-tokens` (see PR).
- Remaining failures/risks:
  - The existing `.button:disabled{opacity:.65}` rule in `globals.css` still breaks UI rule §2 #6. Left alone because restyling existing screens is out of scope; 0E's rule test should list or fix it.
  - The 40 px Portrait monogram is 16 px text at 3.37:1 on the clay end. It is decorative (`aria-hidden`; the name is in `aria-label`), but a sighted reader may find tiny initials faint. Phase 1 could darken the gradient start if that matters.
  - The global reduced-motion rule also cuts transitions on existing screens. Existing CSS has almost none, so layout and screenshots are unchanged.
  - `/design-preview` asks Google Fonts for all three candidates in development only; production loads only Newsreader (self-hosted by `next/font`).
  - Chip check-icon test relies on Lucide's `lucide-check` class name.
  - Live not verified: no human has looked at this on a real device or with a screen reader.
- Proposed shared-file changes (coordinator-owned docs/33; not edited here):
  1. §2 Type: record "Display serif: **Newsreader** (variable, `opsz` axis), chosen October 3 by 0A" and the token names `--font-sans`, `--font-serif`, `--text-{12,14,16,18,22,28,40,56}`, `--leading-body`, `--leading-display`, `--tracking-display`, `--hit-min`.
  2. §2 Color: replace each "(verify)" with the measured ratio from the table above (all pass).
  3. §2 Motion: document `data-reduced-fade` as the opt-in for the ≤150 ms reduced-motion fade, and `lib/ui/motion.ts` presets `press/lift/pop/settle`.
  4. §3 Portrait: radius per size 10/16/28/28. Primary button and Chip: disabled uses `aria-disabled` + reason line (`aria-describedby`), dashed `--surface-sunk`, `--muted` text.
  5. For 0E: gallery forced states use the `data-preview-state="hover|focus|active"` attribute.
- External account action: none
- Next smallest task: 0E UI rule test over `components/**` and `app/**`, expanding the `/design-preview` gallery on top of this.
- Ready for review: yes
- Coordinator integration: pending

The writer owns this handoff; the coordinator records integration and updates STATUS.
Follow [documentation rules](../20-DOCUMENTATION-STANDARD.md) and
[agent/worktree workflow](../19-AGENT-WORKFLOW.md). Do not copy private prompts,
transcripts, credentials, or personal account identifiers into this record.
