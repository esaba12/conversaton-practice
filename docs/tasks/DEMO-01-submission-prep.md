# DEMO-01: Demo and submission preparation

Status: integrated
Updated: October 4, 2026, 10:00 AM America/Detroit
Assigned writer: coordinator
Coordinator: Cursor coordinator session
Gate: submission (docs/10, docs/11, docs/25 Prompt B, docs/28)
Requirements/tests: N/A — documentation only
GitHub issue: not opened
Pull request: not opened
CI run: not run

## Devpost paste (October 4, morning)

Paste these fields. The October 3 drafts lower in this file still say the app is local-only, that Google sign-in is next, and that a look-and-voice picker is not built. Those three statements are stale. This section is the one to submit from.

Working title: **Conversation practice**. Issue #34 is still open. Use a name only if you have chosen one. Do not invent one for the form.

**Demo URL:** https://conversation-practice-zeta.vercel.app

That is the app. Do not put https://conversation-practice-site.vercel.app in the demo field. That host is a static preview.

Sign-in is email and password. The demo account is `DEMO_EMAIL` / `DEMO_PASSWORD` in `.env.local`. Before you record, reset it with `node --env-file=.env.local scripts/demo/seed.mjs --checkin`. Do not put the password in Devpost, the repo, or an issue.

### Inspiration

I wanted a first try at a conversation I kept putting off. Someone else can play my side once, so I can hear how it might go, and then I play myself. The other person in the app is fictional.

### What it does

Conversation practice is a FaceTime-style rehearsal for an everyday conversation. You sign in, pick a fictional person such as Jordan, a manager, or describe a situation of your own, and you review the setup before anyone talks. You can ask the app to show you first: a stand-in says the line you planned while you play the other person. Then you call on live video, and the counterpart talks back. You can end whenever you want. After the call there is a short recap you can skip, and if you wrote a line for the hard moment you can try that moment once. You can save the person, and they know only the facts you choose to share. You can also give a saved person one of four stock faces and premade voices. Each practice starts fresh. Private notes stay off the call. There is no score, and the product does not keep a recording or a transcript for you to replay.

### How we built it

Next.js App Router and TypeScript. Sign-in, and the data you choose to keep, go through Supabase Auth and PostgreSQL. Each account can read only its own rows. The live video call is Tavus conversational video. The speech is ElevenLabs text-to-speech on that Tavus setup. OpenAI writes the editable setup from the situation you describe, and the optional recap. The browser does not receive provider ids or secrets.

### What has been checked, and what has not

Checked on a live call by the builder on October 3: an earlier version of the call, with a talking counterpart, one interruption, and the microphone releasing on End, plus a generated situation that same afternoon. Checked by automation on current `main`: typecheck, 786 unit tests, a production build, a client-bundle check that provider ids stay off the page, and a Playwright walk of the hero path (13 passed, 1 production-only skip) with real sign-in and a faked video start. The deployed site loads, and opening `/practice` while signed out redirects to sign-in.

Not checked on a live call: the current path. That includes the lobby, Show me first, the recap, trying one moment again, choosing a look and voice, and the same path on the deployed site. Say those are live-checked only after you have done the call and they worked.

### Challenges

A real talking-video call through Tavus with ElevenLabs speech. Keeping private notes and unshared facts out of what the counterpart hears. Making End release the microphone even when the network call is slow.

### What's next

A live pass of the current path, including one call that uses a look other than the default. A project name, if you pick one.

### Built with

Tavus, ElevenLabs, OpenAI, Supabase, Next.js, Daily

Select Actually Intelligent. Add an ElevenLabs category only if you will stand on the stacking rules in docs/16. Those rules were not confirmed with the organizers.

## Two-minute demo video

Record on https://conversation-practice-zeta.vercel.app. Be signed in before you start, on a window wider than 700px so the goal stays visible. Headphones. Fictional content only. If a call fails, end it and say the file is prerecorded. Do not present a faked or prerecorded clip as live.

"Try that moment once" appears only after you fill "When it gets hard, I'll say" and, on the recap, answer "No" to "Did you say it?"

| Time | Do and say |
| --- | --- |
| 0:00–0:08 | Already on the lobby. "This is a rehearsal for a conversation I've been putting off. The other person is fictional. It does not predict anyone real." |
| 0:08–0:25 | Tap "Practice with Jordan." On "What's going on with Jordan," leave the seeded situation. In "What do you want to do?" type "Ask to move one project this week." In "When it gets hard, I'll say" type "I can move the date, and I still need one project off my plate." Tap "Set up the scene." |
| 0:25–0:48 | Tap "Show me first." Allow the microphone. Tap "I'm ready." You are playing Jordan. Let the stand-in say the line. One short reply, then "End practice." The heading is "Your turn." |
| 0:48–1:28 | Tap "Call Jordan." Allow the microphone. Tap "I'm ready." Wait until Jordan is on video and speaking. Two turns. Interrupt once while Jordan is talking, then say the request again. |
| 1:28–1:52 | "End practice." On the recap, tap "Skip" if the reflection is still working. Under "Did you say it?" tap "No," then "Try that moment once." Shorten the opening if you want. Tap "Call Jordan," let one line play, then "End practice." |
| 1:52–2:00 | "Tavus does the video, ElevenLabs the voice, OpenAI the setup and the recap, and Supabase the account. The early calls were live-checked." Add that this path was live-checked only if this take is that check and it worked. |

If "Show me first" is disabled, skip that beat and say it is unavailable. Do not start a second live call while one is still connected.

## Assignment and isolation

- Base ref + full SHA: `main` `c191b39` (G5 merged via [PR #26](https://github.com/esaba12/conversaton-practice/pull/26))
- Branch: `main`
- Worktree: `/Users/ethansaba/code/therapist`
- Dev port: N/A
- Owned files: `docs/tasks/DEMO-01-submission-prep.md`, proposed edits to `docs/11-DEMO-AND-SUBMISSION.md` and `README.md`
- Shared resources: none
- Dependency: G5 accepted on automated evidence (live not verified)
- Unblock condition: none for this record; Devpost and organizer confirmations remain human actions

## Scope and acceptance

Outcome: a pitch script, backup shot list, Devpost drafts, sponsor-claim map, judging-day checklist, and a list of claims we must not make, all matching what exists today.
Non-goals: recording the backup demo, filling Devpost, changing code or dependencies.

- [x] 3-minute pitch with a 60–90 s live call (generated situation, edit, interruption, End)
- [x] Backup-demo shot list (human records it)
- [x] Devpost field drafts
- [x] Sponsor-track claims mapped to evidence that exists; unverified marked pending
- [x] Judging-day checklist
- [x] Claims we must not make
- [x] Proposed docs/11 edits (applied in the same commit)

## Three-minute pitch (script)

Times are America/Detroit. Speak to a judge who has not used the app. Use a **new** generated situation, not the canned roommate start unless generation fails.

| Time | Say / do |
| --- | --- |
| 0:00–0:20 | “I wanted to practice a conversation I’ve been putting off. Someone can play my side once, then I play myself. The other person here is fictional, and this does not predict anyone real.” Sign in if needed (already signed in for speed). |
| 0:20–0:40 | Describe a **new** everyday situation (e.g. asking a fictional coworker to stop booking over lunch). Leave private notes filled with something the counterpart must not know. Generate → **edit one field** (name or style) so judges see the review step. Point at About me / sharing only if time: “Each saved person knows only what I share.” |
| 0:40–1:55 | Start. Wait for talking video. Three to five turns. **Interrupt once** mid-reply. Restate the request. Counterpart should stay in character. If video fails, End and say the backup recording is labelled prerecorded — do not pretend it is live. |
| 1:55–2:15 | End. Optional one-line self-note → Get a short reflection **or Skip** if the model is slow. Show “nothing here is saved.” Dismiss or skip Save unless you want a named person for Q&A. |
| 2:15–2:40 | Open **Your data**: cleanup label is truthful (Deleted at provider / pending). “Sessions start fresh. Saving a person is explicit. Private notes never go to the call.” |
| 2:40–3:00 | Stack: Tavus CVI + ElevenLabs TTS for the talking counterpart; OpenAI for setup and optional reflection (`store: false`); Supabase for Auth and owner-scoped data; Next.js. “G1 and G2 were live-checked. G3–G5 are automated; I have not claimed a live G3/G4/G5 call.” |

If generation is slow or out of scope, start an example (roommate, professor, or saying no), then still edit a field so the review step is visible.

## Backup-demo shot list (human records)

Record on the same machine as the live demo, fictional content only. Label the file **prerecorded**. No real names, emails, or notes that identify anyone.

1. Signed-in `/practice` home: people list + “The situation.”
2. Type a new situation + optional private notes (visible that notes are private).
3. Generate → review form with an edited name.
4. Start → connecting → live talking video (at least 60 s, one interruption).
5. End → reflection panel (Skip is fine if generation is slow).
6. Optional: Save this person.
7. Person page: click-share one About-me fact (keyboard if drag is unreliable).
8. Your data: cleanup label + counts. Do **not** delete-all on the demo account.
9. Sign out → `/practice` redirects to sign-in.

Still photos if video fails: the 390 px screenshots in ignored `artifacts/local/g5-*-390.png` are layouts only, not a live call.

## Devpost drafts

Superseded for submission by **Devpost paste (October 4, morning)** at the top of this file. The paragraphs below were written October 3, before the app was deployed and before the current flow shipped. Do not paste them into Devpost.

**What it does.** SpeakEasy is a FaceTime-style rehearsal for an everyday conversation you have been putting off. You describe the situation, review an editable fictional counterpart, and talk live on video. Private preparation notes stay off the call. After End you can optionally reflect, and you can explicitly save the person and choose what they know about you. Each practice starts fresh.

**How we built it.** Next.js 16 App Router and TypeScript. Sign-in and owner-scoped PostgreSQL through Supabase. Live video through Tavus CVI (Daily room + meeting token) with ElevenLabs TTS configured on the PAL. Setup drafts and optional reflection use OpenAI Responses with `store: false`. Zod-validated routes; no service-role key in the client.

**Challenges.** Getting a real talking-video path through Tavus + ElevenLabs in one day; keeping private notes and unshared About-me facts out of counterpart context; tearing down mic and camera independently of a reachable End route; advancing G3–G5 on automated evidence when live calls could not be waited on.

**What's next.** Human live checks of G3–G5 (saved-person start, reflection from a real call, sharing changing tone). Enable Google in the Supabase dashboard and try Continue with Google once. Appearance presets (stock face + premade voice) are decided and not built. Photon/Relay deferred. Session attribution, the 3/5-minute choice, professor and saying-no examples, and collapsed captions are on `main`.

**Built with.** Tavus CVI, ElevenLabs TTS, OpenAI Responses, Supabase (Auth + PostgreSQL), Next.js, Daily.js, Zod, Playwright, Vitest.

## Sponsor-track claims vs evidence

| Track | Claim we can make | Evidence today | Must not claim |
| --- | --- | --- | --- |
| Actually Intelligent | An AI counterpart you can talk to about a situation you described, with editable setup and explicit memory/sharing | G1/G2 human live calls; generation + review implemented; G3 sharing automated | That it treats anxiety, predicts a real person, or that G3–G5 were live-verified |
| Best Project Built with ElevenLabs / MLH Best Use of ElevenLabs | Premade ElevenLabs TTS is the speech path on the Tavus PAL; G1/G2 live calls used that PAL | PREP-03 PAL readback; G1/G2 live (“worked well”, imperfect lip sync) | Voice cloning; that we built a custom ElevenLabs agent pipeline; that lip sync is accurate |
| Figma / Notability / Gemini / Photon / Relay | Only if the human actually used/entered those | Not part of this build | Do not check these unless the human did the work |

Organizer confirmation still needed: stacking of the two ElevenLabs awards; table number; Devpost field list.

## Judging-day checklist

- [ ] Submit on Devpost **before 11:30 AM** Sunday Oct 4, America/Detroit (hard noon). Keep the confirmation.
- [ ] Table number, teammates (solo), description, built-with list, demo link or backup file.
- [ ] Actually Intelligent selected. ElevenLabs categories only if organizers confirmed entry/stacking.
- [ ] Laptop charged, headset, signed-in throwaway account, `.env.local` present, `npm run dev -- --port 3000` already running.
- [ ] One generated-situation rehearsal before 12:30. Know the Skip path if reflection is slow.
- [ ] Backup recording labelled prerecorded, on local disk (not only in chat).
- [ ] No keys, real emails, or private notes in screenshots or the Devpost gallery.
- [ ] Present 12:30–2:30 PM Duderstadt; stay for possible repeat judging.

## Claims we must NOT make

- Therapy, clinical efficacy, diagnosis, or treatment of anxiety.
- Prediction of what a real roommate, manager, or anyone else would say.
- Instant global deletion of provider copies (Tavus cleanup is confirmed when labelled; ElevenLabs copies are not tracked).
- That a mock, test-media, or prerecorded clip is a live call.
- That G3, G4, or G5 were live-verified (they are automated; live not verified).
- Automatic memory writes, or that unshared About-me facts / private notes reach the counterpart (automated evidence only; counterpart behavior live-pending).
- Voice cloning, photo upload, or a generated likeness.
- Group conversations, social scores, or branching replay.
- Photon, Relay, Gemini, or AWS as working integrations.
- A market first, or that lip sync is accurate (known slightly off on the stock face).

## Proposed edits to docs/11 (applied)

Replace the 2:15 memory-proposal beat with Save-person / Your data. Replace “approved memory” in technical contribution with explicit Save and per-person sharing. Add the claims list and the 11:30 target already present. Judging-demo line about “approve a preference” is outdated vs G3.

## Verification evidence

- Date/time/timezone: October 4, 2026, 10:05 AM America/Detroit
- Mode: static
- Outcome: pass for copy only. Devpost was not submitted. The two-minute script was not timed on a recording. No live call was run for this update.
- What the paste claims: the deployed URL is the one in STATUS from the owner's deploy of `fc94cc8` and later `main` `75f9c7d`. Live-checked claims are limited to the October 3 G1 and G2 calls recorded in STATUS. Automated counts (786 unit tests, Playwright 13 passed / 1 skip) are the compressed-finish evidence in STATUS, not a new run this morning.

- Date/time/timezone: October 3, 2026, 19:30 EDT
- Mode: static
- Outcome: pass (docs only; no pitch timed, no Devpost submitted)
- Tested commit: `c191b39` plus this record
- Limitations: organizer rules and Devpost form fields not re-fetched live in this session; treat docs/16 as the dated snapshot.

## Handoff

- Remaining: human records backup demo; human submits Devpost; human verifies live G3–G5 when they choose.
- External account action: Devpost submission; confirm ElevenLabs category stacking at the event.
- Coordinator integration: this record plus docs/11 and README updates.
