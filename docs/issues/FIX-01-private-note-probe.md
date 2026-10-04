# FIX-01: Catch more private-note leaks in generated setups

GitHub issue: [#27](https://github.com/esaba12/conversaton-practice/issues/27)

Who: one coding agent. Priority: high (privacy promise shown in the UI). Gate: G5 follow-up.
Source: [REV-01](../tasks/REV-01-g5-privacy-review.md) should-fix 1. Requirements: P02, T03 (private notes never reach counterpart context).

## Problem

The describe form tells the user private notes are never shared with the character (`components/presentation/setup-describe.tsx`). The notes go to the setup model only, and the server rejects a generated role that copies them. That check is weak.

`leaksPrivateNotes` in `lib/setup/generate.ts` (lines 49–59) flags a role only when one field contains **five consecutive** normalized words of the notes, or the whole note if it is shorter. It misses:

- a shorter excerpt (3–4 words) from a longer note
- the same words split across two fields
- a single distinctive detail, such as a name ("Priya") or a number ("$400"), that appears only in the notes

Anything it misses becomes the editable role. Start sends that role to Tavus as counterpart context.

## Required change

Replace the check with a stricter deterministic one. Suggested design (you may improve it if the acceptance tests pass):

1. Change the signature to `leaksPrivateNotes(role, privateNotes, situation)`. Words that also appear in the situation are legitimately shared and must not trigger a flag.
2. Join all counterpart string fields (`name`, `role`, `style`, `publicContext`, `opening`, each `constraints` entry) with a space into one normalized text, plus check each field on its own.
3. Flag if that text contains any **3-word window** of the notes, except windows made only of stopwords (keep a short local list: i, me, my, you, the, a, an, to, and, of, it, is, that, they, them, be, will, do, don, t, s, not, want, like, just, about, feel, really) or windows that also occur in the situation.
4. Flag if the role contains a **distinctive note token** that does not appear in the situation: any token containing a digit, or a word capitalized in the original notes that is not the first word of a sentence (likely a proper noun).
5. Keep today's behavior on a flag: discard the attempt, retry once, then return `PROVIDER_UNAVAILABLE` (`generateDraft`, lines 96–104).

Do not probe `goal` or `assumptions`. They are shown only to the user and are not sent to the counterpart (REV-01 accepted risk 4). Do not add a model call to detect paraphrase.

## Owned files

- `lib/setup/generate.ts`
- `tests/unit/setup-generate.test.ts`
- `docs/07-PROMPTS.md` line 21 ("Server backstop: … five consecutive words …"): update the sentence
- `docs/tasks/FIX-01-private-note-probe.md` (new, from the template)

Do not edit `lib/setup/prompt.ts` unless you also bump `SETUP_PROMPT_VERSION` and say why in the handoff.

## Acceptance

Unit tests in `tests/unit/setup-generate.test.ts`, using fictional text:

- [ ] Existing five-word copy is still flagged.
- [ ] A 3-word excerpt from a 30-word note is flagged.
- [ ] A copy split across the end of `style` and the start of `publicContext` is flagged.
- [ ] A name or a number that appears only in the notes is flagged when it appears in the role.
- [ ] Words shared with the situation do not flag. Example: situation "My roommate never does the dishes", notes "Honestly the dishes thing makes me feel invisible", role mentioning "the dishes" is **not** flagged.
- [ ] Stopword-only windows do not flag ("I don't want to" in notes and role).
- [ ] No notes → never flagged.
- [ ] `generateDraft` with a mocked `fetch` that leaks twice returns `PROVIDER_UNAVAILABLE`; leaks once and then returns a clean role → returns the clean role.
- [ ] `npm run typecheck`, `npm test`, `npm run build` pass.

## Not in scope

Changing the review UI, the start request, the goal echo, or adding a second model provider. No live OpenAI call is required; if the coordinator wants one, it runs it.
