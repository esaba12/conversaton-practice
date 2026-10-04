# Demo and submission

## Positioning
The app lets people practice a conversation they have been putting off with an editable fictional counterpart. Lead with the founder's experience of a therapist playing the other person, without claiming to reproduce clinical judgment.

Primary targets: Actually Intelligent and the two listed ElevenLabs categories. See [event strategy](16-MHACKS-STRATEGY.md) for requirements and unresolved eligibility.

## Three-minute pitch
| Time | What to show |
| --- | --- |
| 0:00-0:20 | Personal motivation and one concrete user problem |
| 0:20-0:40 | New generated situation (roommate example only if generation fails); edit one field; private notes stay off the call |
| 0:40-1:55 | Live conversation: counterpart responds on video, user interrupts once, restates the request |
| 1:55-2:15 | End, optional short reflection (or Skip), no automatic save |
| 2:15-2:40 | Your data cleanup label; optional Save this person / sharing — explicit only |
| 2:40-3:00 | Stack (Tavus CVI + ElevenLabs TTS, OpenAI, Supabase, Next.js) and what was actually verified |

Rehearse to finish comfortably inside three minutes. The live exchange should be 60-90 seconds and can be ended early. Test character behavior, but do not require an exact scripted line. A second session showing an edited persona is optional for Q&A, not required in the timed pitch.

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
Describe a working rehearsal prototype, not clinical efficacy, prediction of a real person's response, or a market first. State only actual tests performed and outcomes observed. Never claim a mock, prerecorded voice, or scripted playback is live inference. G1 and G2 were live-checked; G3–G5 are automated and labelled live not verified. Do not claim instant global erasure of provider copies. Full do-not-claim list: [DEMO-01](tasks/DEMO-01-submission-prep.md).

## Backup
Record a real working session using fictional data. Clearly label prerecorded material. Bring a headset and charged laptop. A local frontend still needs network access for provider calls.

## Submission and judging
The handbook requires submission through Devpost before noon Sunday, October 4, 2026, America/Detroit. Internal target: 11:30 AM. Include the project description, table number, teammates, and requested materials. Judging is Sunday 12:30-2:30 PM at Duderstadt, with three-minute presentations and possible repeat judging. The team must be present for any track.

Judging factors listed: innovation, technical complexity, usability, and presentation quality. No numeric weights were published in the reviewed handbook.

## Checklist
Execution steps, including the push of local polish and the backup recording, are [SUB-01](tasks/SUB-01-submission-execution.md). Pitch copy stays in [DEMO-01](tasks/DEMO-01-submission-prep.md).

- [ ] Coding/building occurred during the hackathon; disclose reused dependencies and planning artifacts as required.
- [ ] Actually Intelligent selected as the main theme.
- [ ] Both ElevenLabs awards checked with organizers for entry and stacking rules.
- [ ] Sponsor categories reflect integrations that really work.
- [ ] Figma design eligibility checked if entering.
- [ ] Notability Pro screenshots (at least two), tools tag, and usage note included if entering.
- [ ] Gemini contribution documented if that provider was selected and implemented.
- [ ] Demo/source access and required fields verified against the submission form.
- [ ] No keys or private user data in screenshots, logs, or demo.
- [ ] Successful submission confirmation retained before noon.
- [ ] Backup recording labelled prerecorded (shot list in DEMO-01).
- [ ] Do not claim G3–G5 live verification.

Sources: S35-S38 in [sources](14-SOURCES.md).

## Photon extension if implemented
Keep the main pitch inside three minutes. For sponsor judging, demonstrate a real iMessage exchange with the configured fictional roommate, then End and open web reflection. Explain shared approved preferences and isolated session histories. Show actual Spectrum usage in the submission. Do not add Photon to the tools/prize entry as a working integration unless the real round trip works. A separate 20-30 second recorded text demonstration can support Q&A without displacing the core live voice exchange.
