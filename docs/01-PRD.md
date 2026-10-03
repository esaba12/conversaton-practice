# Product requirements

## User and job
Initial user: an adult college student who wants to practice expressing something in an upcoming everyday interaction.
Job: rehearse with a plausible counterpart, tolerate an imperfect exchange, and leave with a concrete next step.

## Product promise
Describe a situation and get an editable fictional counterpart and setup for practicing out loud. Situation generation is core scope for the confirmed solo build.
Confirmed interaction: generate the setup and opening, then let the conversation unfold live. Written examples of both sides are outside the current scope.
Do not claim to predict a real person's response or treat anxiety.

## Primary flow
Sign-in is a prerequisite for the entire workspace, including setup generation, persona editing, and practice. The public entry can explain the product and offer sign-in; it does not create practice data.

1. Describe a situation; presets are optional shortcuts and a fallback.
2. Optionally enter a behavioral goal and private preparation notes. If no goal is supplied, the draft suggests one for review.
3. Review and confirm the generated persona, scenario, and concrete goal before starting.
4. Select pace and challenge. Confirm what is visible to the character.
5. Start a live voice session after microphone permission.
6. End voluntarily or at the configured boundary.
7. Optionally reflect, save a takeaway, and approve memory changes. Automated reflection is a scoped enhancement; a short user-written reflection is an acceptable fallback.
8. Close, with an optional real-world next step.

## Required features and acceptance

| ID | Requirement | Acceptance |
|---|---|---|
| P01 | Three presets | Professor, roommate, and declining a request are usable without generation |
| P02 | Situation generation | A new user-described situation produces an editable persona, scenario, goal suggestion when needed, and opening; actual generation must work for MVP acceptance. Manual fallback handles individual failures; no silent invention of real-person facts |
| P03 | Persona editing | Form supports role, style, voice, familiarity, and constraints |
| P04 | Live voice | Five exchanges complete with real ElevenLabs audio |
| P05 | Session controls | Connect state, mute, End, permission failure, and recovery from a failed connection; a repeat-practice shortcut is optional |
| P06 | Profile | Explicit goals and pace preferences persist for current authenticated user |
| P07 | Memory | Up to two proposed changes with approve/edit/dismiss and source evidence |
| P08 | Reflection | Optional brief self-reflection and next step; if automated, report an observed action only when supported by sufficient evidence, otherwise say evidence is insufficient; no score |
| P09 | Exit | End releases microphone and stops future playback |
| P10 | Privacy | App storage preference visible; memories and sessions can be deleted |
| P11 | Character consistency | Counterpart follows role and constraints without unsolicited coaching |
| P12 | Ownership | Another browser identity cannot access or change the user's records |
| P13 | Required sign-in | All workspace pages and generation/data/session APIs require verified identity; expired sessions fail closed; sign-out or detected expiry ends audio and clears transient private content |

## Defaults
- Default duration: 3 minutes; user may choose 3 or 5 minutes.
- Challenge: supportive, neutral, mild pushback. Neutral default.
- Pace: patient or conversational. Patient default.
- Transcript visibility: optional live captions; collapsed by default.
- Save mode: ask before saving. Full transcript persistence is not offered in MVP.
- Default identity: a signed-in account. Cognito is the recommended AWS provider; no anonymous workspace or guest-first practice.
- Fresh sessions: use approved profile/persona settings without importing prior simulated conversations.

These are prototype UX decisions, not clinical prescriptions.

## Success criteria
Engineering: complete and repeatable core flow; no critical failures in the evaluation matrix.
Product: participants can explain what the app does, recognize a meaningful persona edit, and control saved memory.
Exploratory feedback: did practice feel plausible, useful, and finite? Did the user want more reassurance or feel able to stop?
Do not present small volunteer feedback as clinical evidence.

## Out of scope
Medical advice, diagnosis, treatment plans, children, abusive/traumatic scenario reenactment, voice cloning, real-person predictions, social scores, automated contacting, group roleplay, branching trees, native mobile, payments, therapist dashboard, and custom model training.

## Change control
A new feature must either improve the tested core conversation or replace an existing task. Record changes in 00-DECISIONS-AND-VIABILITY.md and update affected contracts. Do not let a stretch feature displace session teardown, ownership, or memory approval.

## First stretch: text-message rehearsal
Deferred for the solo MVP. Only after all core gates pass and submission preparation is covered, consider an opt-in Photon Spectrum iMessage channel. Users practice texting the same configurable fictional counterpart. Explicit start/end and bounded turns replace an always-open companion. Approved persona/profile preferences are shared; voice and text transcripts are isolated. Reflection and memory review remain in the web app. See [Photon specification](17-PHOTON-TEXT-PRACTICE.md) for acceptance and go/no-go gates. This does not expand the mandatory voice MVP.
