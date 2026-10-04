# Feature specs (post-submission plan)

Status: **planning, not built, not verified.** IDs match [docs/31](31-PRODUCT-VISION.md) §4. Visuals are in [docs/33](33-DESIGN-SYSTEM-AND-SCREENS.md). Research references point into [docs/research](research/README.md). Where a spec touches a coordinator-owned contract (schemas, migrations, provider configuration, `buildRoleContext`), the change is a proposal for the coordinator, per docs/19.

Shared rules for every spec:

- **Counterpart context** is only what `buildRoleContext(role, extras)` assembles. Goal, hard-moment line, private notes, predictions, feedback style, check-ins and brave things are never inputs to it, nor to `append_context`.
- **Start bodies** keep today's shape (reviewed role, preset, or saved person id + version, plus idempotency key and duration). New private fields stay in browser memory unless a spec says they are stored, and then only in owner-authorized tables.
- **Teardown:** End releases mic and camera on every path, including new screens (green room, ringing).
- **Verification label:** every acceptance list is automated; live behavior stays "live not verified" until a person checks it.

Size: S ≈ one focused task; M ≈ two or three tasks; L ≈ a gate of its own.

---

## P1. Lobby (simulator home)

**Problem.** Practice starts from a blank describe form; people are a side list. The owner wants a simulator: pick who, then enter the situation (docs/31 §4a).

**Behavior.** `/practice` opens on the lobby:
- Header: "Who do you want to practice with?"
- Grid of **person cards**, ordered: people with a "Coming up" date (B1) first, then recently practiced, then the rest. Each card shows a portrait (B4 preset or monogram), name in serif, relationship, up to 3 trait chips, small meta ("Knows 2 things about you", "Coming up Thu"), and a primary button **"Practice with {name}"**. The whole card is the hit target. A secondary "⋯" opens Edit / Delete.
- **Starter characters**: Alex (roommate), Ellis (professor), Sam (asking you for a favor), marked "Starter". Practicing uses their default situation, which is editable. "Add to my people" copies one into the user's people.
- **"Someone new"** card: opens the briefing with name (optional, can be generated) and relationship chips (Roommate, Friend, Partner, Parent, Sibling, Manager, Coworker, Professor, Other).
- Empty state (no saved people): starters plus "Someone new", with one line: "Add the people you want to practice talking to."
- Keyboard: grid is a list of buttons; arrow keys move focus; Enter opens.

**Acceptance.** Mock browser: cards render for 0, 1 and 12 people; ordering rules; starter copy flow; "Someone new" path; owner isolation (another user's people never listed). **Size:** M.

---

## P2. Person / situation split

**Problem.** A saved person currently bundles a scenario (`public_context`, `opening`, `constraints`, `challenge`, `pace`) with identity (docs/26), so "practice with Maya about something new" means editing Maya.

**Model.**

| Person (persistent, versioned) | Situation (per practice, fresh) |
|---|---|
| name, relationship, traits, `style`, `background` (standing facts about them and the relationship, ≤600), look/voice preset (B4), shared About-me facts | `publicContext` (what's going on now), `opening`, `constraints` ≤5, stance chips (Q2), `challenge`, `pace`, duration, private goal / hard-moment line (never sent) |

`buildRoleContext` receives `role` = person identity + situation fields, plus `extras` (traits, shared facts) as today. The draft route gains an optional `personId`: the server loads that person's identity fields (not shared facts, not private prep) and the model generates only situation fields around them.

**Start body.** New branch `{ idempotencyKey, personId, expectedVersion, situation: { publicContext, opening, constraints, wants?, holdsBackBecause?, softensWhen?, challenge, pace }, durationSeconds }`. The server loads identity and shared facts by id (as today), validates the situation with Zod, and merges them. The browser still never sends identity fields or fact text for a saved person, nor the goal, notes or hard-moment line.

**Migration (coordinator).** Add `people.background`. Copy the existing `public_context` into `background`, and keep `opening`/`constraints`/`challenge`/`pace` as the person's **default situation**, used to prefill the briefing. Add a `person_situations` table (owner answer D13: yes) (owner_id, person_id, label ≤60, situation fields, timestamps), owner-scoped RPCs, ≤5 per person, covered by "Delete all practice data".

**Privacy.** The setup model sees the person's identity and the situation text the user typed; it does not see shared facts or private prep. The FIX-01 private-note probe still runs on generated situation fields.

**Acceptance.** Draft with `personId` returns situation fields only, and never another owner's person (404). Start with person + situation merges correctly, and the stale version is a 409. The start body has no identity fields or fact text (unit test like today). docs/26 two-user checks still pass. The migration preserves existing people (SQL test). **Size:** L.

---

## P3. Briefing (enter the situation)

**Behavior.** Clicking a card morphs it (ViewTransition) into the briefing:
- Left: portrait 240, name, relationship, trait chips, "Knows about you: 2 things" (link to sharing).
- Right: **"What's going on with {name}?"** (situation field, 1,000 chars), then quick chips:
  - the person's default situation ("Same as last time: dishes");
  - saved situations (D13);
  - skill starters (R1: Ask, Say no, Set a boundary, Give feedback, Apologize, Repair), which fill a template naming the person.
- Optional goal and hard-moment line in the Private card ("Only you see this").
- Primary: **"Set up the scene"** → generate → Meet card (S1) with identity locked and situation editable → green room → call.
- After the call, the recap offers "Update {name}" (identity changes only, explicit) and, if D13, "Save this situation".

**Acceptance.** Briefing prefill from the default situation; chips fill but never auto-generate; back returns to the lobby without losing typed text in this sitting; private fields omitted from the draft and start bodies. **Size:** M.

---

## Q1. Quality PAL pass

**Problem.** Face and voice were chosen as the first items returned by the APIs; TTS uses the least expressive model; the LLM is unset; `idle_engagement` is off [R04 §1].

**Behavior.**
1. Spike (coordinator, one test PAL each): `tts_model_name` = `eleven_v4_turbo`, then `eleven_v3_conversational`; record whether Tavus accepts each and whether audio plays. Test one ElevenLabs audio tag in the system prompt and record whether it is performed or read aloud.
2. List system faces; shortlist Pro faces; a human auditions 2-minute calls and picks a default face and 4–8 catalog faces (feeds B4).
3. Pick premade voices by audition to match each catalog face.
4. Create the **quality PAL(s)** with: chosen TTS model; explicit LLM per Tavus guidance for expressive faces (record the model id in configuration, not code); `conversational_flow` = sparrow-2, patience high, interruptibility per A/B (medium vs high), `idle_engagement: patient`; Raven-1 audio perception per T1 (owner chose full emotion recognition with notice); the existing system prompt plus one emotional-delivery sentence ("Let your face and voice show how the character feels, within the role's tone").
5. Switch `TAVUS_PAL_ID` / `TAVUS_FACE_ID` only after a human A/B call. Keep the old PAL id recorded for rollback.

**Acceptance.** Spike results in a task file with exact HTTP outcomes (no payloads logged). Readback confirms TTS engine, model, perception, flow. Test-mode conversation create and hard-delete pass. A/B notes from a human call, labeled with date.

**Privacy.** No change. Provider keys stay server-side.

**Depends.** Coordinator-owned `scripts/preflight/**` and env. **Size:** S–M.

---

## Q2. Counterpart realism (want, resistance, softening)

**Problem.** Counterparts give in too fast [R06 §2]. The role has style and challenge but no motive.

**Behavior (owner answer D6: "infer what you can, ask for overrides, optional review dropdown at the end, chips only").** Setup infers three role fields from the situation, each as one short **chip** (≤40 characters) plus 2–3 alternative chips. On the Meet card each row shows the inferred chip selected and the alternatives beside it; tapping an alternative overrides it; "Edit" on a chip allows a short custom chip (≤40). No free-text paragraphs.

| Field | Chip example (selected) | Alternatives |
|---|---|---|
| `wants` | "Not to be blamed" | "Keep evenings easy" · "Be seen as fair" |
| `holdsBackBecause` | "Feels singled out" | "Thinks you're messy too" · "Is stressed" |
| `softensWhen` | "You suggest a fair plan" | "You admit your part" · "You keep it short" |

After the call, the recap has a collapsed dropdown, "How {name} was played", listing the three selected chips plus the challenge chip. Chips only: no prose, no inferred thoughts, labeled "Fiction, set before the call". It is closed by default.

`buildRoleContext` adds the selected chips to the role JSON with one instruction: "Keep your want and reason consistently across the call. Change your stance only when what the user does matches softensWhen; then soften gradually." Challenge still bounds intensity: supportive ⇒ concedes readily when `softensWhen` is partly met; mild pushback ⇒ needs it clearly met. Cruelty rules unchanged.

Add a **freeze rule** to the base context: "If the user goes quiet for a while, check in once briefly in character (for example 'You okay?'), then wait."

**Contracts.** `roleContextSchema` gains three optional chip strings (≤40, optional to keep presets and saved roles valid). `draftResponseSchema` adds `stanceOptions: { wants, holdsBackBecause, softensWhen }`, each an array of 3–4 chips (≤40), the first being the inferred default. Only the selected chip enters the role. Prompt version bump. The recap dropdown reads the reviewed role in browser memory; nothing new is stored. Saved people: if the person record stores role text, add the fields there with a migration; otherwise generate per start. The coordinator decides.

**Privacy.** These fields are counterpart context the user reviews. The setup prompt must derive them from the situation only, never from private notes (extend the FIX-01 private-note probe to the new fields).

**Acceptance.** Schema tests (limits, optional, 3–4 options). Setup fixture produces all three with alternatives. Tapping an alternative changes the role sent at Start; custom chip limited to 40. Recap dropdown closed by default, chips only. Private-note probe rejects copies in any new field. `buildRoleContext` snapshot contains the fields and the stance instruction; contains no goal. Existing presets still validate.

**Evidence.** R06 §2, R02 §2.12a–b, docs/00 Van Kleef finding (disappointment is the moment to practice). **Size:** M.

---

## Q3. Video-first counterpart media

**Problem.** Audio leading video is the most uncanny failure [R05 §2].

**Behavior.** The remote audio element stays muted until the remote video element fires `playing` (or has a decoded frame); then unmute. If video never arrives within the existing timeout, show the existing failure state, not audio-only. "Live" state requires video (docs/22 already).

**Acceptance.** Mock-media test: audio unmutes only after video `playing`. End still stops all tracks. **Size:** S.

---

## S1. Meet card (review redesign)

**Problem.** The character is a form [R05 §1].

**Behavior.** Review opens as a card: portrait (face still from the selected face; fallback monogram), name (serif), relationship, one-line "how they talk", `wants` as "Wants…", reaction chip from `challenge` with a friendly label (Supportive = "Takes it well", Neutral = "Hard to read", Mild pushback = "Pushes back a little"), opening line in a speech bubble, length pills (3 / 5 min). "Edit details" expands the existing fields plus Q2 fields and constraints. Private goal and hard-moment line sit on a separate locked card ("Only you see this"). Primary CTA: "Call {name}".

**Contracts.** None beyond Q2. Portrait source: server returns a face preview URL for the configured face if the Tavus API exposes one (verify); never the raw provider id to the client if B4 is built.

**Acceptance.** Mock browser: card renders all fields; edit expands and round-trips; CTA disabled reason visible when invalid; keyboard and screen-reader labels; long text doesn't break layout. **Size:** M.

---

## S2. Green room

**Problem.** Call starts cold; first permission prompt is the browser's [R05 §2].

**Behavior.** Between Meet card and ringing:
1. Permission primer: "{name} will hear you. You can mute any time." → button "Allow microphone" → browser prompt. Camera is a separate, optional, off-by-default toggle labeled "Only you will see yourself."
2. Live mic meter (Web Audio, local only) and microphone picker. Copy: "If the bar moves, they'll hear you."
3. Private card: goal and optional hard-moment line (docs/30 field), editable.
4. Optional prediction: "What are you worried they'll say?" (≤200) and "How likely?" 0–100 slider labeled as your guess. Browser memory only.
5. Optional "Settle for 60 seconds" breathing circle, skippable, never default.
6. "I'm ready" starts the session request and goes to ringing.

Leaving the green room (back, sign-out, page hide) releases the mic stream used for the meter.

**Acceptance.** Mic stream stopped on leave, on ready (handed to Daily), and on error. Prediction and hard-moment line absent from start body (unit test like goal omission). Reduced-motion disables breathing animation. **Size:** M.

---

## S3. Ringing and the call screen

**Behavior.**
- **Ringing:** dark surround, large portrait, name, "Calling…", slow pulse; optional ring sound (off when the system is muted or the user turned sounds off). Starts when the session request is accepted; ends when remote video is playing (Q3). Cancel ends the session through the existing End route.
- **Call:** full-bleed remote video on `--night`; top bar: name (serif), "Fictional AI" pill, timer arc; self-view tile top-right only if camera on, draggable with keyboard alternative (arrow keys move between corners); bottom floating bar: Mute, Camera, Captions, Type, Ask to wait, End. Controls auto-fade after 3 s idle except for keyboard focus and screen readers. Speaking glow from Tavus `started/stopped_speaking` (accept `pal` and legacy `replica`) and Daily local audio level for the user. Captions use `utterance.streaming` when available, falling back to `utterance`, two lines, scrim.
- **Morph:** Meet-card portrait → ringing portrait → call tile via React `<ViewTransition>`; reduced motion uses a fade.

**Acceptance.** Mock browser covers ringing → live → ended; cancel during ringing tears down; captions render from synthetic events; speaking glow toggles from synthetic events; focus order and 44 px targets; contrast on night surface. **Size:** L.

---

## S4. Natural ending (wrap-up)

**Behavior.** At `durationSeconds − 30`, send `conversation.append_context` with: "About 30 seconds remain. Begin wrapping up naturally as {name}, in character. Do not mention time limits or the app." Show a "Wrapping up" chip and turn the timer arc honey. Server cap unchanged. If the user ends earlier, nothing is sent.

**Privacy.** Text is a fixed template plus the reviewed name. No goal or notes.

**Acceptance.** Unit: message sent once at the right time with the template; not sent after End; not sent in retry calls shorter than 30 s remaining. **Live check:** counterpart closes without mentioning time. **Size:** S.

---

## S5. Ask them to wait

**Behavior.** Button "Ask {name} to wait". Sends `conversation.interrupt`, then `append_context`: "The user asked for a moment. Stay quiet until they speak again. If they say something, respond normally." Shows "{name} is waiting. The timer is still running." No pause semantics; mute stays separate.

**Acceptance.** Unit: both messages sent in order; copy never says "pause"; timer continues. **Size:** S.

---

## S6. Type instead

**Behavior.** "Type" opens a one-line input in the call bar; Enter sends `conversation.respond` with the text; the user's caption shows it as typed. Max 300 characters. Mic stays in its current mute state.

**Privacy.** Typed text is part of the conversation, same as speech; not stored.

**Acceptance.** Unit: payload shape per Tavus docs; empty input blocked; length cap. **Live check:** latency from send to speech. **Size:** S.

---

## L1. Recap redesign (with the docs/30 retry)

**Behavior.** After End, in room mode:
1. Opening line: "That was a real try." (no evaluation).
2. If a hard-moment line exists and the call didn't support-exit: the docs/30 self-check (Yes / Not sure / No) and, on No, "Try that moment once", exactly per docs/30.
3. Reflection card (existing route), **on by default** (owner answer D2): after End the recap shows "Getting your reflection" with **Skip**. The request is sent after a 1.5 s grace period, so Skip in that window sends nothing; Skip later cancels display. The green room carries the disclosure: "After the call, what was said is sent once to make your reflection. It isn't stored." "What you did" shows the user's own quoted line when available, "Next time" one behavior, no score. Feedback style (L3) shapes wording. A1 "Another way to say it" sits under Next time.
3a. "How {name} was played" dropdown (Q2), collapsed.
4. If a prediction was made: "You expected: …" vs "What happened?" with Happened / Partly / Didn't happen, and an optional re-rating. Browser memory only.
5. Actions: Make pocket card (L2), Save/Update person (existing), Done.

**Contracts.** Reflection response may add an optional `quotedLine` (≤200, must be a substring of the user's own utterances; validated server-side). Prompt version bump.

**Acceptance.** docs/30 acceptance list. `quotedLine`, if present, is verified as user-spoken text; never counterpart text. No score fields. **Size:** M.

---

## L2. Pocket card

**Behavior.** A portrait-format card: name of the person (fictional label), "Open with: …" (user-editable, defaults to the goal), "If {hard moment}, I'll …" (the hard-moment line), optional date, one small line "Practiced on {date}". Export as PNG (canvas, client-side) and print. Nothing sent to a server. Nothing stored unless B1 date is saved.

**Acceptance.** Renders and exports offline; text wraps; no network request on export. **Size:** S.

---

## L3. Feedback style

**Behavior.** About me gets "How should feedback sound?": Gentle words (default) / Plain and direct / Short list. Stored on the profile (owner-only). Passed to the reflection request as an enum; prompt varies phrasing only, never content limits (still no score, one next step).

**Acceptance.** Enum validated; default when absent; prompt fixtures for each. A numeric option only if D1 = (b). **Size:** S.

---

## B1. Upcoming real conversation

**Behavior.** On a saved person and on the recap: "When will you talk for real?" optional date (no time required) and optional 1-line label. Home shows "Coming up" with the person card. Past dates move to check-in (B2).

**Contracts.** New owner-scoped table or person columns (migration, coordinator): `person_id`, `planned_on date`, `label text ≤120`, `created_at`. Included in "Delete all practice data". No transcript content.

**Acceptance.** Owner isolation SQL test (two users); deletion removes rows; cross-owner 404. **Size:** M.

---

## B2. Check-in

**Behavior.** On first visit after a planned date: "Did you talk with {name}?" Not yet / I decided not to / Yes. Yes offers an optional one-line note ("How did it go?") and an optional "Add to brave things". Not yet offers "Pick a new day". No follow-ups beyond one prompt per date. In-app only unless D8.

**Acceptance.** Shown once per date; dismiss works; answers stored owner-only; deletion covers them. **Size:** S.

---

## B3. Brave things

**Behavior.** A private list on the person page and About me: entries the user adds ("Talked to Maya about the dishes, Oct 9"), plus optional entries from B2. No counts on home, no streaks, no badges. Edit and delete per entry.

**Acceptance.** Owner isolation; deletion; no aggregate counters in UI. **Size:** S.

---

## B4. Appearance catalog (decided in docs/00)

**Behavior.** Person editor gets "Look and voice": a grid of 4–8 presets (portrait + 3-second voice sample label, no sample playback until verified). The person stores `preset_id`; the server maps to `face_id` and PAL. Default preset for unsaved practices.

**Contracts.** Per docs/00: one PAL per voice; server mapping table in configuration; browser never sends provider ids. Migration for `preset_id`.

**Acceptance.** Saved-person start uses the mapped face and PAL; unknown preset rejected; browser bundle contains no provider ids. **Size:** M.

---

## R1. Skills shelf

**Behavior.** As chips in the briefing (P3), not on a separate page. Also shown under "Someone new": cards for Ask for something, Say no, Set a boundary, Give feedback, Apologize, Repair after a fight, Share something personal. Each fills the describe field with a short template ("I need to say no to ___ when they ask me to ___") and suggests a goal. Never starts a call by itself.

**Acceptance.** Templates fill and are editable; analytics none. **Size:** S.

---

## R2. Clarifying chips

**Behavior.** Setup may return up to three `questions`, each with 2–4 short choices and "Skip". Answers regenerate or patch the role (e.g., "How do they react when you bring things up?" → Defensive / Change the subject / Agree then forget). Never asks about diagnoses, trauma, or private history.

**Contracts.** `draftResponseSchema.questions` optional; a patch request with selected answers; Zod-validated; prompt version bump.

**Acceptance.** Out-of-scope fixtures produce no questions; answers change only role fields; private notes still excluded. **Size:** M.

---

## R3. Presence ladder

**Behavior.** On the Meet card: "How do you want to practice?" Type it / Say it / Face to face (default). Type it: a text chat with the same role (setup model or Tavus text path, decide in spike). Say it: Tavus `audio_only: true` with the portrait and speaking glow. Face to face: today. User-chosen only.

**Contracts.** Start body gains `mode` enum; server maps to provider flags. Type-it path must keep the same counterpart boundaries and no storage.

**Acceptance.** Each mode tears down cleanly; `audio_only` never publishes the user's camera; mode defaults to face. **Spike:** whether Tavus `audio_only` keeps Sparrow turn-taking and voice quality. **Size:** L.

---

## R4. Curveballs

**Behavior.** Meet card toggle "Surprise me (once)". When on, the server adds one visible constraint chosen from a fixed list: "At some point, change the subject once", "At some point, ask to talk about it later", "At some point, agree to part of it but not all". The user sees it after the call ("Alex was set to: change the subject once"), or before if they open details. Counts toward the five-constraint cap; never raises challenge.

**Acceptance.** Exactly one constraint added; list is fixed; disclosed on recap. **Size:** S.

---

## R5. Languages

**Behavior.** Describe gets "Practice in" (English default plus Tavus-supported languages verified in a spike). Setup generates the role in that language; conversation `languages` set accordingly; UI copy stays English initially.

**Acceptance.** Language enum validated server-side; captions render non-Latin scripts. **Spike:** voice quality per language with the chosen ElevenLabs model. **Size:** M.

---

## R6. Landing

**Behavior.** Signed-out page: headline, a muted, captioned 8–12 s demo clip labeled "Recorded demo with a fictional AI character", the three-step arc (Before / Call / After), the privacy promise ("Your notes never reach the character. Calls aren't saved unless you choose."), one CTA. No testimonials or claims of benefit (R03 §6 claims list).

**Acceptance.** No autoplay audio; reduced-motion shows a still; claim copy reviewed against R03 §6. **Size:** S.

---

## R7. Sound design

**Behavior.** Three short sounds (ring loop, connect, hang-up), ≤1.5 s each except ring; global "Sounds" toggle in About me (default on, respects device mute where detectable). No sound on errors.

**Acceptance.** Toggle persists; no sound plays when off; files small and licensed for use. **Size:** S.

---

---

## G1. Goal light (owner answer D4: opt-in, off by default)

**Behavior.** Green room toggle: "Light up my goal when I say it". Its note reads: "During the call, what you say is checked by a separate model to see whether you said your line. The character never learns your goal." When on, the call shows the goal pill (outline). After each finished user utterance (debounced 1 s), the browser posts the last 6 user turns (in memory) and the goal to `POST /api/sessions/[id]/goal-check`. A server-only structured-output model returns `{ met: boolean }`. On the first `true` the pill glows clay with a check and an `aria-live` "Goal reached" announcement; no further checks are sent. Off: nothing is sent.

**Contracts.** New route: authenticated owner of a live session only; Zod body `{ goal ≤200, turns: string[≤6] each ≤500 }`; response `{ met }`; rate limit (for example 1 request per 3 s per session, 40 per session); model id in configuration; `store:false`; nothing logged or stored. Counterpart turns are not sent.

**Privacy.** Goal and turns never go to Tavus or `append_context`. docs/08 needs a line for this second in-call processor.

**Acceptance.** Toggle off sends no request (unit). Body has only user turns. Non-owner or ended session → 404/409. Rate limit enforced. Pill lights once and stays lit. Fixtures: a paraphrase of the goal counts as met; a refusal or a question about the goal does not. **Live check:** false-positive rate in five calls. **Size:** M.

---

## T1. Hear tone (owner answer D7: full, with notice)

**Behavior.** Calls use a PAL with `layers.perception = { perception_model: "raven-1", emotion_recognition: "full" }` and no `visual_awareness_queries`, `perception_analysis_queries` or perception tools. The user's camera is never published, so Raven has no video. The character card and green room show the notice: "{name} can hear your tone of voice (for example, if you sound unsure) and may react to it. Nothing about your tone is saved." Ship it with Q1 as the same new PAL, or as a parallel PAL so the A/B can isolate it.

**Contracts.** Coordinator-owned provider configuration; readback verification in `provider-setup.mjs` changes from "perception off" to "raven-1 audio, no visual queries". No `application.perception_analysis` callback configured. Utterance events may carry `user_audio_analysis`; the browser must not render, log or store it.

**Privacy.** docs/08 currently implies no analysis of the user; amend it to say Tavus infers vocal tone for the live response only. The camera rule is unchanged. Consider `policy: "eu"` handling if the app is ever offered in the EU (emotion recognition rules) [R04 §2.1].

**Acceptance.** Readback confirms the perception settings. Unit: the browser ignores `user_audio_analysis`. Notice present on both screens. **Live check:** counterpart reacts to an audibly hesitant line differently than to a firm one. **Size:** S (with Q1).

---

## A1. Another way to say it (owner answer D3, "whatever is best")

**Chosen shape.** Under "Next time" on the recap, a button "Another way to say it". It is never shown automatically. On press, the reflection model returns **one** phrasing (≤200) of the user's own goal line, preserving their meaning and request, labeled "One option. Use your own words if you prefer." A second press is not offered (no list of variants). It is never spoken by the counterpart and never inserted into a retry opening.

**Why this shape.** Users and competitors want concrete words [R01, R06]; autistic participants rated suggestions highly [R06 §3]. One optional option on request keeps docs/07's intent (no optimal script, no line-by-line critique) and avoids rehearsal loops.

**Contracts.** Either an optional field in the reflection request (`wantAlternative: true`) or a separate small route; response `{ alternative ≤200 }`. docs/07 amendment: "One alternative phrasing of the user's goal line, only on request."

**Acceptance.** Not requested → field absent. One per recap. Fixtures: keeps the request intact; no new demands; no judgment of the user. **Size:** S.

---

## Still undecided (sketch)

- **D5 Hint drawer.** Generated at setup from the reviewed role and goal: 3 framework steps for the scenario type. Shown only when opened; nothing sent to the counterpart.
