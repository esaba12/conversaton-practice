# DEMO-01: Demo and submission preparation

Status: integrated
Updated: October 3, 2026, 19:30 EDT
Assigned writer: coordinator
Coordinator: Cursor coordinator session
Gate: submission (docs/10, docs/11, docs/25 Prompt B, docs/28)
Requirements/tests: N/A — documentation only
GitHub issue: not opened
Pull request: not opened
CI run: not run

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
| 0:00–0:20 | “I wanted to practice conversations I’ve been putting off. A therapist once played the other person for me. This is a rehearsal tool, not therapy, and it does not predict anyone real.” Sign in if needed (already signed in for speed). |
| 0:20–0:40 | Describe a **new** everyday situation (e.g. asking a fictional coworker to stop booking over lunch). Leave private notes filled with something the counterpart must not know. Generate → **edit one field** (name or style) so judges see the review step. Point at About me / sharing only if time: “Each saved person knows only what I share.” |
| 0:40–1:55 | Start. Wait for talking video. Three to five turns. **Interrupt once** mid-reply. Restate the request. Counterpart should stay in character. If video fails, End and say the backup recording is labelled prerecorded — do not pretend it is live. |
| 1:55–2:15 | End. Optional one-line self-note → Get a short reflection **or Skip** if the model is slow. Show “nothing here is saved.” Dismiss or skip Save unless you want a named person for Q&A. |
| 2:15–2:40 | Open **Your data**: cleanup label is truthful (Deleted at provider / pending). “Sessions start fresh. Saving a person is explicit. Private notes never go to the call.” |
| 2:40–3:00 | Stack: Tavus CVI + ElevenLabs TTS for the talking counterpart; OpenAI for setup and optional reflection (`store: false`); Supabase for Auth and owner-scoped data; Next.js. “G1 and G2 were live-checked. G3–G5 are automated; I have not claimed a live G3/G4/G5 call.” |

If generation is slow or out of scope, use **Use roommate example**, then still edit a field so the review step is visible.

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

**What it does.** Conversation practice is a FaceTime-style rehearsal for an everyday conversation you have been putting off. You describe the situation, review an editable fictional counterpart, and talk live on video. Private preparation notes stay off the call. After End you can optionally reflect, and you can explicitly save the person and choose what they know about you. Each practice starts fresh.

**How we built it.** Next.js 16 App Router and TypeScript. Sign-in and owner-scoped PostgreSQL through Supabase. Live video through Tavus CVI (Daily room + meeting token) with ElevenLabs TTS configured on the PAL. Setup drafts and optional reflection use OpenAI Responses with `store: false`. Zod-validated routes; no service-role key in the client.

**Challenges.** Getting a real talking-video path through Tavus + ElevenLabs in one day; keeping private notes and unshared About-me facts out of counterpart context; tearing down mic and camera independently of a reachable End route; advancing G3–G5 on automated evidence when live calls could not be waited on.

**What's next.** Human live checks of G3–G5 (saved-person start, reflection from a real call, sharing changing tone). Session `person_id` attribution. Appearance presets (stock face + premade voice), already decided, not built. Photon/Relay deferred.

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

- Date/time/timezone: October 3, 2026, 19:30 EDT
- Mode: static
- Outcome: pass (docs only; no pitch timed, no Devpost submitted)
- Tested commit: `c191b39` plus this record
- Limitations: organizer rules and Devpost form fields not re-fetched live in this session; treat docs/16 as the dated snapshot.

## Handoff

- Remaining: human records backup demo; human submits Devpost; human verifies live G3–G5 when they choose.
- External account action: Devpost submission; confirm ElevenLabs category stacking at the event.
- Coordinator integration: this record plus docs/11 and README updates.
