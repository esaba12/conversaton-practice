# R02: Practice mechanics from roleplay and simulation training

Status: research report (planning input, not a spec). Written October 3, 2026. Sources accessed October 3, 2026.
Scope: concrete mechanics used by enterprise, clinical, language-learning and consumer roleplay products and research systems. Each is translated into a version that fits this product's rules (no social scores, fictional counterparts, approved memory only, no raw transcript storage by default). Where a mechanic conflicts with a standing rule in AGENTS.md, docs/07 or docs/08, it is flagged **Needs decision**.

Evidence labels follow [R03](R03-SCIENCE-AND-FRAMEWORKS.md): strong / moderate / preliminary / weak / sentiment-only.

**Superseded in part (October 3, 21:26).** The owner decided a one-moment retry with a fixed shape in [docs/30](../30-ONE-MOMENT-RETRY.md): one hard-moment line, a self-check after End, at most one retry call per sitting, no transcript-based "gave in" detection, no mid-call hint as part of that feature. Where this report proposes "one more take with one change" (2.17), "attempt comparison" (2.18) or "try that moment again" (2.19), docs/30 wins. Anything beyond it is listed as an open decision in [docs/31](../31-PRODUCT-VISION.md).

## 1. The ten highest-leverage mechanics

| # | Mechanic | Why it matters here | Complexity | Rule conflict |
|---|---|---|---|---|
| 1 | **Feedback by default, cited to the user's own words** | Practice without feedback lowered empathy in the one randomized LLM study [M1]; scorecards with transcript citations are what make feedback trusted [M2]. Our reflection is optional and uncited | S | Reflection stays optional; default-on placement needs owner OK |
| 2 | **One more take with one change** | Re-roleplay-and-compare is the core loop in Hyperbound [M2] and deliberate practice [R03 §1.5]. We only offer Back to setup | S | None (fresh session, same setup) |
| 3 | **Prediction before, comparison after** | Strongest evidence-informed addition [R03 §1.1] | S | None |
| 4 | **Natural wrap-up whisper** | Duolingo's System "whispers in Lily's ear 'Psst! Say it's time to go'" [M3]; we need a natural ending (AGENTS.md priority) | S | None; uses `conversation.append_context` [R04] |
| 5 | **Goal light (binary goal detection)** | Yoodli's binary goals ("confirmed next steps") [M4] show *that* something happened without grading *how well* | M | Goal must not enter counterpart context → evaluate on our server, not via Tavus objectives |
| 6 | **Difficulty personalities with evocative names, plus curveballs** | calm / defensive / very defensive [M5]; friendly / busy / skeptical / difficult [M6]; variability per inhibitory learning [R03 §1.7] | S–M | Mild pushback ceiling stays (docs/08) |
| 7 | **Prep card for the real conversation** | Prehearse and Rehearse both ship it [M7, M8]; implementation intentions are the best-evidenced transfer tool [R03 §1.3] | S | None |
| 8 | **Real-conversation date and check-in** | Rehearse "on the day asks how the real one went" [M8]; closes the behavioral experiment [R03 §1.8] | M | Notifications need opt-in; in-app first |
| 9 | **Try that moment again (rewind to a moment)** | Stanford Rehearsal's counterfactual "what if?" exploration produced the largest behavior change in the literature reviewed [M9] | M–L | **Needs decision**: AGENTS.md "no branching replay in the MVP"; docs/08 "No replay tree in MVP" |
| 10 | **Their side (perspective swap)** | BodySwaps' signature "swap bodies and watch yourself back" [M10] | M | **Needs decision**: docs/08 "Do not reveal fictional hidden thoughts as if they explain real people's behavior" |

## 2. Mechanics catalog

Each entry: what it is · who does it · UI pattern · evidence/sentiment · risks · adaptation for us · complexity.

### Before the call

**2.1 Scenario library organized by skill.** Vocal Image: 200+ scenarios, 14 skills × 7 life contexts [M11]. Convo: 63 across 6 categories [M12]. Murmur: 40+ [M13]. UI: category tabs and cards with evocative titles ("Holding your no"). Sentiment: a library is the main reason to pay in roundups [M11]. Risk: a library can crowd out the user's own situation, which is our core. Adaptation: keep "describe your situation" primary; add a skills shelf under it (Ask, Say no, Set a boundary, Give feedback, Apologize, Repair, Negotiate, Disclose something) whose cards prefill a describe template rather than a fixed persona. S–M.

**2.2 Clarifying questions during setup.** Several ChatGPT prompts users share ask clarifying questions first [M14]; Duolingo generates the first question in a separate prep pass [M3]. UI: 1–3 tappable chips after the description ("How do they usually react when you bring things up? Get defensive / Change the subject / Agree, then forget"). Adaptation: the setup generator may return up to 3 optional `questions[]` with choice chips; answers become counterpart-known traits or assumptions. Never ask for diagnosis or history (docs/02). M.

**2.3 Difficulty as personality, not a slider.** [M5, M6]. Our supportive / neutral / mild pushback becomes named reactions per scenario ("Takes it well", "Gets a bit defensive", "Deflects with a joke", "Busy and distracted"). Ceiling unchanged. S.

**2.4 Curveballs (opt-in variability).** Inhibitory learning favors variability [R03 §1.7]; a commenter on Confident Caller asked for "unexpected interruptions or objections" [M6]. Adaptation: a "Surprise me" toggle that lets the counterpart use one of: changes the subject, asks to do it later, partial yes, brings up a counter-complaint (bounded, non-cruel). Disclosed on the recap: "Alex was set to change the subject once." S.

**2.5 Prediction card.** [R03 §1.1]. "What are you worried they'll say?" + likelihood 0–100. Stays in the browser, or saved only if the user saves the practice note. S.

**2.6 Settle-in (60 s).** Murmur ships breathing before the real call [M13]; cyclic sighing evidence is preliminary [R03 §1.10]. Skippable, never required. S.

**2.7 Green room device check.** Google Meet's self-check: mic bar moves when you speak, speaker test, camera preview [M15]; Meet's permission redesign asks the user's intention before triggering the browser prompt, which raised first-use success [M16]. Adaptation: pre-call screen with live mic meter (Web Audio locally), "Allow microphone" primer, optional camera preview, and the goal card. S.

**2.8 Ring-to-connect latency masking.** Duolingo: "when your Video Call is ringing, that's when the System is formulating the first question" [M3]. Adaptation: show an incoming-call / ringing state with the character's portrait while Tavus boots; never mark live before media is ready (docs/22). S.

### During the call

**2.9 Goal light.** Binary goal detection [M4]. Our goal is private (not counterpart context). Adaptation: the browser already receives utterances (captions); every user turn (debounced) is sent to a server route that asks a small structured-output model "has the user done <goal>? yes/no/partly + turn index". The pill softly lights; nothing is announced aloud except an optional screen-reader status. Tavus Objectives are *not* suitable because objective prompts are given to the PAL LLM to steer toward completion [R04]. M.

**2.10 Wrap-up whisper.** [M3]. At T–30 s, `conversation.append_context` tells the counterpart to begin closing naturally; the UI shows a soft "Wrapping up" cue. Server cap stays the backstop. S.

**2.11 Hint drawer.** Rehearsal gives feedback during practice [M9]; Duolingo "tell[s] her how to help you if you're stuck" [M3]; Rehearse (jeanie) deliberately refuses ("nothing coaches you mid-conversation, because nothing does in the room either") [M5]. Adaptation: opt-in drawer, hidden by default, offering a framework nudge for this scenario type (e.g., DEAR MAN step names; "Say what you want in one sentence"). Generated before the call from the reviewed setup and goal; never sent to the counterpart. Opening it does not pause anything. S.

**2.12 Ask for a moment.** Users want to think without the counterpart filling silence. Tavus has no pause, and AGENTS.md forbids labeling mute as pause. Adaptation: an "I need a moment" button sends `conversation.interrupt` plus `append_context` ("The user asked for a moment. Wait quietly until they speak; if asked, say 'take your time'"). Label: "Ask Alex to wait." Timer keeps running and says so. S.

**2.12a Freeze handling.** The a-gnt rehearsal prompt: "If I freeze up mid-conversation, it's okay to have the character say something like 'what?' or 'are you okay?' — the way a real person would" [M14]. Shared prompts also converge on "reasonable, not a cartoon villain, not a pushover" and "2–4 sentences, real conversations aren't monologues" [M14], matching our counterpart rules. Adaptation: add a freeze rule to `buildRoleContext` (after a long silence, one brief, in-character check-in, then wait) and pair it with the visible Ask-to-wait control. Tune silence with Sparrow `turn_taking_patience` [R04]. S.

**2.12b What popular prompts do that we don't.** The most-shared ChatGPT rehearsal prompts [M14] all (a) ask "what's the worst response you're afraid of?" before starting, (b) ask "if you could only say one sentence, what would it be?", (c) let the user say "pause" to step out to coaching, and (d) end with three notes: what worked, what tripped you, one thing to try. Several also rate 1–10 and auto-escalate difficulty, which we deliberately reject (docs/08). (a) maps to the prediction card, (b) to the goal card, (c) to the hint drawer and Ask-to-wait, (d) to the debrief.

**2.13 Live talk-balance and pace (delivery analytics).** Yoodli: pacing, filler words, conciseness [M4]; Hyperbound tracks talk ratio [M2]. Daily exposes local and remote audio levels at ≥100 ms intervals [R04]. Risk: self-focused attention maintains social anxiety [R03 §2.2]; live meters can increase it. Adaptation: never live; at most one post-call line ("You spoke about 45% of the time") and only if the user opts into "delivery notes." S.

**2.14 Text input mode.** Yoodli chat roleplays [M4], iGrow text mode [M17]. Tavus `conversation.respond` injects typed text as the user's turn [R04]. Adaptation: a "Type instead" field for any turn, and a full "type it first" ladder step (see 2.22). M.

### After the call

**2.15 Cited debrief.** Every scored product converges on: what worked / what fell flat / the exact phrase / one thing to change [M8, M18, M17]. Hyperbound: "transcript citations" [M2]. Our G4 reflection has What you did / Takeaway / Next time and forbids line-by-line critique and optimal scripts (docs/07). Adaptation that respects the rules: quote *the user's own* best line ("You said: 'I need us to agree on a dish schedule'") as the cited evidence for the observed action; keep one "Next time" behavior; offer "Try saying it another way" only on explicit request (**Needs decision**, see [docs/31](../31-PRODUCT-VISION.md) §6). S.

**2.16 Prediction vs. what happened.** [R03 §1.1]. Side-by-side card plus re-rating. S.

**2.17 One more take with one change.** [M2]. "Go again" opens the same setup with a single selectable tweak: say the ask earlier, drop an apology, try a firmer counterpart, try a softer one, turn on a curveball. Cap suggested repeats (e.g., gentle prompt to stop after 3 in one sitting) to avoid over-rehearsal [R03 §4]. S.

**2.18 Attempt comparison.** Hyperbound "see how your score changes" [M2]. No scores here: compare *whether the goal light came on* and *how many turns until you said it* across takes, kept only in memory for the sitting (fresh sessions). S–M.

**2.19 Try that moment again.** [M9]. From the debrief, pick a counterpart line ("When Alex said 'I've been really busy'") and start a short new call that opens on that line with a summary of what came before as context. **Needs decision** (branching replay). M.

**2.20 Their side.** [M10]. After the call, a short card: "How Alex was played: wanted to avoid blame; softened when you named a specific day." It describes the *fictional character's configured strategy*, generated from the setup plus transcript, with a fixed disclaimer that it is not what the real person thinks. **Needs decision** (docs/08 hidden-thoughts rule). M.

**2.21 Prep card / pocket card.** [M7, M8]. Opening line in the user's own words, an if-then plan, one reminder, the real date. Save as image or print; nothing sent anywhere. S.

### Between sessions

**2.22 Presence ladder.** VR exposure and SST use graded steps [R03]; Confident Caller's "Confidence Steps" [M6]. Adaptation: three rungs within one scenario — Type it (text), Say it (voice, face hidden/portrait), Face to face (video). User picks; never auto-advanced (docs/08). M.

**2.23 Real-world check-in.** [M8]. "Did it happen? Not yet / I decided not to / Yes" with "Not yet" and "I decided not to" first-class. Optional comparison with the prediction. M.

**2.24 Brave things record.** Instead of streaks: a private list of conversations practiced and conversations actually had (user-entered). Murmur adds "share the little wins" [M13]. S.

**2.25 Skills shelf progress.** Vocal Image tracks a skill across contexts [M11]. Adaptation without scores: "Saying no: practiced 3 times, with 2 people; had 1 for real." S.

**2.26 Multi-person scenes.** Yoodli up to 3 personas [M4]. Out of scope (AGENTS.md: no group conversations). Listed for completeness only.

## 3. The synthesized practice loop

```
BEFORE (≤ 90 s, every step skippable)
  Describe → (optional clarifying chips) → Meet the character card → Green room:
  mic check · goal card · "what are you worried they'll say?" · 60 s settle

DURING (3–5 min)
  Ringing → live · goal pill (lights when done) · hint drawer (opt-in) ·
  ask-to-wait · type-instead · wrap-up whisper at T-30 s · End always visible

AFTER (≤ 2 min)
  Breathe-out moment → debrief: your line that worked · one next-time ·
  prediction vs. what happened → Go again with one change (≤3 nudged) →
  Pocket card (if-then plan + opening line + date) → Save/update person

BETWEEN
  Upcoming real conversation on the person's card → day-of pocket card →
  check-in afterward ("Not yet" is fine) → Brave things record
```

## 4. Feedback design

What helps (see [R03 §2.6]): task-focused, behavior-level, about something the user can repeat or change; given right after practice; short; paired with one thing that went okay; user chooses depth. What harms: person-level judgments ("you seemed nervous"), comparisons to others, long lists, numeric grades for anxious users, feedback that invites endless re-analysis.

Scores vs. no scores. Competitors score because scores are easy to market and compare. Autistic co-design participants split, with one rejecting scoring and another preferring numbers, so format should be user-selectable [R06]. Our default stays unscored; the closest acceptable progress signals are binary and behavioral (goal light on/off; turns until you said it) and the user's own re-ratings.

Phrasing patterns worth copying:
- Rehearse (Maison GR): "What worked — the exact moment your argument landed" / "One thing to change — the highest-impact change for your next session" [M18].
- Rehearse (jeanie): "the specific sentence that cost you — quoted back" [M5]. Use the inverse: the sentence that *carried* the goal.
- Yoodli: "Unscored goals provide qualitative, feedback-only insights … without assigning a score" [M4].
- Convo: "Recovery (did you push through the stumble?)" [M12] — a positive, anxiety-aware dimension.

## 5. Sources

- [M1] Louie et al., CARE randomized study, CHI 2026. https://arxiv.org/abs/2505.02428
- [M2] Hyperbound support: AI coaching, scorecards. https://support.hyperbound.ai/articles/2088692386-how-to-use-ai-coaching-effectively-in-hyperbound ; https://support.hyperbound.ai/articles/4766442898-how-to-create-scorecards ; product: https://www.hyperbound.ai/product/hyperbound-practice
- [M3] Duolingo blog, "How Duolingo uses AI to Create the Perfect Speaking Practice." https://blog.duolingo.com/ai-and-video-call/
- [M4] Yoodli Help Center roleplay builder and feedback pages. https://support.yoodli.ai/en/articles/11565137-how-to-build-and-customize-roleplays ; https://yoodli.ai/platform/ai-feedback
- [M5] Rehearse: Conversation Coach (jeanie.dev) listing. https://apps.shipaton.com/app/rehearse-conversation-coach
- [M6] Confident Caller launch thread. https://www.reddit.com/r/AppsWebappsFullstack/comments/1skkona/i_built_a_free_web_app_that_lets_you_practice/
- [M7] Prehearse, as described in Vocal Image roundup (self-interested source). https://www.vocalimage.app/en/articles/37-practice-difficult-conversations-ai-apps/
- [M8] Rehearse Product Hunt overview (maker's claims). https://www.hunted.space/product/rehearse-2
- [M9] Shaikh et al., Rehearsal, CHI 2024. https://arxiv.org/abs/2309.12309
- [M10] BodySwaps features. https://bodyswaps.co/features
- [M11] Vocal Image roundup (see M7).
- [M12] Convo. https://www.tryconvo.app/
- [M13] Murmur App Store listing. https://apps.apple.com/us/app/murmur-ai-practice-calls/id6755495030
- [M14] Shared rehearsal prompts: r/PMOPAWS https://www.reddit.com/r/PMOPAWS/comments/1mm8c55/using_chatgpt_to_practice_difficult_conversations/ ; r/ChatGPT "Difficult Conversation Simulator" https://www.reddit.com/r/ChatGPT/comments/1r01esg/i_made_a_difficult_conversation_simulator_prompt/ ; a-gnt "Conversation Rehearsal" https://a-gnt.com/agents/prompt-conversation-rehearsal ; Promptsmint https://promptsmint.com/prompts/the-difficult-conversation-simulator/
- [M15] Google Meet Help, "Check your mic & camera before joining." https://support.google.com/meet/answer/10409699?hl=en
- [M16] web.dev case study, "How Google Meet improved audio and video permissions." https://web.dev/case-studies/google-meet-permissions-best-practices
- [M17] iGrow listing. https://mwm.ai/apps/igrow-ai-roleplay-practice/6757130429
- [M18] Maison GR, Rehearse. https://www.maisongr.com/en/work/rehearse

Not researched hands-on: Mursion, Second Nature, Retorio, Kognito, ReflexAI, SymTrain, Zenarate. Their mechanics are not cited here.
