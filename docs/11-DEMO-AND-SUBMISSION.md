# Demo and submission

## Positioning
The app lets people practice a conversation they have been putting off with an editable fictional counterpart. The other person is fictional. Do not claim to predict anyone real.

The product is **SpeakEasy**. The demo link is https://speakeasyapp.tech (also https://conversation-practice-zeta.vercel.app). The static preview at conversation-practice-site.vercel.app is not the demo. Paste-ready Devpost fields, the science-fair pitch and an optional two-minute video script are in [DEMO-01](tasks/DEMO-01-submission-prep.md).

Main track: Actually Intelligent. Sponsor prizes: Best Project Built with ElevenLabs and the .Tech domain prize. The rules allow one main track and any number of sponsor prizes. See [event strategy](16-MHACKS-STRATEGY.md).

## Pitch
Judging is science-fair style at the table, so the pitch is a two- to three-minute walk-through per judge. It goes: hook, briefing with a goal and a hard-moment line, an optional Show me first, a live call with one interruption, the recap and "Try that moment once," a saved person's sharing (the theme beat), then the stack. The full script with rubric mapping and likely questions is in [DEMO-01](tasks/DEMO-01-submission-prep.md).

The October 3 three-minute staged pitch (generated situation, edit, call, reflection, Your data) is kept as superseded in DEMO-01.

## What makes the demo strong
Believable behavior is the main demonstration: the counterpart reacts to what the user says, stays in character, and accepts interruptions. Show realistic pushback without escalating into abuse. A visibly separate private goal illustrates the context boundary; the character must not know it unless the user expresses it aloud or explicitly shares it.

Saving a person and sharing About-me facts are explicit. The model must not infer permanent facts about a real person from roleplay. Reflection does not write memory. Full script, backup shot list, Devpost drafts and claims we must not make: [DEMO-01](tasks/DEMO-01-submission-prep.md).

## ElevenLabs contribution
Explain real-time voice interaction, expressive delivery, turn-taking, selected voices, and per-session persona configuration. The contribution should be audible and visible. Do not add unrelated API calls to inflate integration count.

## Technical contribution
- Typed persona and public/private context allowlists.
- Separate roleplay and reflection paths.
- Versioned saved people and per-person sharing of About-me facts (explicit Save after End; no automatic memory writes).
- Deterministic session teardown and microphone release.
- Tested owner isolation and honest no-app-save behavior.

## Claims and evidence
Describe a working rehearsal prototype, not clinical efficacy, prediction of a real person's response, or a market first. State only actual tests performed and outcomes observed. Never claim a mock, prerecorded voice, or scripted playback is live inference. Live-checked: the October 3 G1 and G2 calls, and the owner's October 4 ~10:23 AM run of saved Jordan, Show me first, the call, recap, one retry and Alex's look ("it all worked," not itemized, before the redesign deployed). Sharing, chip tone, Your data and video loss are automated only. Do not claim instant global erasure of provider copies. Full do-not-claim list: [DEMO-01](tasks/DEMO-01-submission-prep.md).

## Backup
Record a real working session using fictional data. Clearly label prerecorded material. Bring a headset and charged laptop. A local frontend still needs network access for provider calls.

## Submission and judging
Re-read October 4, ~11:10 AM from the [Devpost rules](https://mhacks-2026.devpost.com/rules) and the [live schedule](https://www.mhacks.org/live). Submit on Devpost by **noon**. The schedule shows "Submissions Close @12 PM" from 11:30, and the Devpost banner says 12:15, which we do not rely on. The submission must include code access (the public GitHub repository). Judging is **1:00–3:00 PM in the Duderstadt Basement**, in person and science-fair style. Stay at your table for the whole period.

Rubric: Innovation, Technical Complexity, Usability, and Adherence to Theme ("build something that grows"). No weights are published.

## Checklist
Execution steps, including the push of local polish and the backup recording, are [SUB-01](tasks/SUB-01-submission-execution.md). Pitch copy stays in [DEMO-01](tasks/DEMO-01-submission-prep.md).

- [x] Coding/building occurred during the hackathon.
- [ ] Actually Intelligent selected as the main track.
- [ ] Best Project Built with ElevenLabs and the .Tech domain prize checked.
- [ ] No Figma, Notability, Gemini, Photon or Relay entries; none are in the build.
- [ ] Try-it-out links: https://speakeasyapp.tech and the GitHub repository.
- [ ] No keys or private user data in screenshots, logs, or demo.
- [ ] Submission confirmation kept, before noon.
- [ ] Demo account reset with `scripts/demo/seed.mjs --checkin` before judging.
- [ ] Only claim the live checks listed above.

Sources: S35-S38 in [sources](14-SOURCES.md).

## Photon extension if implemented
Keep the main pitch inside three minutes. For sponsor judging, demonstrate a real iMessage exchange with the configured fictional roommate, then End and open web reflection. Explain shared approved preferences and isolated session histories. Show actual Spectrum usage in the submission. Do not add Photon to the tools/prize entry as a working integration unless the real round trip works. A separate 20-30 second recorded text demonstration can support Q&A without displacing the core live voice exchange.
