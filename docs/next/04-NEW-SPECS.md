# New specs for the wow pass

Status: **planning, not built, not verified.** Written October 3, 2026, 22:10 EDT. These fill the gaps between [docs/32](../32-FEATURE-SPECS.md) and the experience in [01-THE-WOW](01-THE-WOW.md). Shared rules from docs/32 apply to every spec here: counterpart context is only `buildRoleContext`; start bodies keep their shape; End releases mic and camera on every path; every acceptance list is automated and live behavior stays **live not verified** until a person checks it.

IDs: `W` = new spec. W10 needed an owner decision, which was given (see the end of this file). It changes one rule in a bounded way.

---

## W1. Practice flow state machine (enabler)

**Problem.** `app/practice/practice-workspace.tsx` is 618 lines with ~40 `useState` hooks. Every Phase 1 slice (lobby, briefing, meet card, green room, ringing, call, recap, retry) edits it. That makes parallel work collide and makes teardown on new screens hard to prove.

**Behavior.** No user-visible change. Extract:

- `lib/practice/flow.ts`: a pure reducer. Stages `lobby → briefing → meet → green → ringing → call → recap`, plus `retry-ringing → retry-call → retry-recap`. Events: `pickPerson`, `pickSomeoneNew`, `draftReady`, `toGreenRoom`, `ready`, `sessionAccepted`, `videoPlaying`, `ended`, `retryAccepted`, `back`, `signOut`, `authLost`, `pageHide`. Each transition declares whether it requires teardown (`releaseMic`, `endSession`) as data, so tests can assert it.
- `lib/practice/private-state.ts`: browser-memory holder for goal, hard-moment line, prediction and likelihoods. One `clear()` called on new setup, sign-out, auth loss and page hide (docs/30 step 1).
- `components/practice/*`: one component per stage. `practice-workspace.tsx` becomes a thin shell that wires the reducer, the media controller, and the stage components.

Today's screens map onto the new stages (describe/review → briefing/meet; call → call), so the refactor lands before any new screen.

**Acceptance.** Reducer unit tests cover every transition, including illegal ones (for example `ready` from `lobby` is ignored). Teardown flags are asserted for leave-from-green, cancel-from-ringing, end-from-call, sign-out and page hide in every stage. Private state is cleared on the four events. All existing unit and browser tests pass unchanged. **Size:** M. **Must land first in Phase 1.**

---

## W2. Jordan, the manager (hero starter)

**Problem.** The starters (roommate, professor, saying no) don't include the founder's own conversation, which is also the most relatable demo for judges: workload with a boss.

**Behavior.** A fourth starter, `manager`, shown first in the starter row:

| Field | Value |
|---|---|
| name | Jordan |
| role | Your manager |
| style | Busy and fair. Protective of the team. Talks in short, practical sentences. |
| publicContext (default situation) | You've taken on more than you can do well and want to ask Jordan to move one project off your plate. Jordan is planning a launch and is short on people. |
| opening | Hey, you wanted to chat? I've got about ten minutes before planning. |
| constraints | Keep it about this week's work. Do not bring up performance reviews. |
| challenge | mild_pushback |
| pace | conversational |
| stance chips (Q2) | wants "Keep the launch on track" (alts: "Not lose your work", "Avoid reshuffling"); holdsBackBecause "Worried the team falls behind" (alts: "Thinks it's temporary", "Already said yes to a deadline"); softensWhen "You say what to drop" (alts: "You offer a handoff plan", "You name a date") |
| suggested goal | Ask to move one project to next sprint. |
| suggested hard-moment line | If they say the team needs me, I'll say I get that, and I still need to drop one thing. |

Fictional: Jordan is not the user's real manager and is labeled "Starter". The user can "Add to my people" and rename.

**Contracts.** `sessionPresetSchema` gains `"manager"` (coordinator-owned). The preset fixture lives with the others on the server. Stance chips need Q2's optional fields first; until Q2 lands, the preset ships without them.

**Acceptance.** Preset start with `"manager"` resolves the fixture on the server; unknown strings still rejected; fixture passes `roleContextSchema`; snapshot of `buildRoleContext("manager")` contains no goal or hard-moment line. **Size:** S.

---

## W3. Hear {name} (voice preview on the Meet card)

**Problem.** The first time the user hears the counterpart is on the call. Hearing them on the Meet card makes the character real before the call, and shows off ElevenLabs directly (docs/16 target).

**Behavior.** On the Meet card, a small "Hear {name}" button with a speaker icon next to the opening-line bubble. Press plays the opening line in the voice the call will use. The bubble's text highlights while playing (reduced motion: no highlight). Second press replays from memory without a new request. If the opening is edited, the next press fetches again. Disabled with a reason ("Voice preview isn't set up") if not configured.

**Contracts.** New route `POST /api/voice-preview`, body `{ text ≤300, presetId? }` → `audio/mpeg` stream. The server maps `presetId` (or the default) to the ElevenLabs voice id and the same TTS model the PAL uses (Q1 result). Authenticated user only; rate limit 10 per 10 minutes per user (per process, like the draft limit); `Cache-Control: no-store`; nothing stored or logged; voice id never sent to the browser. Env: reuse the server-only ElevenLabs key already used for PAL setup (verify name in `.env.example`).

**Privacy.** The text is the reviewed opening, which is counterpart content the user already sees. Never send the goal, hard-moment line or notes; the client function takes only the opening string.

**Spike first.** Confirm the PAL's `external_voice_id` and model produce matching audio through the ElevenLabs TTS API (one human listen, same day as the Q1 A/B). If Tavus applies voice settings the direct call can't reproduce, label the button "Hear a sample of {name}'s voice".

**Acceptance.** 401 signed out; 400 over 300 chars; 429 after the limit; response has `no-store`; client bundle contains no voice ids (grep test like B4); a unit test proves the client sends only `{ text, presetId }`. **Live check:** the clip sounds like the call. **Size:** S.

---

## W4. Confidence arc (your guess, before and after)

**Problem.** The owner's strongest memory is the confidence gained. The research's top item is prediction vs. outcome (R03 §1.1). docs/32 has the prediction (S2) and a re-rating (L1 step 4), but not the moment that makes the change visible.

**Behavior.**
- Green room (S2): "What are you worried {name} will say?" (≤200) and "How likely does that feel?" 0–100 slider, labeled "Your guess".
- Recap (L1 step 4): "You expected: '{fear}'." → "Did that happen?" Happened / Partly / Didn't happen → "How likely does it feel for the real conversation now?" slider starting at the earlier value.
- The **arc**: once the user moves the second slider, the two numbers sit side by side in serif ("80% → 30%") with a thin clay arc drawn between them over `--t-calm`. Reduced motion: static. If the number went up, show it the same way, with no color change and no comment. Copy under it: "Your numbers, not a score."
- No computed delta, no "you improved", no aggregate anywhere.

**Storage.** Browser memory by default. If the user sets a real date (B1), offer "Keep my guess to check after the real conversation" (off by default). Then `fear ≤200`, `likelihood_before`, `likelihood_after` are stored on the B1 row, owner-only, covered by deletion. At check-in (B2), "Yes" shows "You expected: '{fear}'. What actually happened?" with an optional one-line note.

**Privacy.** Fear and numbers never enter counterpart context, `append_context`, the reflection request or the goal-check request. They are private, like the goal.

**Acceptance.** Arc renders only when both numbers exist; no derived number in the DOM; private-field omission test extended to the fear and likelihoods for start, draft, reflect and goal-check bodies; stored fields only when the opt-in is checked; deletion removes them. **Size:** S (browser), plus the B1 columns.

---

## W5. Speed budget and perceived latency

**Problem.** Wow dies in spinners. The three slow joins are setup generation, session create, and provider boot.

**Targets (record actuals in the task file; do not log content):**

| Join | Target | Technique |
|---|---|---|
| Card → briefing | instant | Person identity is already loaded in the lobby |
| "Set up the scene" → Meet card | ≤4 s; identity shows at 0 s | Meet card renders the person immediately; stance rows and opening show shimmer chips until the draft returns |
| "I'm ready" → ringing | ≤300 ms | Ringing starts on click, not on session accept |
| Ringing → face | covered by ringing | Q3: unmute only after video `playing`; ring stops on `playing` |
| User stops → counterpart starts | ≤2 s, record actual | Q1 flow settings; no change in our code path |

**Spike Q4 (coordinator).** Does a Tavus conversation's `max_call_duration` count from create or from join? If from join, create the conversation when the user enters the green room (lease already acquired) and join on "I'm ready", to hide boot entirely. If from create, or if unclear, keep today's create-on-ready. Never create a provider conversation before the user has pressed "Call {name}", and End/back from the green room must end it (teardown flag in W1).

**Instrumentation.** `performance.mark` in the browser for the joins above, readable in a dev-only overlay (`?timings=1`, development builds only). No server telemetry.

**Acceptance.** Ringing renders before the start request resolves (mock browser). Overlay absent in production builds. If Q4 ships, back from the green room ends the pre-created session (unit). **Size:** S, plus the spike.

---

## W6. Real faces on cards (portrait source)

**Problem.** Every wow moment needs a face before the call. docs/32 S1 says "verify whether Tavus exposes a preview".

**Behavior.** Portrait priority: (1) the B4 preset's still; (2) the default call face's still; (3) the monogram on the clay→sage gradient. Lobby hover may play a muted preview loop only if Tavus exposes one (docs/33 §4.2).

**Spike (coordinator).** Read `GET /v2/faces` fields for the shortlisted faces: thumbnail or preview URLs, and their terms of use. If a URL exists, the server proxies or maps it by preset id (no provider ids to the client). If none exists, the coordinator records whether Tavus terms allow a still captured from a test call; only then store curated stills under `public/faces/{presetId}.webp`. If neither is allowed, use stylized illustrated portraits (R05: stylized reduces uncanniness) drawn to match each preset, clearly not photos of the face.

**Acceptance.** Every starter and preset has a portrait; alt text "{name}, fictional AI character"; no provider ids in the bundle. **Size:** S after the spike.

---

## W7. Recap staging

**Problem.** The recap is where confidence lands; today it's a panel.

**Behavior** (docs/33 §4.8 order is unchanged):
- The call tile shrinks into the recap's small portrait over `--t-calm` while the room lightens.
- "That was a real try." in serif.
- The quoted line (L1 `quotedLine`) writes in at 40 ms per word, serif 28, with a clay underline that draws after the last word. Reduced motion: shown at once.
- The W4 arc follows the "What you expected" card.
- The "You can stop here." line is visually the end of the page, with space above it and nothing below except Done.

**Acceptance.** Reduced motion shows final state immediately; quoted line is selectable text, not an image; focus moves to the recap heading on arrival and is announced once. **Size:** S (with L1).

---

## W8. Demo seed and demo path

**Problem.** The demo needs approved memory (Jordan knows two About-me facts), a check-in that is due, and a clean account, every time.

**Behavior.** Coordinator script `scripts/demo/seed.mjs` (real Auth, fictional demo account, run by the coordinator only): creates About-me facts ("I've been on the team for two years", "I'm leading the API work"), copies the Jordan starter into the account's people, shares both facts with Jordan, and optionally creates a B1 row dated today so the check-in banner shows. `--reset` removes everything through the existing deletion RPCs. Credentials come from local env; nothing is committed.

**Acceptance.** Seed then reset leaves the account with no people, facts or B1 rows (SQL check); script refuses to run against an account without the `demo` label in its local config. **Size:** S.

---

## W9. Safety in the new screens

**Problem.** New screens must not lose the static Help/End control or the fictional-AI labels (docs/08, R03 §4.4).

**Behavior.**
- Call bar keeps **End** and adds **Help** (overflow on phones). Help opens the existing support-exit content (US 911/988 as today) and ends the session on confirm.
- "Fictional AI" pill visible in the ringing and call top bars at all times, including when controls fade.
- Briefing and Meet card copy never say "therapy", "therapist", "anxiety", "treatment" or "predicts" (string test over components, from R03 §4.1).
- The setup out-of-scope path (abuse, crisis, real-person impersonation, deceased person) is unchanged and is tested from the briefing with a `personId`.

**Acceptance.** Help reachable by keyboard and screen reader in the call; forbidden-word test over `components/**` copy; out-of-scope fixtures pass through the P2 draft branch. **Size:** S.

---

## W10. Show me first (stand-in for you)

**Decided** by the owner on October 3, 22:15 EDT (D14: yes), and reshaped by the origin story at 22:20: "my therapist was me first to show me, then I was me after." The order is **model first, then you**. It is not an after-call role swap.

**Problem.** The hardest part is often not knowing the conversation *can* be said. Seeing it done once, in your own words, and feeling the other side's position from the other chair is what made the original practice work.

**Behavior.**
- **Where (built into the main flow, owner 22:25 EDT).** The Meet card always offers both **"Show me first"** and **"Call {name}"**. The first time the user practices with a person, Show me first is the **primary** button with the line "See it once, then it's your turn." "Skip to my turn" is the secondary button. After that person has an ended practice, the order flips: Call {name} is primary and Show me first is secondary. Starters and "Someone new" count as first time unless the user has practiced that starter before. It is always skippable and offered once per sitting. It requires a goal line. If the goal is empty, the button explains: "Add what you want to say first."
- **Green room.** Same screen as today's S2: mic, the fear and likelihood, the tone notice. One more line: "First, a stand-in plays you. You play {name}."
- **The call.** It rings, then a **stand-in** answers. The stand-in uses a dedicated face and voice that never match any person preset (no likeness of the user). The top bar shows "You're playing {name}" and the stand-in pill shows "Stand-in for you · Fictional AI". A dismissible side card: "Push back the way you're afraid {name} will," with the user's fear quoted if they wrote one. Captions label speakers "Stand-in" and "You (as {name})". No goal pill, no goal light, no tone notice change. Hear tone stays on for the stand-in so it reacts to the user's delivery as {name}.
- **What the stand-in does.** It opens briefly ("Hey, do you have a minute?"), then:
  1. says the user's goal line close to word for word, early;
  2. when the user pushes back, acknowledges the other person's concern once and repeats the request (the docs/30 skill), using the hard-moment line if one exists;
  3. stays civil, warm and short (one to three sentences), does not over-apologize or over-explain, and does not add new demands;
  4. never steps out of the scene to coach, never comments on how the user plays {name}, and never claims to be the real user.
  If the user as {name} becomes abusive, the stand-in calmly holds once, and the existing support/End paths apply.
- **Length.** 180 s cap like a retry, with the S4 wrap-up at T–30 s. Most runs end early when the user presses End.
- **Your turn.** After End: "Your turn. Now you're you, and {name} is {name}." The goal and hard-moment line are editable here ("Want to change your line?"), and there is an optional "What did you notice?" note to self (≤200, browser memory only). **Call {name}** starts the normal call with a new idempotency key. No reflection runs on the Show me first call, and its turns are discarded at End.
- **Sitting cap.** At most one Show me first, then the user's call, then at most one docs/30 retry. After that, only "You can stop here."

**Contracts (coordinator, 03-CONTRACTS §2.7).**
- A new start branch `{ idempotencyKey, standIn: true, goal, hardMomentLine?, durationSeconds: 180, <role | preset | personId + expectedVersion (+ situation)> }`. **This is the only start body that may carry the goal and the hard-moment line.** The client function for it is separate from the normal start, so a normal start still cannot include them (existing omission tests stay, plus a test that only this branch accepts them).
- `buildStandInContext({ counterpart: identity + situation, goal, hardMomentLine? })` in a new server-only module. It never takes private notes or prep, fear or likelihoods, About-me facts (shared or not), the user's traits, or anything from a previous call. The counterpart's stance chips are excluded too: the stand-in shouldn't know what makes {name} soften.
- The normal `buildRoleContext` is unchanged: **the counterpart never receives the goal**, in this flow or any other.
- Provider: one **stand-in PAL** with the quality PAL settings and its own premade voice, plus a fixed stand-in face id, mapped server-side (env names in 03-CONTRACTS). Created in 0B.
- Session rows record `kind: "stand_in"` (metadata only) so cleanup and "Your data" show it like any session.
- `personSchema` gains a server-derived `hasPracticed: boolean` (true when the owner has an ended `kind = 'practice'` session with that `person_id`). Starters use the same check by preset id. Sessions don't record the preset today, so M1 adds a `preset` column (03-CONTRACTS §2.5 step 4a). `GET /api/practice-history` returns `{ practicedPresets: SessionPreset[] }` for the lobby.

**Rule changes this needs (record before build).** docs/00 entry (done in this pass). In docs/07, "the goal never enters counterpart context" stays true and gains: "The stand-in in Show me first is not the counterpart; it receives the goal and hard-moment line only." In docs/08, add the stand-in to the processor list (goal text sent to Tavus for one call, not stored by the app). In docs/32 A1, keep "never spoken by the counterpart" and note that the stand-in may say the user's own line, never an alternative the app wrote.

**Privacy.** The goal and hard-moment line now reach Tavus for the stand-in call only. The UI says so beside the button: "To play you, the stand-in gets your line. {name} never does."

**Acceptance.**
1. Without a goal, Show me first is disabled with its reason. On a first practice with a person it is the primary button. After an ended practice it is secondary. "Skip to my turn" goes straight to the normal call.
2. The stand-in start body contains only the allowed fields. Normal, preset, saved-person and retry bodies still contain no goal or hard-moment line (unit).
3. `buildStandInContext` snapshot: contains the goal and hard-moment line and the counterpart's name and situation; contains no notes, fear, likelihoods, About-me facts, traits or stance chips.
4. `buildRoleContext` snapshot for the following "Your turn" call contains no goal (regression).
5. Turns from the stand-in call are cleared at End and never sent to reflection.
6. Offered once per sitting; the cap of three calls holds; the retry still appears at most once.
7. End, sign-out and page hide release the mic and camera from the stand-in call and the Your-turn card.
8. Stand-in face and voice ids never reach the browser (bundle grep).

**Live checks (human).** The stand-in says the line nearly verbatim; holds once kindly under pushback; never coaches. The switch to {name}'s face reads clearly as "now it's you."

**Size:** M (UI plus server), plus the stand-in PAL in 0B.

---

## Owner answers, October 3, 22:15 EDT

| # | Answer | Effect |
|---|---|---|
| D14 | Yes, as **Show me first**: model first, then you. Built into the main flow (22:25): the recommended first step with a new person, always skippable | W10 above; Phase 1 slice 1G, part of the hero checkpoint |
| D15 | No. Situation stays typed | Phase 4 slice 4F dropped |
| D8 | In-app only, and **optional**: "just a possible side thing" | No `.ics`, email or push. B1 date is never required, never prompted twice, and is hidden in an "Add a day (optional)" link on the pocket card and person page. B2 asks once and only if a date exists |
| D17 | The owner gives the pitch himself | The demo path in 01-THE-WOW lists screens only. The product still never uses "therapy" or "therapist" (W9) |

Still open from docs/31 and unchanged: D1, D5, D9, D10, D11, D12.
