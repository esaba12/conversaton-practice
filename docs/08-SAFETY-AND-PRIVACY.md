# Safety, boundaries, and privacy

## Intended use
A prototype for adults rehearsing ordinary conversations. It is not therapy, medical advice, a crisis service, or a predictor of how real people will behave. Clinical review and a separate validation process are prerequisites for treatment claims.

NICE and CCI identify self-focused attention, safety behaviors, and excessive processing around social events as relevant to social anxiety. Our design choices are informed by this guidance, not clinically proven by it. Sources S05-S06.

## Avoid designing a rumination loop
- Start with a concrete action goal.
- Use a bounded session and one short reflection.
- Do not add social grades, perfection streaks, leaderboards, or sentence-by-sentence criticism.
- No replay tree in MVP.
- Do not increase challenge automatically.
- Repeated reassurance requests receive acknowledgment of uncertainty and an offer to close or choose an action, not stronger guarantees.
- Let the user end without completing a goal.
- Do not require anxiety to disappear before finishing.
- Progress is the user's chosen action, not engagement time.
- Do not reveal fictional hidden thoughts as if they explain real people's behavior.

## Content scope
Support everyday requests, disagreement, introductions, boundaries, and asking for help.
For requests to reenact abuse, trauma, or humiliation, do not improvise an escalating roleplay; explain the prototype's scope and offer an ordinary communication scenario.
The user can set supportive/neutral/mild-pushback difficulty. Mild pushback never means threats, slurs, or cruelty.

## Immediate support exit
If explicit imminent self-harm, violence, or immediate danger emerges, stop the scene and clearly leave character. Provide brief supportive wording and encourage appropriate human/emergency help for the person's location. Do not invent local numbers or promise monitoring. This requires test cases, not a claim of perfect detection. A static Help/End control remains available even if the model misses a cue.

## Threat model
1. Private notes leak into the character prompt.
2. One user's memory appears in another's session.
3. Persona input attempts to override boundaries.
4. Transcript instructions trigger database writes.
5. Deleted session is recreated by delayed reflection/webhook.
6. A secret is bundled into browser JavaScript.
7. Provider retains content despite local deletion.
8. Roleplayed reactions become beliefs about actual people.

Mitigations: typed allowlists, owner checks + RLS, separate prompts, no live mutation tools, deletion tombstones, server secrets, verified retention settings, provenance checks.

## Data path disclosure
Audio and text are processed by ElevenLabs and the configured model providers. The reflection/setup provider may also receive text. The app requires account sign-in; AWS stores account/approved app data. No-app-save practice does not mean anonymous processing or zero provider retention, and does not remove the sign-in account.
Do not use therapy transcripts or actual third-party voice samples for the demo.
Default application policy: temporary transcript in memory, approved memories only in database.
Provider policy: set minimum supported transcript/audio retention, review audio recording and training-use settings, and document actual choices.

ElevenLabs documentation states a two-year conversation-data retention default with configurable periods (S12). Zero Retention Mode availability and compatible model requirements must be checked on the actual account; do not assume a free account has every privacy feature (S13).
OpenAI store:false avoids creating a stored response object where supported; it is not by itself a promise of zero provider logging. Consult current provider data policies before public sensitive-data use.

## Deletion truthfulness
Show separate app and provider states. Never claim instant deletion across all providers from deleting a Postgres row.
Keep only a minimal protected deletion job/tombstone until provider cleanup finishes, then remove it.
If a processor has retention beyond app control, disclose it rather than implying guaranteed immediate erasure.
Private rehearsal mode means no lasting application memory, with processor behavior separately explained.

## Release boundary
A supervised hackathon demo may use fictional data and a test account. Public use requires abuse controls, reviewed disclosures, retention settings, owner-isolation checks, and a reviewed support-exit flow. No automatic public deployment is authorized by this spec.
