# X: Recap loop (2A + 2B combined)

Status: assigned
Updated: October 4, 2026
Assigned writer: X worker subagent (claude-opus-5-thinking-high)
Coordinator: wow-pass coordinator (main checkout)
Gate: Compressed finish (docs/next/02-BUILD-PLAN.md §1a)
Requirements/tests: docs/next/02-BUILD-PLAN.md §1a and §4 2A/2B; docs/30-ONE-MOMENT-RETRY.md; docs/32-FEATURE-SPECS.md L1, L3 (wording only), Q2, A1; docs/next/04-NEW-SPECS.md W4 (after), W7
GitHub issue: (coordinator creates)
Pull request: none yet

## Assignment and isolation

- Base: `main` `0106445`. Branch `agent/x-recap-loop`; worktree `.worktrees/x`; dev port 3106.
- Owned: `components/practice/recap*.tsx` (+ CSS), `components/presentation/reflection-*`, `lib/practice/flow.ts` (retry stages), `lib/reflection/**`, `lib/schemas/reflection.ts`, `app/api/sessions/[id]/reflect/route.ts`, `app/api/sessions/[id]/alternative/route.ts` (if A1 needs it), `app/design-preview/recap/page.tsx`, tests, this record.
- Not owned (propose exact diffs): `app/practice/practice-workspace.tsx`, `lib/session/**`, other schemas, migrations, package files, numbered docs, STATUS.md.
- Feedback style arrives as a validated enum in the reflect request (stored on the device by slice Y); no database change.

## Scope and acceptance

- [ ] docs/30 acceptance 1–8 and the L1 list; reflection starts after a 1.5 s grace with Skip.
- [ ] Retry start uses the reviewed role with `opening` replaced; no goal, hard-moment line or transcript in the body.
- [ ] W4 after (fear recall, Happened/Partly/Didn't, second slider, side-by-side numbers, "Your numbers, not a score.") in browser memory only; W7 staging; "How {name} was played" closed by default, chips only.
- [ ] `quotedLine` is a verbatim substring of a user turn or null (server-enforced), never counterpart text; feedback style changes wording only (fixtures for all three); A1 one alternative on request only; no score fields; prompt version bumped.

## Handoff

(writer fills in)
