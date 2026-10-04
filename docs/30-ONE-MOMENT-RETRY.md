# One-moment retry

Decided October 3, 2026, 21:26 EDT. Not built. Rationale is in [docs/00](00-DECISIONS-AND-VIABILITY.md).

Where this file conflicts with an older "repeat the practice" or "one more take" note, this file wins. Scores, a recording of the user, a transcript replay, and a branching tree stay out (docs/08).

## What the user can do

Before the call, they keep the goal they already have: one thing they will say or do. They may also write one line for the hard moment, for example "When they sound disappointed, I will acknowledge it once and repeat what I need." They may turn on "They may sound disappointed" so the counterpart can hit that moment during the call.

After End, if they wrote that line, they answer "Did you say it?"

- **Yes.** The retry offer stays hidden. The existing reflection can still run.
- **Not sure.** Copy: "There isn't a clear moment to redo. You can stop here." The retry offer stays hidden.
- **No.** Offer "Try that moment once." If they accept, they see a short opening line, can edit it, and start a new call. The counterpart opens with that disappointment. They say the line they planned and press End.

After that second End, show one sentence: "You tried the line you planned. You can stop here." Do not offer another retry.

Skipping the hard-moment line leaves today's flow unchanged. Nothing here is required to finish a practice.

## What to say

Suggest actions. Use lines like these, which the user can edit:

- "When they sound disappointed, I'll say I get that, and repeat what I need once."
- "I'll say no once. If they push, I'll repeat it without a new reason."
- "I won't add an apology after I ask."

Do not suggest "stay calm," "don't feel guilty," "get a yes," or "don't cave." Those judge the person, name a feeling, or depend on the other person agreeing.

The disappointed opening the retry suggests: "I'm already stretched thin. I don't know why this has to be a thing right now." The user can edit it before the second Start. It stays inside the existing opening limit of 300 characters. The counterpart may sound unhappy and still stays civil: no threats, insults, or guilt trips (docs/08).

The skill being practiced is acknowledging the feeling and keeping the request. "I hear that you're frustrated. I still need the dishes done tonight." Do not coach the user to ignore the other person's feelings.

Button and prompt copy: "When it gets hard, what will you say?", "They may sound disappointed", "Did you say it?", "Try that moment once", "You can stop here."

## What already exists

Use these. Do not replace them.

- The goal is one string, 1–200 characters, optional on the draft request. If the user omits it, setup suggests one concrete action. It is reflection metadata. It is not part of the counterpart role. See `lib/schemas/draft.ts` and `lib/setup/prompt.ts`.
- A reviewed start, a preset start, and a saved-person start send no goal and no private notes (`lib/session/api-client.ts`).
- Reflection already accepts an optional goal and returns "What you did", "Takeaway", and "Next time", with no score (`lib/schemas/reflection.ts`, `lib/reflection/prompt.ts`).
- Duration on a start is only 180 or 300 seconds, in the request schema, the acquire RPC, and the Tavus `max_call_duration`. Do not add a 60- or 90-second duration. A retry uses 180. The user ends when they have said the line. The three-minute cap is the backup.
- Challenge stays the user's choice: supportive, neutral, or mild pushback. This feature does not raise it.
- Each practice starts fresh. The retry is a new session with a new idempotency key. It does not import the first transcript.

## Build in this order

1. **Hard-moment line on review.** Optional field, 1–200 characters after trim, next to the existing goal. Offer the three suggestions above as chips that fill the field; the user can edit the result. Keep it in browser memory with the goal. Omit it from every start body, the same way the goal is omitted. Clear it on a new setup, sign-out, auth loss, and page hide.
2. **Disappointed beat, only if checked.** A review checkbox, off by default, labeled "They may sound disappointed." When it is on, add one visible constraint to the reviewed role before Start: "At some point, sound disappointed or worried. Stay civil. Do not threaten, insult, or try to make them feel guilty." The user sees that constraint and can remove it. It counts toward the existing cap of five constraints. When the box is off, add nothing. The checkbox state is not its own API field.
3. **Self-check after End.** Render it only when the hard-moment line is non-empty and the call did not take the support-exit path. Three buttons: Yes, Not sure, No. This is client state. Do not send it to reflection or to a new model call. Yes and Not sure hide the retry. No shows "Try that moment once." If the user was already offered a retry in this sitting, do not show it again.
4. **The retry call.** On accept, show the suggested opening and let them edit it, then start with the same reviewed role except `opening` is that line and `durationSeconds` is 180. Preset and saved-person starts do this too: resolve the role the same way a normal start does, then replace the opening. New idempotency key. The body still has no goal, no hard-moment line, no private notes, and no transcript. End, mute, captions, and teardown behave as they do today. On the second End, show the one closing sentence and hide any further retry. Skip stays available. A second reflection request is optional and uses the existing route; do not require it.
5. **Reflection wording.** In `lib/reflection/prompt.ts`, add one rule: describe one observable action toward the goal, or say the evidence is insufficient. Do not judge whether the user gave in, and do not name a personality or a score. Bump `REFLECTION_PROMPT_VERSION`. No new response field.

## Leave these out

- Detecting from the transcript that the user gave in, and rewinding when a model says so.
- A score, a grade, a streak, or a "you failed" state.
- Playback of the first call, a transcript scrubber, or stored turns for this feature.
- A tree of alternate lines, a mid-call hint, or an automatic increase in challenge.
- A third take in the same sitting. Point back to "You can stop here."
- A new duration value, a migration, or a new table. The line, the checkbox, and the self-check are transient.
- Sending the hard-moment line to the counterpart. The counterpart does not learn the user's plan.

## Acceptance

When someone builds this, these are the checks. None of them have been run.

1. With the hard-moment field empty, review, the call, End, and reflection match today's flow, including no retry control.
2. A start request for a reviewed role, a preset, and a saved person still contains no goal and no hard-moment line. Unit test the client body the same way goal omission is tested now.
3. Checking "They may sound disappointed" puts the civil constraint into the role the user reviews. Unchecking it, or deleting the constraint, leaves the role without that sentence.
4. After End, Yes and Not sure render no retry. No renders one. After the retry's End, the retry control is gone.
5. A support-exit result hides the self-check and the retry.
6. The retry start uses a new idempotency key, duration 180, and the opening the user just confirmed. A second retry control never appears.
7. End on both calls still releases the microphone and any camera, and clears the hard-moment line when the user leaves or signs out.
8. Reflection JSON still has no score field. The prompt fixture rejects judging the user for giving in.

Live video of the retry stays "live not verified" until a person runs it. A passing unit test does not establish that the counterpart sounded disappointed or that the user could end cleanly.
