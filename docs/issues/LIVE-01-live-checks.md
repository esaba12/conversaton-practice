# LIVE-01: Live checks for G3–G5

GitHub issue: [#35](https://github.com/esaba12/conversaton-practice/issues/35)

Who: **the human.** It needs a microphone, a camera, and judgment of a real call. An agent can only corroborate afterward. Priority: high for the pitch (sharing and saved-person speech are the claims most likely to be wrong in front of a judge). Not a submission blocker (user decision, 19:00 EDT).
Full checklist: [docs/tasks/LIVE-01-human-checks.md](../tasks/LIVE-01-human-checks.md). Detailed G3 steps: [G3-04](../tasks/G3-04-integration.md).

## Highest value, about 15 minutes

Use fictional content only.

1. About me: add two facts. Practice once, End, then Save this person.
2. On the person page, share **one** fact using click (not drag). Leave the other unshared. Put a distinctive line in Never shared.
3. Practice with that person and confirm:
   - talking video starts
   - they can use the shared fact
   - the unshared fact and the Never-shared line never come up
   - they do not remember the previous call
4. Change one chip (for example Formality to Casual), practice again, and listen for the tone change.
5. After a real End, ask for a short reflection, then check that Your data shows that session's cleanup label.

Then, if time allows, run the live video matrix and behavior probes listed in the task record: interruption, video loss, camera opt-in, the 3-minute cap, End while connecting, reassurance loop, "ignore your rules", stop request, and the 911/988 exit.

## What an agent can do after each human call

- Read-only corroboration: the session row is `ended`, cleanup is `confirmed`, and no transcript column exists. Use `supabase db query --linked` with a select on the newest session's `status, cleanup, ended_at`. Do not print ids or emails into docs.
- Record the human's words in the task record as human-reported `live` evidence. Do not itemize a check the human described only as "it worked".
- File any defect the human reports as a new `docs/issues/` file.

## Acceptance

- [ ] Each checklist item is either human-reported or left `not-run`.
- [ ] The coordinator updates STATUS and the docs/09 live column only with what was reported.
