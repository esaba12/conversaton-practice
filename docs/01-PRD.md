# Product requirements

Confirmed user correction (October 3): FaceTime-style practice with a visible talking AI counterpart is the product's core draw. Real, responsive counterpart video synchronized with speech is mandatory; voice-only practice or a static portrait cannot pass G1. This supersedes the former blanket avatar exclusion. Tavus CVI with ElevenLabs TTS is selected, with live behavior pending verification; see [live video contract](22-LIVE-VIDEO.md).

## User and job
Initial user: an adult college student who wants to practice expressing something in an upcoming everyday interaction.
Job: rehearse with a plausible counterpart, tolerate an imperfect exchange, and leave with a concrete next step.

## Product promise
Describe a situation and get an editable fictional counterpart and setup for practicing in a live video call. Situation generation and a visible talking counterpart are core scope for the confirmed solo build.
Confirmed interaction: generate the setup and opening, then let the conversation unfold live. Written examples of both sides are outside the current scope.
Do not claim to predict a real person's response or treat anxiety.

## Primary flow
Sign-in is a prerequisite for the entire workspace, including setup generation, persona editing, and practice. The public entry can explain the product and offer sign-in; it does not create practice data.

1. Describe a situation; presets are optional shortcuts and a fallback.
2. Optionally enter a behavioral goal and private preparation notes. If no goal is supplied, the draft suggests one for review.
3. Review and confirm the generated persona, scenario, and concrete goal before starting.
4. Select pace and challenge. Confirm what is visible to the character.
5. Start a live video practice call after microphone permission. The fictional counterpart occupies the main video view. An optional local self-view starts only after the user enables their camera.
6. End voluntarily or at the configured boundary.
7. Optionally reflect, save a takeaway, and approve memory changes. Automated reflection is a scoped enhancement; a short user-written reflection is an acceptable fallback.
8. Close, with an optional real-world next step.

## Required features and acceptance

| ID | Requirement | Acceptance |
|---|---|---|
| P01 | Three presets | Professor (Ellis, office hours for one assignment), roommate (Alex, dishes), and declining a request (Sam, a classmate's weekend favor) open a labeled example review without generation. An unedited example start sends only the preset id |
| P02 | Situation generation | A new user-described situation produces an editable persona, scenario, goal suggestion when needed, and opening; actual generation must work for MVP acceptance. Manual fallback handles individual failures; no silent invention of real-person facts |
| P03 | Persona editing | Form supports role, style, voice, familiarity, and constraints. G3: categorical trait chips (tone, formality, talkativeness, familiarity) plus short text fields. Face and voice stay the single stock pair during G3; a preset catalog is decided for later (docs/00) |
| P04 | Live video conversation | Five responsive exchanges complete with real ElevenLabs audio and synchronized talking-counterpart video; interruption stops the superseded speech and matching speaking animation; voice-only, a static portrait, or prerecorded replies cannot pass |
| P05 | Session controls | Connecting/live/interrupted states, separate mic mute and camera toggle, persistent End, permission failure, and recovery from failed audio/video connection; a repeat-practice shortcut is optional. If that shortcut is built, use the one-moment retry in [docs/30](30-ONE-MOMENT-RETRY.md). It is decided and not built, and it is not part of the current submission |
| P06 | Profile | Explicit goals and pace preferences persist for current authenticated user. **G3 (docs/26):** an About-me list of short shareable facts persists for the user; private preparation notes are a separate section that can never be shared |
| P07 | Memory | Up to two proposed changes with approve/edit/dismiss and source evidence. **G3 (docs/26):** replaced for the MVP by an explicit "Save this person / Update" step after End; reflection-generated proposals are optional in G4 or later |
| P14 | Saved people and sharing | Users save the people they practice with as editable personas (chip editor plus short fields), choose by drag and drop (with a keyboard path) which About-me facts each person knows, and start a fresh practice with a saved person that uses only those shared facts. See docs/26 |
| P08 | Reflection | Optional brief self-reflection and next step; if automated, report an observed action only when supported by sufficient evidence, otherwise say evidence is insufficient; no score |
| P09 | Exit | End stops future audio/video playback, closes provider sessions, releases microphone and any active local camera tracks, and ignores late media events |
| P10 | Privacy | App storage preference visible; memories and sessions can be deleted |
| P11 | Character consistency | Counterpart follows role and constraints without unsolicited coaching |
| P12 | Ownership | Another browser identity cannot access or change the user's records |
| P13 | Required sign-in | All workspace pages and generation/data/session APIs require verified identity; expired sessions fail closed; sign-out or detected expiry tears down all media and clears transient private content |

## Defaults
- Default duration: 3 minutes; user may choose 3 or 5 minutes.
- Challenge: supportive, neutral, mild pushback. Neutral default.
- Pace: patient or conversational. Patient default.
- Transcript visibility: optional live captions; collapsed by default.
- Camera: off until explicit opt-in. A local-only self-view is the implementation default, not a separate confirmed user requirement. No user camera frames are sent, analyzed, or recorded in the MVP; the counterpart responds to speech.
- Main view: a large, clearly fictional, live talking counterpart. An explicit audio-only fallback may support recovery, but never counts as the required video integration.
- Save mode: ask before saving. Full transcript persistence is not offered in MVP.
- Default identity: a non-anonymous Supabase Auth account; no anonymous workspace or guest-first practice.
- Fresh sessions: use approved profile/persona settings without importing prior simulated conversations.

These are prototype UX decisions, not clinical prescriptions.

## Success criteria
Engineering: complete and repeatable core flow; no critical failures in the evaluation matrix.
Product: participants can explain what the app does, recognize a meaningful persona edit, and control saved memory.
Exploratory feedback: did practice feel plausible, useful, and finite? Did the user want more reassurance or feel able to stop?
Do not present small volunteer feedback as clinical evidence.

## Out of scope
Medical advice, diagnosis, treatment plans, children, abusive/traumatic scenario reenactment, voice cloning, real-person predictions, social scores, automated contacting, group roleplay, human-to-human calling, camera-frame analysis/transmission/recording, branching trees, native mobile, payments, therapist dashboard, and custom model training.

## Change control
A new feature must either improve the tested core conversation or replace an existing task. Record changes in 00-DECISIONS-AND-VIABILITY.md and update affected contracts. Do not let a stretch feature displace session teardown, ownership, or memory approval.

## Text-message rehearsal
Implemented on this branch, not merged, and not live-verified. It stays unmerged until a real iMessage round trip. The live video call remains the demo. No Photon line, webhook, or domain delivery has succeeded. Photon Spectrum is the iMessage channel for the same fictional counterpart. The user links a mobile number on the website first. Text then starts from the review screen or from an in-thread picker card. Explicit start and end, a turn cap, and no messages after close replace an always-open companion. Approved persona settings are shared. Video and text transcripts stay isolated. Reflection and memory review remain on the website. See [docs/17](17-PHOTON-TEXT-PRACTICE.md). This does not expand the mandatory video-call product, and it does not add a phone-call channel.
