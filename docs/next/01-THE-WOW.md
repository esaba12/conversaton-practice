# The wow: what this product must feel like

Status: **planning, not built.** Written October 3, 2026, 22:10 EDT; revised 22:20 EDT after the owner corrected the origin story. This file is the experience target that every slice in [02-BUILD-PLAN](02-BUILD-PLAN.md) is judged against. Feature behavior stays in [docs/32](../32-FEATURE-SPECS.md) and [04-NEW-SPECS](04-NEW-SPECS.md); visuals stay in [docs/33](../33-DESIGN-SYSTEM-AND-SCREENS.md).

## 1. Where it came from

The owner was too scared to tell his boss he needed to slow down at work. In the practice session, **the other person played him first** to show him how it could go, while he played his boss. **Then they switched:** he played himself and said it in his own words. When the real conversation came, he was confident, and it went well.

That shape is the product. It copies the practice interaction, not a clinical role (docs/00):

| What happened in the room | Why it worked | What the product does |
|---|---|---|
| "What are you actually scared he'll say?" | Naming the fear makes it testable | Green room asks for the fear and how likely it feels (S2, W4) |
| "What do you want to walk out with?" | One concrete ask, not a feeling | Goal line and hard-moment line (docs/30), private |
| **She played him first; he played the boss** | He saw it could be said, and felt what the boss side hears | **Show me first** (W10): a stand-in plays you and says your line; you play {name} and push back the way you fear |
| Then she played the boss, with his reasons | Real resistance, not a pushover | Your turn: stance chips for what they want, why they hold back, when they soften (Q2) |
| It felt like talking to a person | Presence makes the practice count | Ringing, full-bleed face, expressive voice, hears your tone (S3, Q1, T1) |
| "Try that part again" | One moment, one more try | One-moment retry (docs/30) |
| "You said it. Here's what you said." | Your own words as proof | Recap quotes your line (L1) |
| "It's less scary than you thought" | The fear was overestimated | Your guess before and after, in your own numbers (W4) |
| Then the real conversation happened | Practice exists for the real thing | Pocket card; an optional date and check-in; brave things (L2, B1–B3) |

**The product's promise in one line:** *see the conversation you've been avoiding done once, then have it yourself, out loud, with someone who pushes back like they would.*

## 2. The hero journey: "Tell Jordan I need to slow down"

This is the demo, the first vertical slice, and the quality bar. The starter **Jordan, your manager** exists for it (W2). Times are targets, not measurements.

1. **Lobby (0:00).** "Who do you want to practice with?" Portrait cards: Jordan (Manager), Alex (Roommate), Ellis (Professor), Sam, and "Someone new". *Wow: people, not forms.*
2. **Briefing (0:05).** The card zooms into the left column. "What's going on with Jordan?" The user taps "Same as before: workload". Private card: "What do you want to walk out with?" → "Move the Atlas report to next sprint." "When it gets hard, I'll say…" → a chip fills it: "If they say the team needs me, I'll say I get that, and I still need to drop one thing."
3. **Meet card (0:20).** Jordan's face, name in serif, "Busy, fair, protective of the team." Stance rows: *Wants* "Keep the launch on track"; *Holds back because* "Worried the team falls behind"; *Softens when* "You say what to drop". The opening line sits in a speech bubble, and **Hear Jordan** plays it in Jordan's voice (W3). Tone notice with an ear icon. Because this is the first practice with Jordan, the primary button is **"Show me first"** ("See it once, then it's your turn"), and "Skip to my turn" sits beside it. Next time with Jordan, the order flips. *Wow: you meet them before you call them.*
4. **Green room (0:35).** The room darkens. Mic meter. "What are you worried Jordan will say?" → "That I'm not committed." "How likely does that feel?" → 80.
5. **Show me first (0:45 to 2:00).** Ringing, then a call with a **stand-in for you**: a different face and voice, labeled "Stand-in for you · Fictional AI". The top bar says **"You're playing Jordan."** A card reminds the user of what they fear, with the line "Push back the way you're afraid Jordan will." The user says, as Jordan: "Honestly, it sounds like you're not committed." The stand-in answers calmly, acknowledges it, and says the user's own line: "I get that the team is stretched. I still need to move Atlas so I can do the API work well." The user pushes once more. The stand-in holds, kindly. *Wow: you hear your own ask said out loud, and you hear how it lands from the other chair.*
6. **Your turn (2:00).** A short card: "Your turn. Now you're you, and Jordan is Jordan." The user can edit their line ("Want to change your line?") and add an optional note to themselves ("What did you notice?"). Then **Call Jordan**.
7. **The call (2:10 to 5:10).** It rings. Full-bleed face on night. Jordan pushes back with real reasons. The user hesitates and Jordan hears it (T1). The user says the line and **the goal pill lights clay** (G1). Jordan softens because the user named what to drop. At T–30 s Jordan starts wrapping up without mentioning time (S4). *Wow: it felt like a person, and it ended like one.*
8. **Recap (5:15).** "That was a real try." In large serif: **You said: "I need to move Atlas to next sprint so I can do the API work well."** One next time. **Your guess before: 80%. Now?** → 30, side by side (W4). "Did you say your hard-moment line?" → No → **"Try that moment once"** (docs/30), then "You can stop here."
9. **Pocket card (6:30).** Serif card: Jordan's small portrait, "Open with: …", "If they say the team needs me, I'll …". Save as image. Optionally, "When will you talk for real?" (never required).
10. **Later, only if they set a day.** The lobby asks once: "Did you talk with Jordan?" → "Yes" → "Add to brave things". "Not yet" is a fine answer.

**Bounded sitting.** Show me first (optional), your turn, and at most one retry: three calls at most, which matches the "≤ two extra takes per sitting" guardrail (R03 §4.4).

## 3. The ten wow moments (and what makes each land)

A slice is not done until a person has checked its bar. Until then it is labeled **live not verified**.

| # | Moment | Spec | Lands when | Killed by |
|---|---|---|---|---|
| 1 | Cards of people, not a form | P1, B4, W6 | Every card has a real face; hover feels alive | Monograms everywhere; slow skeletons |
| 2 | Meeting them first, hearing their voice | S1, W3, Q2 | The clip is the call's voice; chips read like a person | Generic chips; voice mismatch |
| 3 | **It shows you first** | W10 | The stand-in says your line in your words, acknowledges once, holds kindly, and stays short | Lecturing; changing your request; sounding like a coach; caving |
| 4 | The room darkens, it rings | S2, S3, R7 | Under 300 ms from click to ringing; the ring covers the boot | A spinner; a white flash; audio before face |
| 5 | They push back for a reason | Q2, Q1 | Keeps its want for 3+ turns; softens only when "softens when" is met | Caving on turn 2; monologues |
| 6 | They hear how you said it | T1 | Hesitant and firm lines get different reactions | Naming emotions clinically ("I sense anxiety") |
| 7 | Your line lights up | G1 | Lights within about 2 s; never on a refusal | False positives |
| 8 | They end the call themselves | S4 | Closes naturally; never mentions time or the app | Abrupt cut; "our time is up" |
| 9 | Your words quoted back; your number moved | L1, W4, W7 | Verbatim quote of the line that carried the goal | Paraphrase; quoting the counterpart; any score |
| 10 | "Did you talk with Jordan?" | B1–B3, L2 | Asked once, only if the user chose a day | Nagging; streaks; counts |

**Signature transition.** Card → briefing → ringing portrait → call tile → recap, with `<ViewTransition>` (docs/33 §6). In Show me first, the call tile carries the stand-in's face and a clay "Stand-in for you" pill. When the user's turn starts, the tile visibly swaps to Jordan's face: that swap is the "switch seats" moment. Reduced motion uses fades.

## 4. The quality bar for realism

The human uses this as a review rubric on every live check, in notes only, never shown to users (R05):

1. **Emotional intelligence.** Reacts to tone and content; mild hurt, impatience or relief in voice and face.
2. **Conversational dynamics.** One to three sentences, accepts interruption, one in-character check-in after silence.
3. **Contextual awareness.** Remembers this call; uses shared About-me facts naturally and nothing else.
4. **Consistent personality.** Keeps its want and reason; softening is gradual and earned.

For the stand-in in Show me first, two extra checks: it uses **the user's line nearly word for word**, and it **never steps out of the scene to give advice**.

Product checks: first counterpart word within about 2 s of the user finishing (target; record actuals); no visible audio-before-video.

## 5. Demo path

The owner gives the pitch and chooses the words. This is only the screen order and timing for a 3-minute run:

| Time | Screen | Show |
|---|---|---|
| 0:00 | Lobby → briefing → Meet card | Pick Jordan, tap the workload chip, set the line, press Hear Jordan |
| 0:30 | Green room | Fear and 80% |
| 0:40 | Show me first | About 30 seconds: push back as Jordan; the stand-in says the line |
| 1:15 | Your turn → call | Hesitate once, say the line, goal pill lights, Jordan wraps up |
| 2:20 | Recap | The quote, 80% → 30%, the retry offer without running it |
| 2:40 | Pocket card | Save it; mention fictional AI, notes never reach the character, nothing recorded |

Record a backup video of this exact path (SUB-01), labeled as a recording. The product never uses the word "therapy" or "therapist" (R03 §4.1, W9).

## 6. Wow we refuse

These would demo well and are out, by rule (AGENTS.md, docs/00, docs/08):

- A counterpart that is the user's real boss by name, a cloned voice, or a photo likeness. The stand-in is not the user's face or voice either.
- A score, grade, app-computed "confidence meter", streaks, or "you caved".
- Recording the user, transcript playback, or a rewind tree.
- Escalating cruelty for drama. Mild pushback is the ceiling; disappointment is civil.
- Calling it therapy, or claiming it reduces anxiety.
- The counterpart coaching the user. In Show me first, the stand-in models by doing, never by explaining.
