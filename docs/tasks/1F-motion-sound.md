# 1F: Motion and synthesized sound (docs/33 morph, R7)

Status: assigned
Updated: October 4, 2026
Assigned writer: 1F worker subagent
Coordinator: wow-pass coordinator (main checkout)
Gate: Wow pass Phase 1 (after the hero-path checkpoint)
Requirements/tests: docs/next/02-BUILD-PLAN.md §3 1F; docs/33 (motion, reduced motion, morphs); R7 in docs/next/04-NEW-SPECS.md or docs/32; node_modules/next/dist/docs/01-app/02-guides/view-transitions.md
GitHub issue: https://github.com/esaba12/conversaton-practice/issues/65
Pull request: none yet
CI run: not run

## Assignment and isolation

- Base ref: `main` `a6a1a9a`.
- Branch: `agent/1f-motion-sound`; worktree `/Users/ethansaba/code/therapist/.worktrees/1f`; dev port 3105.
- Owned: `components/practice/transitions.tsx`, `lib/practice/sound.ts`, `components/practice/sound-toggle.tsx`, a one-line mount of the toggle in `app/practice/about-me/about-me-workspace.tsx`, a design-preview route `app/design-preview/motion/page.tsx`, tests, this record.
- Not owned (propose exact diffs in Handoff): `app/practice/practice-workspace.tsx` (stage wrappers and sound cues), `next.config.*` (if a ViewTransition flag is needed), `lib/ui/motion.ts`, call/meet/lobby components, `package.json`/lockfile, numbered docs, STATUS.md.
- Shared resources: no provider calls, no live calls, no migrations, no dependency changes, no pushes to main.

## Scope and acceptance

- [ ] card → briefing → ringing → call → recap morphs with React `<ViewTransition>` (check the installed Next/React docs and types; do not assume an API).
- [ ] Reduced motion: no morphs; fades ≤150 ms.
- [ ] Ring, connect and hang-up synthesized with Web Audio oscillators and envelopes (no audio files); each ≤1.5 s except ring; ring stops on accept, cancel, error and unmount; the AudioContext is created only after a user gesture and closed on teardown.
- [ ] "Sounds" toggle on About me, stored in `localStorage` (device only, no migration); no sound when off or on errors.
- [ ] Unit tests for the sound scheduler (stubbed AudioContext) and toggle storage; gallery states for the morphs.

## Handoff

(writer fills in)
