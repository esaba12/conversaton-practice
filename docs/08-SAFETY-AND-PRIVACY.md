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
Tavus CVI, ElevenLabs TTS and the configured model providers process conversation data. Tavus receives the server-held ElevenLabs key for the selected speech integration. Optional camera stays local and off until opt-in: no publication, recording, analysis or claim that the counterpart sees it. Recording-off does not disable Tavus transcripts; Tavus hard deletion does not establish ElevenLabs erasure. Track provider-specific deletion status. See docs/22-LIVE-VIDEO.md. The separate setup/reflection provider may receive text. Supabase stores identity and approved app data. No-app-save does not mean anonymous processing, zero provider retention or account deletion.
Do not use therapy transcripts or actual third-party voice samples for the demo.
Default application policy: temporary transcript in memory, approved memories only in database; no raw camera/video recordings. The small session/cleanup records required for authorization are documented separately.
Provider policy: set minimum supported transcript/audio retention, review audio recording and training-use settings, and document actual choices.

ElevenLabs documentation states a two-year conversation-data retention default with configurable periods (S12). Zero Retention Mode availability and compatible model requirements must be checked on the actual account; do not assume a free account has every privacy feature (S13).
OpenAI store:false avoids creating a stored response object where supported; it is not by itself a promise of zero provider logging. Consult current provider data policies before public sensitive-data use.

## Deletion truthfulness
Show separate app, avatar-provider, and conversation-provider deletion states. Stopping a provider session is not proof of deleting its retained data. Never claim instant deletion across all providers from deleting a Postgres row.
Keep only a minimal protected deletion job/tombstone until provider cleanup finishes, then remove it.
If a processor has retention beyond app control, disclose it rather than implying guaranteed immediate erasure.
Private rehearsal mode means no lasting application memory, with processor behavior separately explained.

**As built (G4):** `/practice/data` shows each session's Tavus cleanup state ("Deleted at provider" only when the conversation was verified ended and hard-deleted; otherwise pending or not confirmed, with Retry cleanup through the idempotent End route). It says ElevenLabs copies are not tracked by this app and that OpenAI setup/reflection requests use `store: false` while provider retention may still apply. "Delete all practice data" removes people, shared-fact links, About-me facts and private prep through owner RPCs and reports anything remaining. Session metadata rows (status, cleanup and times; no content) are kept, and the Auth account is not deleted. The reflection transcript is held only in browser memory and sent once per request to OpenAI. It never enters counterpart context and is never stored or logged. The support-exit message names US resources (911, 988), which fits the MHacks demo; other regions are not covered.

## Release boundary
A supervised hackathon demo may use fictional data and a test account. Public use requires abuse controls, reviewed disclosures, retention settings, owner-isolation checks, and a reviewed support-exit flow. No automatic public deployment is authorized by this spec.
