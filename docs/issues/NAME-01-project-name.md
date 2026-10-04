# NAME-01: Apply a project name

**Applied October 4, 2026.** The owner chose **SpeakEasy**. Wordmark, document title, README, static preview, and the Devpost draft title use it. `package.json` `name` and the GitHub repository stay `conversation-practice` / `conversaton-practice`.

GitHub issue: [#34](https://github.com/esaba12/conversaton-practice/issues/34)

Who: **the human picks the name.** Then one agent applies it. Agents do not invent a name. Priority: low. Skip it if the name arrives after the pitch rehearsal.
Existing record: [docs/tasks/NAME-01-project-name.md](../tasks/NAME-01-project-name.md).

## Rules for the name

It must not say or imply therapy, diagnosis, or prediction of real people's reactions (AGENTS.md mission).

## Agent steps after the human gives the name

The string "Conversation practice" currently appears in:

- `components/site/wordmark.tsx`
- `components/presentation/workspace-header.tsx`
- `components/presentation/practice.tsx`
- `components/presentation/practice-preview.tsx`
- `app/layout.tsx` (document title / metadata)
- `README.md`

Re-run `rg -n "Conversation practice" app components lib README.md` before editing in case this list changed. Replace the product name only where it is used as the name, not where it is ordinary text ("a conversation practice tool").

Also update:

- [DEMO-01](../tasks/DEMO-01-submission-prep.md) Devpost title and pitch lines
- `docs/00-DECISIONS-AND-VIABILITY.md` ("the project remains unnamed")
- tests that assert the old wordmark or title (`rg -n "Conversation practice" tests`)

Leave `package.json` `name` and the GitHub repository name unchanged.

## Acceptance

- [ ] Wordmark, document title, README, and the DEMO-01 Devpost title all match.
- [ ] `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:ui` pass (one `test:ui` run at a time).
- [ ] Update `docs/tasks/NAME-01-project-name.md` with the evidence.
