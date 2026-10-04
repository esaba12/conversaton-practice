# DEMO-01: Demo and submission preparation

Status: integrated
Updated: October 4, 2026, 11:15 AM America/Detroit
Assigned writer: coordinator
Coordinator: Cursor coordinator session
Gate: submission (docs/10, docs/11, docs/16)
Requirements/tests: N/A — documentation only
GitHub issue: [#36](https://github.com/esaba12/conversaton-practice/issues/36)
Pull request: final-submission docs PR (see STATUS)
CI run: see the PR

## Submission rules (re-read October 4, ~11:10 AM)

From the [Devpost rules](https://mhacks-2026.devpost.com/rules) and the [live schedule](https://www.mhacks.org/live):

- **Deadline: noon.** The rules say "Sunday, October 4th @ 12:00PM." The live schedule shows "Submissions Close @12 PM" from 11:30. The Devpost banner says 12:15 PM. Submit by noon and do not rely on the banner.
- **Code access is required.** Link https://github.com/esaba12/conversaton-practice (public).
- **One main MHacks track** plus as many eligible sponsor prizes as you want. That settles the stacking question from docs/16.
- **Judging: 1:00–3:00 PM, Duderstadt Basement, in person, science-fair style.** Stay at your table the whole time.
- **Rubric:** Innovation, Technical Complexity, Usability, Adherence to Theme. The theme is "build something that grows."
- Up to four teammates (solo is fine), 18+ students, built substantially during the event, AI tools allowed, one project per person.

## Devpost paste (final, October 4, ~11:15 AM)

Paste these fields in order. Earlier drafts in this file are stale.

**Project name:** SpeakEasy

**Elevator pitch** (Devpost limit 200 characters):

> Rehearse the hard conversation once before it counts: a live video call with a fictional AI character built from your own words, with a recap and one retry.

**Try it out links:**

- https://speakeasyapp.tech (the app; sign-in required)
- https://github.com/esaba12/conversaton-practice (code)

Do not use https://conversation-practice-site.vercel.app. It is the old static preview.

### Inspiration

Most of us have a conversation we keep putting off: asking a manager to move a project, telling a roommate the dishes are a problem, asking a professor for an extension. Reading advice doesn't help much in the moment. Saying the words out loud once does. I wanted a place to hear how a conversation might go, try it myself, and try the hard moment again, without a real person on the other end.

### What it does

SpeakEasy is a FaceTime-style rehearsal for an everyday conversation.

1. **Set it up.** Sign in, pick one of four starter characters (Jordan the manager, Alex the roommate, Ellis the professor, Sam the classmate), or describe your own situation. The app drafts a fictional character from your words, and you can edit it before anyone speaks. You set a goal and, optionally, the line you'll say when it gets hard.
2. **Show me first.** A stand-in plays your side and says your planned line while you play the other person, so you hear it once before you try it.
3. **Your call.** A live video call with a talking AI character who reacts to what you say, holds back like a real person might, and can be interrupted. Calls are three minutes (five if you choose), and you can end any time.
4. **Recap and one retry.** After End there is a short recap you can skip. It asks whether you said your line. If not, you can try just that moment once more.
5. **People who grow with you.** Save the character as a person. Give them a starter's face and voice. Drag the About-me facts you choose into what that person knows about you. They know only what you share, and nothing else.

Each practice starts fresh. Private notes never reach the call. There is no score, and SpeakEasy keeps no recording or transcript.

### How we built it

- **Next.js 16 App Router and TypeScript**, deployed on Vercel at speakeasyapp.tech.
- **Live video:** Tavus Conversational Video Interface over Daily WebRTC. Each starter has its own stock face and persona.
- **Voice:** ElevenLabs text-to-speech on every Tavus persona, with one premade voice per starter and a separate stand-in voice for "Show me first." Voice previews also use ElevenLabs.
- **Setup and recap:** OpenAI Responses with structured output, validated with Zod, and `store: false`.
- **Accounts and data:** Supabase Auth and PostgreSQL with row-level security. Every read and write is checked against the signed-in owner. Saving a person or a shared fact is a version-checked transaction.
- **Privacy boundary:** the counterpart's context is built from an allowlist (role, traits, shared facts). Private notes and unshared facts are not on that list. Provider ids and secrets stay on the server, and a build check confirms they are not in the client bundle.
- **Teardown:** End, sign-out, expiry and page exit release the microphone and stop media even when the network is slow.
- **Testing:** 792 unit tests, Playwright browser tests including a real-sign-in hero path, SQL tests across two owners, and CI on every PR.

### Challenges we ran into

- Getting real talking video, not a static picture with audio. The call only goes live once the character's video is actually playing, and it ends cleanly if video never arrives.
- Keeping the character in role. It reacts and pushes back, but it isn't an advice bot, and coaching stays in the recap.
- Keeping private notes and unshared facts out of everything the character sees, and testing that across two accounts.
- Making End release the microphone every time, including when the server is slow to respond.

### Accomplishments that we're proud of

- A working live video call with a fictional character who talks back, built in one weekend by one person.
- "Show me first" and "Try that moment once": you hear the line, then try it, then retry the part you missed.
- Per-person sharing that you can see and control, with a keyboard alternative to drag and drop.
- 792 automated tests, plus live calls on the deployed app the morning of submission.

### What we learned

Rehearsal is the useful part, not feedback. A short recap and one retry did more than a long critique would. Live video also needs careful state handling: ringing, connecting, live and ended each have to clean up after themselves.

### What's next

- Practice on your phone between classes.
- More faces and voices, still stock only. No cloning and no photos of real people.
- Check-ins after the real conversation: "Did you have it? How did it go?"

### Built with

`next.js` `react` `typescript` `tavus` `elevenlabs` `openai` `supabase` `postgresql` `daily` `webrtc` `zod` `vercel` `playwright` `vitest`

### Track and prizes

- **Main track (pick one):** Actually Intelligent (AI).
- **Sponsor prizes:**
  - Best Project Built with ElevenLabs. ElevenLabs is the voice of every character.
  - The .Tech domain prize. The app runs on speakeasyapp.tech.
- **Optional, low cost:** "Judged by an LLM," if the form offers it.
- **Skip:** Figma (no Figma file was used), Photon, Relay, FetchAI, Neon, Spacetime, Solana, Gemini, Presage, Notability, FinchNode, Nessie, FREE-WILi and SpaceXAI. None of these are in the build.

### Other form fields

- Teammates: solo.
- Table number: from the organizers.
- Video demo link: optional. If you record one, use the script below and an unlisted YouTube link. Leave it blank rather than posting an unlabeled or faked clip.
- Image gallery: a landing screenshot from speakeasyapp.tech, plus a lobby or briefing screenshot from the demo account. Use fictional content only, with no email address in view.

## Science-fair pitch (about 2–3 minutes per judge)

Judges walk up to the table. Be signed in on https://speakeasyapp.tech with the demo account, on a window wider than 700px so the goal pill stays visible. Wear headphones, or use the laptop speakers at low volume if the judge needs to hear. Reset the account first: `node --env-file=.env.local scripts/demo/seed.mjs --checkin`.

| Beat | Say / do | Rubric |
| --- | --- | --- |
| Hook (15 s) | "Everyone has a conversation they keep putting off. SpeakEasy lets you have it once before it counts, on a live video call with a fictional character built from your own words." | Innovation |
| Setup (20 s) | On the lobby ("Who do you want to practice with?"), pick Jordan under Your people. On the briefing, type the goal "Ask to move one project this week" and, under "When it gets hard, I'll say," type "I can move the date, and I still need one project off my plate." Then "Set up the scene." | Usability |
| Show me first (optional, 25 s) | Only if the judge has time. The stand-in says your line while you play Jordan. End. | Innovation |
| Call (45–60 s) | "Call Jordan." Wait until Jordan is on video and speaking. Make the request, interrupt once, and restate it. Let the judge see Jordan push back. Then End. | Technical Complexity |
| Recap (20 s) | Show the recap. Answer "No" to "Did you say it?" and point at "Try that moment once." "You don't redo the whole call, just the moment you missed." | Usability |
| Grows (20 s) | Open Jordan under Your people. "Saved people grow with you. You decide what each one knows, and you can drag facts in or out. Private notes never reach the call." | Theme |
| Stack (15 s) | "Tavus does the live video, ElevenLabs the voice of every character, OpenAI the setup and recap, Supabase the accounts with row-level security. 792 tests." | Technical Complexity |

**Theme line, if asked:** "It's about growing confidence. You rehearse, see what happened, retry the hard moment, and come back. The people you practice with grow too, but only with what you choose to share."

**If the call fails:** End it, say so plainly, and walk through the briefing and recap screens instead. Do not present a recording as live.

**Likely questions:**

- *Is it therapy?* No. It's a practice tool for everyday conversations. It doesn't diagnose or treat anything, and it doesn't predict what a real person will say.
- *Does it know about my real manager?* Only the facts you drag into that person. Private notes never reach the call.
- *Is the video prerecorded?* No. It's a live Tavus call, and the character responds to what you say.
- *What's stored?* Your account, saved people, the facts you shared, and session status. No recording and no transcript by default.
- *Why ElevenLabs?* Each starter has its own premade voice, and the stand-in has another. The voice carries tone, including hesitation and softening.

## Two-minute demo video (optional)

Record on https://speakeasyapp.tech, signed in, on a window wider than 700px. Wear headphones and use fictional content only. If a call fails, end it and say so. Do not present a faked clip as live.

"Try that moment once" appears only after you fill "When it gets hard, I'll say" and answer "No" to "Did you say it?" on the recap.

| Time | Do and say |
| --- | --- |
| 0:00–0:08 | On the lobby ("Who do you want to practice with?"). "This is SpeakEasy, a rehearsal for a conversation I've been putting off. The other person is fictional." |
| 0:08–0:25 | Pick Jordan under Your people. On the briefing, type the goal "Ask to move one project this week" and the hard-moment line "I can move the date, and I still need one project off my plate." Tap "Set up the scene." |
| 0:25–0:48 | Tap "Show me first." Allow the microphone. Tap "I'm ready." You play Jordan. Let the stand-in say the line, give one reply, then "End practice." The heading is "Your turn." |
| 0:48–1:28 | Tap "Call Jordan." Wait until Jordan is on video and speaking. Two turns. Interrupt once, then restate the request. |
| 1:28–1:52 | "End practice." On the recap, tap "No" under "Did you say it?", then "Try that moment once." Let one line play, then "End practice." |
| 1:52–2:00 | "Tavus does the video, ElevenLabs the voice, OpenAI the setup and recap, and Supabase the accounts. Saved people know only what you share." |

If "Show me first" is disabled, skip that beat and say it is unavailable. Do not start a second call while one is still connected.

## What has been checked, and what has not

- **Live (owner, October 4, ~10:23 AM, deployed app):** saved Jordan through briefing, Show me first, the call, End, recap and "Try that moment once," then a new call after choosing Alex's look and voice. "It all worked." Not itemized. This ran on the deploy just before the redesign ([PR #98](https://github.com/esaba12/conversaton-practice/pull/98)). The redesigned landing, dashboard and lobby have not had a live call.
- **Live (October 3):** the G1 call (talking video, interruption, microphone released on End) and the G2 generated situation.
- **Automated on `main` `9b7bc93`:** typecheck, 792 unit tests, production build, client-bundle check, Playwright 12 passed / 3 skipped ([run 37210478365](https://github.com/esaba12/conversaton-practice/actions/runs/37210478365)).
- **Not run live:** the sharing probe, a tone change after editing chips, Your data, video loss, and the behavior probes in [LIVE-01](LIVE-01-human-checks.md).

## Claims we must NOT make

- Therapy, clinical efficacy, diagnosis, or treatment of anxiety.
- Prediction of what a real roommate, manager, or anyone else would say.
- Instant global deletion of provider copies. Tavus cleanup is confirmed when labeled; ElevenLabs copies are not tracked.
- That a mock, test-media, or prerecorded clip is a live call.
- That sharing, chip-tone changes, Your data or video-loss handling were checked live. Those are automated only.
- Automatic memory writes, or that unshared About-me facts or private notes reach the counterpart. The evidence is automated; counterpart behavior is not live-checked.
- Voice cloning, photo upload, or a generated likeness.
- Group conversations, social scores, or branching replay.
- Photon, Relay, Gemini, Figma or AWS as working integrations.
- A market first, or that lip sync is accurate (it was slightly off on the October 3 stock face).

## Judging-day checklist

- [ ] Devpost submitted before noon, confirmation page kept (screenshot).
- [ ] Repository link and https://speakeasyapp.tech in "Try it out."
- [ ] Actually Intelligent as the main track; ElevenLabs and .Tech prizes checked.
- [ ] Demo account reset with `seed.mjs --checkin` after the last rehearsal.
- [ ] Laptop charged, charger, headphones, signed in on a window wider than 700px.
- [ ] At the table in the Duderstadt Basement from 1:00 to 3:00 PM.
- [ ] No keys, real emails, or private notes on screen or in the gallery.
- [ ] Do not deploy the uncommitted host-allowlist change before judging (see STATUS).

## Superseded material

Everything below was written on October 3 or early October 4, before the name, the domain, the redesign and the owner's live report. Do not paste it into Devpost.

### Earlier Devpost paste (October 4, ~10:00 AM)

Used the working title "Conversation practice," the URL conversation-practice-zeta.vercel.app, and said the current path was not live-checked. All three are out of date.

### Three-minute pitch (October 3)

Written for the pre-redesign workspace and a staged three-minute pitch. Replaced by the science-fair pitch above, because judging is at the table.

| Time | Say / do |
| --- | --- |
| 0:00–0:20 | "I wanted to practice a conversation I've been putting off..." Sign in if needed. |
| 0:20–0:40 | Describe a new situation, leave private notes filled, generate, edit one field. |
| 0:40–1:55 | Start, three to five turns, interrupt once, restate the request. |
| 1:55–2:15 | End, optional reflection or Skip. |
| 2:15–2:40 | Your data cleanup label. |
| 2:40–3:00 | Stack and what was verified. |

### Backup-demo shot list (October 3)

1. Signed-in `/practice` home: people list and "The situation."
2. A new situation plus optional private notes.
3. Generate, then review with an edited name.
4. Start, connecting, live talking video (at least 60 s, one interruption).
5. End, reflection (Skip is fine).
6. Optional: Save this person.
7. Person page: share one About-me fact.
8. Your data: cleanup label and counts. Do not delete everything on the demo account.
9. Sign out; `/practice` redirects to sign-in.

### Devpost drafts (October 3)

Said the app was local-only, that Google sign-in was next, and that the look-and-voice picker was not built. All three are out of date.

### Sponsor-track claims vs evidence (October 3)

Planned Actually Intelligent plus two ElevenLabs categories, pending stacking confirmation. The October 4 Devpost listing has one ElevenLabs prize ("Best Project Built with ElevenLabs"), and the rules allow any number of sponsor prizes. See "Track and prizes" above.

## Assignment and isolation

- Base ref: `main` `9b7bc93`
- Branch: `docs/final-submission`
- Worktree: `/Users/ethansaba/code/therapist/.worktrees/final`
- Owned files: this record, README, STATUS, docs/11, docs/16, docs/29, and PR #97's docs
- Shared resources: none

## Verification evidence

- Date/time/timezone: October 4, 2026, ~11:15 AM America/Detroit
- Mode: static, plus read-only HTTP checks
- Outcome: pass for copy. The Devpost rules and live schedule were fetched at ~11:10. https://speakeasyapp.tech returned HTTP 200 with title "SpeakEasy." CI counts are from run 37210478365 on `9b7bc93`. No live call was run for this update, and Devpost was not submitted by the coordinator.

- Date/time/timezone: October 4, 2026, 10:05 AM America/Detroit
- Mode: static
- Outcome: pass for copy only (earlier paste, now superseded).

- Date/time/timezone: October 3, 2026, 19:30 EDT
- Mode: static
- Outcome: pass (docs only)

## Handoff

- Remaining: the owner submits Devpost and presents at judging.
- External account action: Devpost submission.
