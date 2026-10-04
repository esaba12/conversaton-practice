# Product vision and roadmap (post-submission)

Status: **planning, not built.** Written October 3, 2026 from the research in [docs/research](research/README.md). Nothing here changes the submission build, the gate order, or any decision in [docs/00](00-DECISIONS-AND-VIABILITY.md). Items marked **Needs decision** conflict with, or go beyond, a current rule and must not be built until the owner decides. Feature-level detail: [docs/32](32-FEATURE-SPECS.md). Visual system and screens: [docs/33](33-DESIGN-SYSTEM-AND-SCREENS.md).

Owner direction for this plan (October 3): find what makes the product "really awesome" and "really usable for humans"; both function and UI are lackluster; ignore time limits; **optimize for quality, not cost** (free credits, short life).

## 1. Diagnosis

What exists works: a generated, editable fictional counterpart; a real talking video call; saved people with explicit About-me sharing; an unscored reflection; honest privacy and deletion. Few competitors combine those [R01].

What's missing, in order of impact:

1. **The product ends when the call ends.** Nothing before it prepares the user, and nothing after connects to the real conversation. The research is consistent that the loop around the call is where value comes from: prediction vs. outcome, if-then plans, and the real-world step [R03 §1]. The field is moving the same way: prep cards, follow-ups, check-ins [R01].
2. **Feedback is optional and thin.** In the one randomized LLM-practice study, practice alone *reduced* empathy and practice with feedback improved it [R03; R02 M1]. Our reflection is opt-in and has no cited evidence from the user's own words.
3. **The counterpart may be too easy.** "They forgive too fast… turn every conflict into a therapy session" is the most common roleplay complaint [R06 §2]. Our role has traits and a challenge level, but no persistent want, no reason to resist, and no condition for softening.
4. **Presence is left on the table.** The face and voice were picked as "the first one the API returned"; the voice uses the fastest, least expressive model; silence handling is off; emotional expression is never directed [R04 §1].
5. **The UI describes a conversation instead of staging one.** Forms, a flat olive box for the call, no portraits, no motion, no sound, no dark call surround, no ringing [R05 §1].
6. **No way in for people who aren't ready for a face**: no typing, voice-only, or warm-up [R06 §3–4].

## 2. North star

> You tell it about the conversation you're dreading. A minute later you're looking at Alex's card: her face, how she talks, what she wants, the first thing she'll say. You check your mic, write down the line you'll say when it gets hard, and press Call. It rings. She picks up and pushes back like your actual roommate would, until you name the dish schedule and she relaxes. Thirty seconds before time she starts wrapping up on her own. Afterward the screen quotes your own best sentence back to you, gives you one thing to try, and makes you a pocket card for Thursday. On Thursday it asks how it went, and "not yet" is a fine answer.

Three product qualities follow from it:

- **Staged.** Every practice has a before, a call, and an after, each with a clear feel (warm room → dark call → warm room).
- **Real.** The counterpart has wants and resistance, sounds and looks expressive, and handles silence and endings like a person.
- **Bridged.** The practice points at a real conversation on a real day, and the user records what happened. The product doesn't judge it.

## 3. Principles (constraints on every feature)

1. **Practice, not therapy.** No treatment claims; crisis exit always available (docs/08, R03 §6).
2. **The counterpart only plays the person.** Coaching lives outside the character (hint drawer, recap), never in its voice (docs/07).
3. **Private stays private, visibly.** Goals, hard-moment lines, notes and predictions never enter counterpart context. The UI shows the boundary (AGENTS.md).
4. **No scores, streaks, or engagement loops.** Progress is the user's chosen action (docs/08). Binary, behavioral signals the user controls are acceptable.
5. **Bounded.** One retry per sitting (docs/30); reflection short; nudge to stop rather than to continue (R03 §4).
6. **User chooses intensity.** Challenge, curveballs, modality, and feedback style are always the user's choice and never escalate automatically (docs/08).
7. **Quality before breadth.** A better face, voice and counterpart beat more features (owner direction).
8. **Honest labeling.** Fictional AI always labeled; mute is not pause; "live not verified" until a person checks.

## 4. Big bets

Each bet lists whether it fits current rules. Specs in docs/32 use the IDs.

| ID | Bet | Why | Fits rules? |
|---|---|---|---|
| Q1 | **Quality PAL pass:** audition and pick Pro faces and matched premade voices; most expressive ElevenLabs model Tavus accepts (`eleven_v4_turbo` first); explicit LLM; `idle_engagement: patient`; tuned interruptibility | Biggest realism gain for least product change [R04 §1, §3] | Yes. New PAL(s), coordinator-owned; current PAL stays immutable |
| Q2 | **Counterpart realism:** setup infers a *want*, a *reason to resist* and a *softens when* condition as chips the user can override, plus emotional direction and a freeze rule; recap shows them in an optional dropdown | Fixes "too agreeable" without cruelty [R06 §2, R02 §2.12a] | Yes, per owner answer D6. Within mild-pushback ceiling; chips are counterpart context the user reviews |
| Q3 | **Video-first media:** counterpart audio unmuted only once its video renders; ringing covers boot | Audio-leading-video is the most uncanny failure [R05 §2] | Yes |
| S1 | **Meet card:** review leads with the character (portrait, name, how they talk, want, opening line), details expand below | People, not forms [R05 §3.3] | Yes |
| S2 | **Green room:** intent-first mic permission, live mic meter, device picker, goal and hard-moment card (private), optional prediction, optional 60 s settle | Google Meet pattern; prediction is top evidence item [R05, R03 §1.1] | Yes |
| S3 | **Ringing → call:** card morphs into a dark, full-bleed FaceTime-style call; speaking glow; floating controls; timer arc; streaming captions | The signature wow moment [R05 §3] | Yes |
| S4 | **Natural ending:** wrap-up instruction to the counterpart via `append_context` at T–30 s with a visible "Wrapping up" cue | AGENTS.md priority "natural session ending"; Duolingo pattern [R02 §2.10] | Yes. Text from role only |
| S5 | **Ask them to wait** (interrupt + wait instruction), honestly labeled; timer keeps running | Control for anxious users without faking pause [R02 §2.12] | Yes |
| S6 | **Type instead:** `conversation.respond` for any turn | Accessibility; a step down from speaking [R04 §2.3] | Yes |
| L1 | **Recap redesign:** your own line quoted, one next-time, prediction vs. what happened, docs/30 self-check and retry, "You can stop here" | Feedback quality; bounded loop [R02 §2.15–16] | Yes. Feedback by default needs D2 |
| L2 | **Pocket card:** opening line, if-then line (the hard-moment line), date; image export | Strongest transfer evidence [R03 §1.3] | Yes |
| L3 | **Feedback style setting:** Gentle words / Plain and direct / Short list | Autistic co-design: user-selectable format [R06 §3] | Yes (no numbers). A tally option needs D1 |
| B1 | **Upcoming real conversation** on a person: optional date; shows on home and the person card | Bridges practice to the real thing [R01, R03 §1.8] | Yes. Stored as user-entered data |
| B2 | **Check-in after the date:** "Did it happen? Not yet / I decided not to / Yes", optional one-line note; in-app only | Behavioral-experiment close [R03 §1.8] | Yes in-app. Email/push needs D8 |
| B3 | **Brave things:** private list of practiced and real conversations the user logs | Progress without scores [R02 §2.24] | Yes |
| B4 | **Appearance catalog:** faces × premade voices per saved person | Already decided in docs/00 | Yes, decided |
| R1 | **Skills shelf:** Ask, Say no, Set a boundary, Give feedback, Apologize, Repair, Disclose; cards prefill describe | A way in besides the blank page [R02 §2.1] | Yes |
| R2 | **Clarifying chips** in setup (≤3 optional questions) | Better counterpart without long forms [R02 §2.2] | Yes |
| R3 | **Presence ladder:** Type it → Say it (voice, portrait) → Face to face, user-chosen | Graded exposure; accessibility [R02 §2.22] | Yes. Voice-only uses Tavus `audio_only` (verify) |
| R4 | **Curveballs:** opt-in "surprise me" (changes subject, asks to do it later, partial yes), disclosed after | Variability; realism [R02 §2.4] | Yes, if user-chosen and disclosed |
| R5 | **Languages:** practice in another language with the same voice | Tavus 42+ languages [R04 §2.7] | Yes |
| R6 | **Landing that shows, not tells:** recorded demo clip (labeled), the before/call/after arc, privacy promise | First impression [R05 §3.3] | Yes |
| R7 | **Sound design:** ring, connect, hang-up (optional) | Presence [R05 §3.1] | Yes |

### 4a. Simulator structure (owner direction, October 3, 21:41 EDT)

"I want this to feel like a simulator app. So when you go to practice, there's cards of the profiles of people, and it's like 'practice with ___' for each, then you click their card and you enter the situation."

This becomes the app's main structure, ahead of the other big bets in priority:

1. **Lobby.** Practice opens on a grid of people cards: your saved people, starter characters (today's Alex, Ellis, Sam presets), and a "Someone new" card. Each card shows a portrait, name, relationship, a few trait chips, and "Practice with {name}".
2. **Enter the situation.** Clicking a card zooms it into that person's **briefing**: big portrait, "What's going on with {name}?", situation chips and any saved situations, plus the optional goal and hard-moment line. Generate builds the situation around that person.
3. **Then the existing flow:** Meet card (now the scenario review, with the person's identity fixed), green room, ringing, call, recap, "Save {name}" / "Update {name}".

**Structural change.** Today a saved person stores identity *and* one scenario (`public_context`, `opening`, `constraints`; docs/26). The simulator model splits them. A **person** is identity: name, relationship, traits, how they talk, look and voice, background, and shared About-me facts. A **situation** is created per practice and is fresh by default: what's going on, opening, stance chips, constraints, challenge. That matches "each practice starts fresh" (AGENTS.md). Specs: P1–P3 in docs/32; screens: docs/33 §4.2–4.3. docs/26, docs/04 and docs/05 need coordinator amendments before build.

Open decision D13: may a person keep **saved situations** the user explicitly saves (for example "Dishes, again")? The proposed default is yes, explicit save only, at most 5 per person, situation text only, never transcripts.

## 5. Roadmap

Phases are ordered by dependency and impact. Each phase ends with automated checks and is "live not verified" until a person runs it (AGENTS.md). The owner has time for this plan. It is still not built.

| Phase | Contents | Exit check |
|---|---|---|
| **0. Foundation** | Design tokens, display serif, dark call surface, motion and reduced-motion rules (docs/33); Q1 spike (TTS model acceptance, Pro faces available, audio tags) and quality PAL; Q3 video-first | Typecheck, unit, build; spike results recorded in a task file; one human A/B call old vs. new PAL |
| **1. Stage the call** | P1 lobby, P2 person/situation split, P3 briefing; S1 Meet card, S2 green room, S3 ringing and call, S4 wrap-up, S5 ask-to-wait, S6 type instead; Q2 counterpart realism fields | Mock browser flow through all states; teardown releases mic and camera; private fields absent from start bodies |
| **2. Close the loop** | L1 recap with docs/30 retry, L2 pocket card, L3 feedback style | Retry acceptance list in docs/30; no score fields; pocket card renders offline |
| **3. Bridge to real life** | B1 upcoming date, B2 in-app check-in, B3 brave things, B4 appearance catalog (decided) | Owner isolation on new tables; deletion covers them; preset ids server-mapped |
| **4. Reach** | R1 skills shelf, R2 clarifying chips, R3 presence ladder, R4 curveballs, R5 languages, R6 landing, R7 sound | Per-feature acceptance in docs/32 |
| **5. Decided extras** | G1 goal light (Phase 1 or later), T1 hear tone (with Q1 quality PAL), A1 another way to say it (with L1); D2 default-on reflection lands in L1 | Per docs/32; docs/00, 07 and 08 amended first |
| **6. Still undecided** | Anything else in §6 the owner approves later | As specified after the decision |

## 6. Decisions needed from the owner

| # | Question | Options | Research note |
|---|---|---|---|
| D1 | Any numeric feedback? | (a) never (current rule); (b) an opt-in simple tally for users who choose it, never a grade | Co-design split; one wanted numbers [R06 §3] |
| D2 | Should reflection run by default? | (a) stay opt-in; (b) default-on with a visible Skip | Practice without feedback lowered empathy in the RCT [R03] |
| D3 | "Try saying it another way" on request? | (a) no (docs/07: no optimal script); (b) one alternative phrasing only when the user asks, labeled as one option | Competitors all do this [R01] |
| D4 | **Goal light** (a server model watches in-memory captions and lights the goal pill when the user says it)? | (a) no; (b) yes, opt-in, binary, never announced to the counterpart | docs/30 excludes transcript-based "gave in" detection; this detects the positive action, still a model judgment |
| D5 | **Hint drawer** during the call? | (a) no (docs/30 excludes mid-call hint for the retry); (b) opt-in drawer with pre-generated framework steps, hidden by default | Rehearse refuses on purpose; Duolingo offers help [R02 §2.11] |
| D6 | **"Their side" card** after the call (how the fictional character was played, with a disclaimer)? | (a) no (docs/08 hidden-thoughts rule); (b) only the *configured* strategy, never inferred thoughts, labeled fiction | BodySwaps' signature [R02 §2.20] |
| D7 | **Hear tone** (Raven-1 audio perception) so the counterpart reacts to hesitation and sharpness? | (a) off (current); (b) `emotion_recognition: limited`; (c) `full` with in-product notice | Big realism gain; emotion inference from voice [R04 §3.5] |
| D8 | Reminders outside the app (email or calendar file for the real date)? | (a) none; (b) downloadable `.ics` only; (c) email | Check-in works best when it reaches you [R02 §2.23] |
| D9 | Voice Design (a newly generated synthetic voice from a description)? | (a) premade only (current); (b) allow designed voices, never cloned | Not cloning, but outside "premade" [R04 §3.2] |
| D10 | Custom LLM behind the counterpart (our own endpoint)? | (a) Tavus-hosted model; (b) custom LLM for stricter character control | Runtime orchestration rule in AGENTS.md [R04 §6] |
| D11 | More than one retry, or "go again with one change" from the start? | (a) docs/30 as decided; (b) widen later | docs/30 says a third take crosses the over-rehearsal line |
| D13 | Saved situations per person (§4a)? | (a) none, every situation typed fresh; (b) explicit "Save this situation", ≤5 per person, text only | Fits explicit-save pattern of G3 |
| D12 | Drill mode (Noora-style short repeated exchanges on one skill)? | (a) no; (b) later, as a separate mode | Noora RCT positive [R06 §3] |

### Owner answers, October 3, 2026 (~21:50 EDT)

Recorded in [docs/00](00-DECISIONS-AND-VIABILITY.md), with the prompt and privacy amendments in docs/07 and docs/08. The running app still follows the implemented paragraphs in those files. Still planning, not built.

| # | Answer | Effect on specs (docs/32) |
|---|---|---|
| D2 | **Default on, with Skip.** | L1: reflection starts automatically after End; Skip cancels before the request is sent. Green room discloses that the in-memory transcript is sent once to the reflection model and not stored. |
| D4 | **Goal light: yes, opt-in, off by default.** | New spec G1. Opting in discloses that captions are checked during the call by a separate model. |
| D7 | **Hear tone: full, with a clear notice on the character card.** | New spec T1: a PAL with Raven-1 audio perception and `emotion_recognition: full`, no visual queries (the user's camera is never published). Notice on the Meet card and green room. docs/08 needs a privacy update. |
| D6 | **"Infer what you can, ask for overrides, optional review dropdown at the end, chips only."** | Q2 reworked: setup infers want / holds back because / softens when as short **chips**, each with alternative chips the user can tap to override. Recap gets a collapsed "How {name} was played" dropdown showing those chips only, no prose and no inferred thoughts. |
| D3 | **"Whatever is best" → allow one alternative phrasing, only on request.** | New spec A1: a "Another way to say it" button on the recap returns one phrasing of the user's own goal line, labeled "One option". The counterpart never scripts. docs/07 needs an amendment. |

| D13 | **Saved situations: yes.** Explicit "Save this situation", up to 5 per person, situation text only (October 3, ~21:45). | P2 adds the `person_situations` table; the P3 briefing shows them as quick picks; the recap offers "Save this situation". |

Still open: D1, D5, D8, D9, D10, D11, D12.

## 7. What stays out

Group conversations, voice cloning, photo upload or generated likeness, social scores, streaks, leaderboards, recording the user, transcript storage by default, automatic difficulty increase, reenacting abuse, real-person prediction, Tavus memory stores, and contact or message ingestion (AGENTS.md, docs/00, docs/08).

## 8. Measures (no engagement metrics)

- Human live checks per phase (docs/09 style): did the counterpart resist believably and soften for the right reason; did the call end naturally; was the face/voice A/B better.
- User-reported: "I said the line" (docs/30 self-check), real conversations logged, check-in answers. Reported in aggregate only if ever needed, never per user.
- Not measured: time in app, sessions per week, streaks.
