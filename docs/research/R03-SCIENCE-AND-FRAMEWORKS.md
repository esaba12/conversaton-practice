# R03: Science and frameworks for conversation rehearsal

Status: research report (planning input, not a spec). Written October 3, 2026. All sources accessed October 3, 2026.

October 3, 21:26 EDT: the user accepted a narrower version of feature 5 ("one more take"). The decision and rationale are in [docs/00](../00-DECISIONS-AND-VIABILITY.md). The buildable shape is [docs/30](../30-ONE-MOMENT-RETRY.md). Where this report's "one more take," counterfactual branches, or replay language conflict with those files, those files win. Scores, a sentence-by-sentence review, and a branching replay stay out.
Scope: evidence behind rehearsal, exposure, communication frameworks, motivation, feedback, arousal regulation, transfer, and safety, translated into product features for the live AI-avatar practice app described in `README.md`, `docs/01-PRD.md`, and `docs/08-SAFETY-AND-PRIVACY.md`.

How to read the strength labels:

- **Strong**: multiple meta-analyses or large RCT bodies agree, in populations reasonably close to ours.
- **Moderate**: at least one meta-analysis or several controlled studies, but with caveats (clinical samples, therapist delivery, heterogeneity, analogue samples).
- **Preliminary**: a few small controlled studies, single RCTs, or strong mechanism data without outcome trials.
- **Weak**: practitioner frameworks, expert opinion, uncontrolled studies, or failed replications.

A recurring caveat applies to almost everything below. Most of the evidence comes from therapist-led treatment for diagnosed social anxiety, from clinical skills training, or from lab tasks. None of it shows that a 3-5 minute AI video call helps ordinary adults with everyday conversations. Those studies would be needed before we could make any efficacy claim. The evidence tells us which design choices are most likely to help and which are most likely to backfire. It does not tell us that the product works.

---

## 1. Summary: the 12 most valuable evidence-informed features

The ranking weighs three things: how strong the evidence is for the underlying mechanism, how much an everyday user would notice and value the feature, and how easily it fits the existing flow (a setup screen, a 3-5 minute call, an optional reflection). Source IDs in brackets refer to section 5.

1. **Prediction card before the call, comparison card after.** Before calling, the user writes the one thing they fear the other person will say or do and rates how likely it is (0-100) and how bad it would be (0-100). Afterward, they see their prediction next to what happened and re-rate it. This is the behavioral-experiment core of cognitive therapy for social anxiety and the "expectancy violation" core of inhibitory-learning exposure. *Mechanism evidence: moderate to strong* [S05, S06, S08, S09]. It is also supported by social-psychology findings that people overestimate how awkward conversations will be and underestimate how much others like them [S30, S31]. *Feasibility: very high.* Phrasing: "Check your prediction," not "challenge your distorted thinking."

2. **Practice followed by specific, behavior-level feedback (never practice alone).** In the only randomized LLM-practice study with a skill outcome (94 novice counselors), practicing with a simulated person *without* feedback made empathy worse, while practice plus structured feedback improved it [S17]. Stanford's Rehearsal system, which combined simulation with theory-grounded feedback, outperformed lectures on a real conflict with a confederate [S14]. The feedback must stay on the task, not the person [S36]. *Evidence: moderate.* This argues for making the AI reflection the default, keeping it optional, and making it behavioral ("You named the request in your second turn"), not evaluative ("You were confident").

3. **If-then plan for the real conversation.** At the end, the user writes one "When ___, I will ___" plan, for example "When she says she's too busy, I'll ask for 10 minutes on Thursday." Implementation intentions have the largest and most replicated effect base of anything here. The original meta-analysis found d = .65 [S38]. A 642-test update found a smaller bias-adjusted average (about d = .35), with larger effects when plans use explicit if-then format and are rehearsed [S39]. There is also a social-anxiety-specific study showing if-then plans reduced threat bias and the underestimation of one's own performance [S40]. *Evidence: strong (general), preliminary (social-anxiety-specific).* *Feasibility: very high.*

4. **A single concrete behavioral goal, with an optional framework-shaped opening line.** The goal is something the user can *do* ("ask for an extension to Friday"), not something they must *feel* or *get* ("stay calm," "get a yes"). An optional "opening line" helper uses I-language plus both perspectives, which lab studies show reduces perceived hostility [S27, S28]. *Evidence: moderate for goal specificity and I-language, weak for any single branded framework.* This is partly built already (goal suggestion in setup).

5. **"One more take" with one change.** After the call, offer a second short run with one specific adjustment (say the ask earlier, drop an apology, try the broken-record response). This reflects deliberate practice (a specific goal, immediate feedback, repetition at the edge of ability) and Bandura's finding that performed success is the strongest source of self-efficacy [S41, S42, S43]. Cap repetitions so this does not become over-rehearsal (see feature 9 and section 4). *Evidence: moderate (mechanism), but deliberate practice explains much less of performance in loosely structured domains than popular accounts claim [S41].*

6. **Drop-one-safety-behavior experiment.** An optional toggle: "This time, try it without ___" (over-apologizing, over-explaining, softening the ask into a question, reading a script). Experimentally dropping safety behaviors produced larger reductions in anxiety and in belief in the feared outcome than exposure alone [S07, S08, S10]. *Evidence: moderate (small and partly analogue samples).* Phrasing: "habits that feel protective but can get in the way," not "safety behaviors" or "symptoms."

7. **User-chosen difficulty with variability, not automatic escalation.** Keep the existing supportive / neutral / mild-pushback setting and add optional "curveballs": the counterpart changes the subject, says "Can we do this later?", or gives a partial yes. Inhibitory learning recommends varying contexts and stimuli rather than marching up a fixed ladder [S06]. Trials of variable versus hierarchical exposure show variability is at least as good, with mixed evidence that it is better [S11, S12]. The user always chooses. The app never escalates on its own, which matches `docs/08`. *Evidence: preliminary to moderate.*

8. **Real-world follow-up loop.** After the practice, the user can optionally set the date of the real conversation. Then there is an in-app check-in, with no push notification unless the user opts in: "Did it happen? What did they actually say? How does that compare with your prediction?" This closes the behavioral experiment in the real world, which is where the learning that matters takes place. Transfer of training is stronger when motivation and a supportive environment are present, and open interpersonal skills are the hardest to transfer [S44]. *Evidence: moderate for the principle, untested for apps like ours.* "Not yet" and "I decided not to" must be first-class answers.

9. **Bounded, self-compassionate reflection that guards against rumination.** Post-event rumination correlates moderately with social anxiety (r ≈ .45) and helps maintain it [S20, S21]. Self-compassion interventions reduce self-criticism and rumination (about g ≈ .5 for self-criticism) [S46, S47] and increase motivation to improve after failure [S48]. So the reflection should be short (three cards maximum), include one thing that went okay, and close firmly. There should be no replay-every-sentence view, no score, and no unlimited "analyze it more." *Evidence: moderate.* This matches the existing no-score design and justifies keeping it.

10. **Optional 60-second breathing warm-up before the call.** This is cyclic sighing (two inhales through the nose, one long exhale), offered as a skip-able pre-call screen. One remote RCT found 5 minutes a day of cyclic sighing improved mood and lowered respiratory rate more than mindfulness meditation [S49]. A meta-analysis of breathwork RCTs found small-to-medium effects on stress and anxiety [S50]. *Evidence: preliminary for a single 1-minute dose, moderate for breathwork generally.* Phrasing: "A minute to settle, if you'd like." Never call it treatment. Never require it.

11. **"Name it" check-in (affect labeling).** Before and after the call, the user can tap or type a word for what they feel ("nervous," "annoyed," "relieved"). In an RCT, labeling emotions during exposure to public speaking reduced physiological arousal more than exposure alone, though self-reported fear was unchanged [S13]. *Evidence: preliminary.* It is cheap, it doubles as a simple distress check for safety (section 4), and it pairs naturally with feature 1.

12. **Scenario-matched framework hints.** Offer an optional, collapsible hint matched to the scenario type: DEAR MAN for requests, broken record and fogging for saying no, the six apology components for apologies, Situation-Behavior-Impact for feedback, interests and BATNA for negotiation, and "make it safe" / three conversations for emotionally loaded talks. The counterpart prompt can also reflect these, the way Rehearsal grounded its simulation in the Interests-Rights-Power framework [S14]. *Evidence: varies by framework, from moderate (apology components, I-language) to weak (most branded frameworks).* *User value: high*, because people want to know what to say.

Notable non-recommendations:

- **"Reframe your anxiety as excitement" as a headline feature.** The original finding [S51] did not replicate on observer-rated performance in a 2025 direct replication [S52]. It can appear as one optional line, labeled as a tip, not as evidence.
- **Waiting for anxiety to fall before ending.** Inhibitory learning research shows fear reduction during exposure does not predict long-term outcome [S06]. Do not tell users they "should feel calmer by the end."
- **Long pre-call cognitive restructuring.** Talking users out of their fear before the call may weaken the prediction-versus-outcome contrast [S06]. Keep pre-call prompts brief and save processing for afterward.

---

## 2. Detailed evidence and implied features

### 2.1 Behavioral rehearsal, role-play, social skills training (SST), assertiveness training

**What the evidence says.**

- A network meta-analysis of 101 trials (13,164 participants) for adult social anxiety disorder found individual CBT had the largest effect versus waitlist (SMD -1.19). Exposure plus social skills training was also effective (SMD -0.86). Only individual CBT beat a psychological placebo [S01]. Rehearsal-based skills work therefore helps within structured treatment, but it is not the strongest standalone component.
- A 2026 systematic review of 22 SST studies for social anxiety (ages 6-78, mostly youth) found positive effects in most trials, with gains maintained from 6 months to 5 years. The authors called for more rigorous adult studies [S02]. The core components across programs were instruction, modeling, behavioral rehearsal (role-play), corrective feedback, and homework.
- SST augmented group CBT for social anxiety disorder in an RCT [S03].
- Assertiveness training has a substantial older evidence base across anxiety, depression, and relationship problems, but has faded as a standalone treatment. Its skills now live inside DBT, ACT, and behavioral activation [S04].
- In therapy, behavioral rehearsal is usually brief, repeated, coached, and immediately followed by feedback and homework in the real world. It does not stand on its own.

**Strength: moderate** (as a component of structured treatment, mostly clinical samples).

**Implied features.**
- Keep the full SST loop in the product: an optional hint (instruction/modeling) → live practice (rehearsal) → specific feedback → one real-world step (homework). Today the app does rehearsal very well. The surrounding steps are where most of the research value lies (features 2, 3, 8, 12).
- Treat the founder's experience (a therapist role-playing a feared conversation) as the inspiration, while being honest that the therapist also supplied the coaching, judgment, and safety net. Our reflection stage and safety guardrails stand in for those parts, imperfectly.

**Phrasing without clinical claims.** "Practice the conversation out loud before you have it." Avoid "social skills training," "therapy-style," and "clinically proven technique."

### 2.2 Exposure principles: hierarchies, SUDS, inhibitory learning, safety behaviors, behavioral experiments, post-event processing

**What the evidence says.**

- **Inhibitory learning (Craske et al., 2014).** Exposure works by forming new "this is safer than I thought" associations that compete with old fear associations, not by making fear fade. The recommended strategies are expectancy violation, deepened extinction, occasional reinforced extinction, removal of safety signals, variability, retrieval cues, multiple contexts, and affect labeling. The authors note that fear reduction during exposure does not predict long-term outcome. They recommend consolidating learning afterward by asking what was predicted, what happened, and how surprising it was, and they advise against cognitive restructuring before exposure because it can blunt the mismatch [S06].
- **Behavioral experiments (Clark & Wells cognitive model).** In cognitive therapy for social anxiety disorder, experiments are recommended in most sessions. A signature experiment has the person do two conversations, one self-focused with safety behaviors and one externally focused without them, and compare the outcomes [S05]. A systematic review of behavioral experiments versus exposure alone found tentative evidence favoring experiments, especially for social anxiety. Most of those studies used brief exposure and analogue samples [S09].
- **Safety behaviors.** In a within-subject experiment, exposure plus dropping safety behaviors beat exposure alone on anxiety and belief in the feared catastrophe [S07]. Manipulating safety behaviors and self-focus experimentally showed they increase anxiety and worsen both perceived and actual performance [S08]. Clinical self-help material recommends dropping them, all at once if possible or gradually if not [S10].
- **Hierarchies and variability.** Random/variable exposure was as effective as blocked/hierarchical exposure, and greater variability in fear during exposure predicted lower fear at follow-up [S11]. In obsessional thoughts, variable exposure showed continued improvement at 3 months, but the difference was not significant [S12]. Hierarchies are sufficient but not necessary.
- **SUDS.** The 0-100 Subjective Units of Distress scale has modest validity evidence. Emotional SUDS correlated with clinician-rated functioning (r = -.44) and was sensitive to treatment [S54]. A 2025 review argues its clinical use outruns its psychometric base [S54].
- **Affect labeling.** Labeling emotions during public-speaking exposure reduced physiological arousal more than exposure alone, with no difference in self-report [S13].
- **Video feedback.** In cognitive therapy for social anxiety, 98% of 47 patients saw that they came across better than predicted after watching video of themselves, and anxiety dropped the following week [S22]. This worked only with cognitive preparation: predict in detail, imagine it, then watch "as if watching a stranger" [S23]. Studies that skipped preparation failed [S22].
- **Post-event processing.** Repetitive, self-critical review after social events is a maintaining factor in cognitive models [S19]. A 2024 meta-analysis found a moderate association with social anxiety (r ≈ .45) [S20]. Pre-event and post-event rumination respond to treatment, with large within-group effects (g ≈ .83-.86) and larger effects when rumination is targeted directly [S21]. Reassurance seeking gives short relief but maintains anxiety [S53].

**Strength: moderate to strong** for the mechanisms in clinical populations. Applying them to non-clinical everyday rehearsal is reasonable but untested.

**Implied features.**
- *Prediction card → comparison card* (feature 1). Make the prediction specific and behavioral. "She'll say I'm being unreasonable" works; "I'll be anxious" does not [S06]. After the call, ask three things: what happened, how it compared with the prediction, and how surprised they were (0-100).
- Be honest that the AI is not the real person. The comparison is "Your prediction vs. this practice," and then, in the follow-up, "vs. the real conversation." The second comparison is the one that matters. Never imply the avatar's behavior predicts the real person's.
- *Drop-one-habit toggle* (feature 6) with a small menu: over-apologizing, over-explaining or justifying, asking permission instead of stating, rehearsing word-for-word, avoiding eye contact (only if the camera is on, and only as a self-chosen intention since the app never analyzes video).
- *Curveball variability* (feature 7). Users can practice the same goal with a different counterpart mood, opening, or objection. Practicing the same script repeatedly against the same response is the least useful pattern.
- *Optional self-view replay?* Video feedback is powerful only with careful preparation and discussion. Recording the user also conflicts with the current privacy defaults (no recording, camera local only). **Recommendation: do not add self-video replay now.** If ever considered, it needs the prediction → "watch as a stranger" → compare protocol and explicit opt-in recording.
- *Anti-rumination guardrails* (feature 9): bounded reflection, no transcript scrubbing, a "close for today" ending, and the reassurance policy in `docs/08`.
- *SUDS*: use a simple 0-100 "How nervous are you?" slider before and after, framed as personal curiosity, not measurement. Do not chart it as a clinical outcome or show "anxiety reduced 40%."

**Phrasing.** "Write down what you're worried they'll say. Afterward you can compare." "Notice what actually happened." Avoid "exposure," "fear hierarchy," "extinction," "treat," "reduce your anxiety," and "cognitive distortions."

### 2.3 VR exposure, AI avatars, and LLM social-skill training (2014-2026)

**What the evidence says.**

- **VR exposure for social anxiety.** A 2024 meta-analysis of 17 RCTs found VR exposure beat waitlist (g = 0.48 at post, 0.76 at 3-month follow-up in one pooled trial) and performed similarly to other active interventions, including in-vivo exposure [S24]. An earlier meta-analysis found no difference between VR and in-vivo/imaginal exposure (g = -0.01) [S25]. A 2020 meta-analysis of 22 studies found VR similar to in-vivo exposure right after treatment but *inferior at later follow-up* [S26]. Nearly all of this is therapist-guided, multi-session, and in clinical samples.
- **Avatar-based job interview training (autism).** In a small single-blind RCT (n = 26), virtual-character interview practice improved live role-play interview performance compared with treatment as usual (p = .046) [S15].
- **Rehearsal (Shaikh et al., CHI 2024).** An LLM conflict simulator grounded in Interest-Rights-Power theory, with counterfactual "what if" branches and feedback. With n = 40, compared with lecture material on the same theory, trained users in a real conflict with a confederate cut competitive strategies by 67% and doubled cooperative strategies. Theoretical knowledge did not improve [S14].
- **APAM (Yang et al., 2024).** A position paper proposing that an AI Partner (simulation) and an AI Mentor (feedback) are both necessary [S16]. It is a framework, not outcome evidence.
- **CARE RCT (2025).** 94 novice counselors practiced with LLM-simulated clients, with or without structured AI feedback. With feedback, reflections and questions improved (d ≈ .32-.39). Practice-only participants got *worse* on empathy (d = -.52). The between-group empathy difference was d = .72 [S17]. There was no human-trainer or no-practice control.
- **AI versus actor simulation for medical consultation skills.** In a randomized crossover study with 378 respondents, both modes improved self-rated skills. AI was slightly inferior (by 0.36 points on a 10-point scale), satisfaction was lower, and it cost about half as much [S18].
- **Standardized patients and peer role-play.** Simulated-participant teaching beat traditional formats on communication skills (SMD 0.74, very high heterogeneity) [S55, unverified authors]. Standardized patients and peer role-play were largely equivalent except for self-confidence [S56].
- **Automated versus human-led SST.** In a small RCT of healthy adults (n = 45), human-led SST improved a role-play facial-expression measure while automated SST showed no significant effect [S57, preprint].
- **LLM exposure prototypes.** VChatter (10 users, 6 days, uncontrolled) reported reduced social anxiety [S58]. An RCT of AI-delivered CBT and psychodynamic therapy for social anxiety disorder (n = 102) found moderate within-group improvement but no significant superiority over waitlist at post-treatment. It also found poorer outcomes for participants with ADHD or autism, and common "negative effects" (unpleasant feelings, resurfacing memories) [S59].

**Strength: preliminary** for AI-avatar roleplay helping everyday conversations. **Moderate** for VR exposure as a clinician-delivered treatment.

**Implied features.**
- Pair the AI Partner with an AI Mentor (feature 2). CARE's result means feedback is not optional polish: practice alone may even entrench worse habits.
- Ground the counterpart in a communication framework, as Rehearsal did, so pushback is realistic and teachable rather than random.
- Consider a "what if I'd said ___?" counterfactual as a later feature. Rehearsal used it well, but `docs/08` excludes replay trees from the MVP for rumination reasons. If added later, it should be one alternate line, not a branching tree, and limited.
- Accommodate neurodivergent users. Offer optional explicit structure (turn-by-turn hints, a slower pace, written captions on) instead of assuming the open-ended flow suits everyone [S15, S59].
- Measure our own outcomes honestly. Collect opt-in "Did the real conversation happen?" data and report it as user feedback, not efficacy.

**Phrasing.** "Inspired by research on practice and feedback." Do not say "VR exposure therapy," "proven by Stanford," or "clinically validated."

### 2.4 Communication frameworks as scaffolds

The research base for branded communication frameworks is thin. They are useful as structure for hints, goals, and counterpart behavior, not as claims.

| Framework | What it asks the user to do | Evidence | Best scenario fit |
|---|---|---|---|
| DBT DEAR MAN / GIVE / FAST | Describe facts, Express feelings, Assert the ask, Reinforce; stay Mindful, Appear confident, Negotiate. GIVE protects the relationship; FAST protects self-respect | DBT skills training reduces symptoms in borderline personality disorder samples [S32, S33]; isolated evidence for the interpersonal module is weak, and one study found only emotion regulation uniquely predicted outcomes [S32] | Requests, saying no, boundaries |
| I-statements | "I feel / I need" instead of "You always" | Lab vignette studies: you-statements rated more aversive [S27]; I-language plus acknowledging both perspectives produced the least defensiveness [S28]. **Moderate** (vignettes, not live conversations) | Openers in any conflict |
| Nonviolent Communication (observation, feeling, need, request) | Separate observation from judgment; end with a concrete request | Systematic review: 13 heterogeneous small studies, mostly positive, no meta-analysis possible [S29]; one RCT in 312 medical students showed a small empathy gain at 3 months [S34]. **Weak to preliminary** | Roommates, family, partners |
| Crucial Conversations (STATE; "make it safe") | Share facts, tell your story tentatively, ask for others' paths; restore safety when the other person goes silent or aggressive | Practitioner book [S62]; no peer-reviewed outcome trial identified in this session. **Weak** | High-emotion talks with a boss or family |
| Difficult Conversations (three conversations: what happened, feelings, identity) | Shift from blame to contribution; acknowledge feelings; notice identity threat | Practitioner book [S63]; no outcome trial identified. **Weak** | Preparation prompts |
| Getting to Yes (interests over positions, options, criteria, BATNA) | Know your walk-away alternative and their interests | Book [S64]. Negotiation training generally improves outcomes. Comparing two cases tripled transfer of an integrative strategy versus studying cases separately [S35]. **Moderate** for training methods, weak for the specific formula | Raises, rent, splitting costs |
| Motivational Interviewing OARS (open questions, affirmations, reflections, summaries) | Listening behaviors | Used as the coding framework in CARE [S17]; MI efficacy itself not reviewed here | When the user's goal is to understand someone or de-escalate |
| Broken record; fogging | Calmly repeat the position; agree with any grain of truth without conceding | Assertiveness-training canon [S65]; no modern controlled tests found. **Weak** | Saying no to persistent requests |
| SBI (Situation, Behavior, Impact) | Specific, observable, non-judgmental feedback, optionally followed by asking about intent | Practitioner model from the Center for Creative Leadership [S66]; consistent with Kluger & DeNisi's task-focus finding [S36]. **Weak to moderate** | Giving feedback to a peer or report |
| Apology components | Acknowledge responsibility, offer repair, express regret, explain, declare repentance, request forgiveness | Two experiments (n = 755): more components work better; acknowledging responsibility matters most and offering repair second; requesting forgiveness matters least [S37]. **Moderate** (vignette studies) | Apologizing |

**Implied features.**
- **Scenario-type classifier in setup.** The setup model tags each scenario (request, refusal, boundary, feedback, apology, negotiation, disclosure) and attaches one matching collapsible hint (feature 12). One hint, not a curriculum.
- **Framework-aware goal suggestions.** Examples: "Make one clear request with a time," "Say no once and repeat it once without adding a reason," "Acknowledge your part and offer one repair."
- **Framework-aware counterpart.** Mild pushback follows realistic patterns (deflection, partial agreement, counter-offer, emotional reaction). The counterpart never coaches, consistent with P11 in the PRD.
- **Framework-aware reflection.** "You used an I-statement in turn 2." "You offered a repair but not acknowledgment." Report this only when the transcript supports it, and otherwise say evidence is insufficient (PRD P08).
- **Opening-line helper.** One suggested first sentence using I-language plus both perspectives [S28], which the user can edit or ignore. This is not a full script, so it respects the "no written scripts by default" decision.

**Phrasing.** "A common structure for asking for something is..." Credit sources by name where appropriate (for example, "from DBT's DEAR MAN skill"). Never imply therapy is being delivered, and avoid "DBT skills training."

### 2.5 Deliberate practice, implementation intentions, self-efficacy, mental contrasting (WOOP)

**What the evidence says.**

- **Deliberate practice.** Practice designed to improve performance (specific goals, feedback, repetition at the edge of ability) matters, but less than popularly claimed. It explained 26% of performance variance in games, 21% in music, 18% in sports, 4% in education, and under 1% in professions. Effects were larger in predictable environments [S41]. Conversations are low in predictability, which argues for practicing variants rather than one script.
- **Implementation intentions.** The original meta-analysis found d = .65 across 94 tests [S38]. The 2024 update across 642 tests found .27 ≤ d ≤ .66 depending on outcome type, with a sample-weighted d = .36 and strong evidence of publication bias and heterogeneity (a robust Bayesian estimate was as low as d = .15). Effects were larger for explicit if-then plans, high motivation, and rehearsed plans [S39]. In social anxiety, if-then plans reduced attentional bias to threat and prevented performance underestimation after a speech [S40].
- **Self-efficacy.** Performance accomplishments (mastery experiences) are the strongest source of self-efficacy [S42]. A model-based meta-analysis confirmed they have by far the strongest unique association [S43]. Mastery only counts if people attribute success to themselves rather than to an easy task or outside help [S43 discussion].
- **Mental contrasting with implementation intentions (WOOP: Wish, Outcome, Obstacle, Plan).** A meta-analysis of 21 studies (N = 15,907) found g = 0.34, larger when delivered interactively (g = 0.47) than through documents (g = 0.28), with some publication bias [S45].

**Strength: strong** (implementation intentions in general), **moderate** (WOOP, mastery), **moderate with caveats** (deliberate practice).

**Implied features.**
- *If-then card* at the end of every session (feature 3), prefilled from the transcript: "When [their likely objection], I will [the line that worked]." The user edits it. Offer to rehearse the plan once more in a 60-second mini-take, since rehearsed plans have larger effects [S39].
- *WOOP-style setup in 4 short fields:* what you want from this conversation (Wish), the best realistic outcome (Outcome), what is most likely to get in the way, inside you or from them (Obstacle), and your if-then (Plan). Delivering it interactively (the app asks, the user answers) matches the stronger subgroup [S45]. This can merge with the prediction card so setup stays short.
- *Mastery attribution in reflection:* "You did this, the counterpart didn't make it easy" (when pushback was neutral or mild). Avoid "Great job!" praise inflation.
- *"One more take"* (feature 5) with a single focused change, at most two additional takes per sitting by default.

**Phrasing.** "Make a plan for the moment it gets hard." Avoid "rewire your brain" and "build habits that stick."

### 2.6 Feedback science and self-compassion

**What the evidence says.**

- **Feedback can harm.** Across 607 effect sizes, feedback improved performance on average (d = .41), but more than a third of feedback interventions *decreased* performance. Effectiveness fell as feedback drew attention toward the self (self-evaluation, self-esteem) and away from the task [S36].
- **Practice without feedback can harm.** In CARE, the practice-only group lost empathy skill [S17].
- **Self-compassion.** Meta-analyses found moderate reductions in self-criticism (g = 0.56 [S46]; g = 0.51 [S47]) and a large but very heterogeneous reduction in rumination (g = 1.37 [S46]). Self-compassion after failure increased motivation to improve compared with self-esteem boosting or distraction [S48].
- Socially anxious people recall their performance more negatively than it was, even after positive feedback [S20 introduction]. Neutral reflection prompts may be read through a negative filter.

**Strength: moderate.**

**Implied features.**
- AI reflection rules: (a) describe observable behaviors with quotes or turn references, (b) tie each comment to the user's chosen goal, (c) give at most one "next time" suggestion, (d) no personality judgments, (e) no score, (f) say "not enough evidence" rather than guess. This is consistent with the current What you did / Takeaway / Next time design.
- Lead with what the user did toward the goal before anything else, but keep it factual so it is credible.
- One self-compassion line when the user rates the practice as bad: "Hard conversations are hard for most people. One rough practice tells you what to try next, not who you are." Do this without therapeutic framing.
- The optional self-reflection asks what they did, not how they came across, to avoid triggering self-focused evaluation.

**Phrasing.** "Here's what you did and one thing to try." Avoid "your communication score" and "you seemed insecure."

### 2.7 Arousal regulation before hard conversations

**What the evidence says.**

- **Cyclic sighing (Balban et al., 2023).** In a remote RCT, 5 minutes a day for a month of exhale-focused cyclic sighing improved positive mood and reduced respiratory rate more than mindfulness meditation. All arms reduced state anxiety [S49]. This tested daily practice, not a single pre-event dose, and the sample was not clinical.
- **Breathwork meta-analysis.** Twelve RCTs (785 adults) found breathwork lowered stress (g = -0.35) and anxiety (g = -0.32). Most studies carried moderate risk of bias, and the authors warn against hype [S50].
- **Anxiety-as-excitement reappraisal.** The original study [S51] found saying "I am excited" improved rated performance. A 2025 direct replication reproduced only the self-reported excitement increase. Observer-rated performance and an indirect anxiety measure did not differ [S52]. **Weak.**
- **Affect labeling** (see 2.2): preliminary physiological benefit [S13].

**Strength: preliminary to moderate** for breathing, **weak** for excitement reappraisal.

**Implied features.**
- Optional 60-second cyclic-sigh screen before "Join call," with a visual pacer, skip-able, and remembered as a preference. It can double as the camera/mic permission wait.
- Do not make calm a goal. The goal is the behavior. Inhibitory learning explicitly does not require anxiety to drop [S06], and `docs/08` already says "Do not require anxiety to disappear before finishing."
- The excitement line, if used, is phrased as "Some people find it helps to think of the jitters as energy." Never cite it as proven.

### 2.8 Transfer and follow-up

**What the evidence says.**

- Transfer of training relates to motivation, conscientiousness, cognitive ability, and a supportive environment. Predictors matter *more* for open skills (like interpersonal skills) than closed ones, and same-source self-reported transfer inflates estimates [S44].
- Comparing two examples that share a principle roughly tripled transfer in negotiation; studying cases separately was no better than no training [S35].
- In SST, homework (real-world practice) is a core component [S02]. In cognitive therapy for social anxiety, learning is consolidated by comparing prediction with outcome [S05, S06].
- Retrieval cues and multiple contexts reduce relapse of fear after exposure [S06].

**Strength: moderate** (organizational and learning science), **untested** for consumer AI rehearsal.

**Implied features.**
- *Real-world follow-up loop* (feature 8): an optional date, an optional reminder (opt-in only), and a check-in screen with "Did it happen? / What did they say? / Compare with your prediction / What will you keep doing?"
- *Retrieval cue:* a takeaway card the user can screenshot or save (one sentence plus the if-then plan). This is the "pocket card" to glance at right before the real conversation. It persists only if saved, matching the approved-memory model.
- *Compare two practices:* after a second take, show both takeaways side by side and ask what the common thread was. This is analogical encoding [S35], lightweight and without transcripts.
- *Honest measurement:* label any outcome stats as "what users told us," never as effectiveness.

### 2.9 Safety risks of AI roleplay (summary; full guardrails in section 4)

**What the evidence says.**

- **Unsafe LLM responses in mental-health contexts.** LLMs expressed stigma and responded inappropriately to delusions, suicidal ideation, and OCD prompts, partly from sycophancy. Newer and larger models did not reliably fix this [S67]. Practitioner-informed analysis of 137 sessions identified 15 ethical violations, including "deceptive empathy" and poor crisis handling. Prompting did not reliably prevent them [S68].
- **Dependency.** In a four-week RCT (n = 981), heavier voluntary chatbot use was associated with more loneliness, emotional dependence, and problematic use and less real-world socializing, regardless of condition [S69]. A commentary argues the data do not establish causal harm [S70]. Our design is task-bounded by default, which is protective, but saved people with memory and voice could drift toward companionship.
- **Symptom activation.** AI-delivered therapy participants commonly reported unpleasant feelings and resurfacing memories [S59].
- **Reassurance and over-rehearsal.** Excessive reassurance seeking maintains anxiety [S53]. Anticipatory rumination (pre-event processing) and impression-management rehearsal maintain social anxiety [S21, S71].
- **Professional guidance.** The APA's November 2025 health advisory says GenAI chatbots and wellness apps should not replace qualified care, warns about dependence and unpredictable crisis handling, and urges extra protection for vulnerable users [S72]. The FDA's Digital Health Advisory Committee (Nov 6, 2025) noted no GenAI mental-health device has been authorized and advised clinician oversight, human escalation, and clear AI disclosure for such devices [S73].

**Strength: moderate** that these risks are real, **preliminary** on magnitude.

---

## 3. Proposed evidence-informed practice journey

Steps marked **(core)** already exist or are essential. Everything else is optional and skip-able. Total added time for a user who accepts every optional step is about 3 minutes before and 2 minutes after the call.

**A. Before the call (setup, about 2-4 minutes)**

1. **(core) Describe the situation.** The generated persona and scenario remain editable, as today.
2. **(core) One behavioral goal.** Suggested by the model, editable. It must be something the user does, not a feeling or an outcome they control. *Evidence: goal specificity, implementation intentions [S38, S39].*
3. **(optional) Prediction card.** "What are you most worried they'll say or do?" Likelihood 0-100 and how bad it would be 0-100. *[S05, S06]*
4. **(optional) Obstacle → if-then.** "What's most likely to throw you off?" → "When that happens, I will ___." *[S39, S45]*
5. **(optional) One habit to drop this time.** Pick from a short menu or skip. *[S07, S08]*
6. **(optional) Framework hint.** One collapsible hint matched to the scenario type plus an editable opening line. *[S28, S37]*
7. **(optional) "Name it" + nervousness slider.** One word plus 0-100. *[S13, S54]*
8. **(optional) 60-second breathing pacer.** *[S49, S50]*
9. **(core) Challenge level** (supportive / neutral / mild pushback), plus optional curveballs. *[S06, S11]*

**B. The call (3-5 minutes, core)**

10. **Live roleplay.** The counterpart stays in character, never coaches, and reflects the chosen difficulty and framework-realistic pushback. The persistent End and Help controls remain. Crisis and abuse cues trigger an out-of-character exit (section 4).
11. **No mid-call scoring or nudges by default.** Mid-call coaching would increase self-focused attention [S08, S36]. A possible later option: one optional, user-requested "hint" button that pauses the counterpart's speech. It must not be labeled "pause" if media keeps running (per `AGENTS.md`).

**C. After the call (1-3 minutes)**

12. **(optional) Comparison card.** Prediction vs. what happened in practice, re-rated likelihood, and how surprised they were. *[S06]* Include a note that this was a practice partner, not the real person.
13. **(optional) Self-reflection.** "What did you do toward your goal?" One line.
14. **(optional) AI reflection** (What you did / Takeaway / Next time). Behavior-level, goal-linked, evidence-gated, no score. *[S17, S36]*
15. **(optional) One more take** with one change, capped at two by default. *[S41, S42]*
16. **(optional) If-then card + takeaway card**, saved only if the user chooses. *[S39, S44]*
17. **(core) Close.** End firmly: "You can stop here." No "analyze more" loop. *[S20, S21]*

**D. The real conversation (outside the app)**

18. **(optional) Date of the real conversation** and an opt-in reminder to glance at the takeaway card beforehand. There are no messages to the real person, no contact access, and no automatic outreach, consistent with `AGENTS.md`.

**E. Follow-up (optional, in-app)**

19. **Check-in:** "Did it happen?" (yes / not yet / decided not to; all valid). If yes: what did they actually say, how it compared with the original prediction, and one thing to keep. *[S05, S06, S44]*
20. **Gentle closure.** If it went badly: a self-compassion line and the option to practice a *different* follow-up conversation, not to replay the same one [S48].
21. **No streaks, no pressure.** Progress means conversations the user chose to have, not app usage time (`docs/08`). Discourage repeated reassurance practice (section 4).

---

## 4. Safety and claims guardrails

### 4.1 What we must not say

The legal landscape below is a research summary, not legal advice. Several laws turn on statutory definitions that need counsel review before any public launch.

**Never use these in marketing, UI copy, model outputs, or the pitch:**

- "Therapy," "therapist," "AI therapist," "psychotherapy," "counseling," "treatment," "clinical," "clinically proven," "evidence-based treatment," "exposure therapy," "CBT," "DBT skills training," "diagnose," "symptoms," "disorder," or "cure."
- "Reduces anxiety," "treats social anxiety," "proven to help," "backed by science," "validated," or "used by psychologists," unless a specific claim has been substantiated and reviewed.
- "Predicts how they'll react," "know what they'll say," "talk to [real named person]," or any implication that the avatar reflects the real person.
- "Your [name] understands you" or "I'm here for you anytime." This is companion framing and "deceptive empathy" [S68].
- "Confidential like a therapist" or "private" without the provider-processing caveats in `docs/08`.
- Counterpart or reflection outputs that claim to detect emotions or mental states ("You seemed anxious," "I sense you're upset") from voice or video. Illinois prohibits licensed professionals from letting AI "detect emotions or mental states" in therapy [S74]. We are not a therapy service, but avoiding emotion-inference language keeps us clearly outside that framing, and the app never analyzes video anyway.

**Do say:**

- "A practice tool for everyday conversations. Not therapy or medical advice, and not a crisis service."
- "Practice out loud with a fictional AI partner. It can't predict what a real person will say."
- "Ideas drawn from research on practice, feedback, and planning." This is acceptable only alongside the not-therapy line and without efficacy claims.
- "If you're in crisis, contact local emergency services or a crisis line" (with verified numbers per region).

**Why this matters now (dated regulatory facts):**

| Date | Jurisdiction / body | What it does | Relevance to us | Verification |
|---|---|---|---|---|
| May 7, 2025 (effective) | Utah HB 452 | Regulates "mental health chatbots": AI disclosure before access, after 7 days of non-use, and on request; restricts data sales and sharing and in-chat ads; affirmative defense for filed safety policies; up to $2,500 per violation [S75, S76] | Applies if we market as helping mental health; a practice-tool framing likely avoids it, but disclosure is cheap | Enrolled bill text + law firm summary |
| June 5, 2025 (signed); July 1, 2025 (effective) | Nevada AB 406 | Prohibits offering AI programmed to provide professional mental/behavioral health care, or representing that AI can; civil penalties up to $15,000 [S77, S78] | Do not represent the product as mental-health care | Enrolled bill + law firm summary |
| Aug 1, 2025 (Public Act 104-0054; effective immediately) | Illinois HB 1806, Wellness and Oversight for Psychological Resources Act | No one may provide, advertise, or offer therapy/psychotherapy, including through internet-based AI, unless a licensed professional conducts it; up to $10,000 per violation [S74, S79] | Never advertise or describe the product as therapy | Statute text + IDFPR press release |
| Sept 11, 2025 | FTC 6(b) orders | Study (not enforcement) of AI companion chatbots at 7 companies: safety testing, character approval, monetization of engagement, minors [S80] | Signals scrutiny of persona-based products; keep engagement-maximizing design out | FTC press release |
| Oct 13, 2025 (signed); Jan 1, 2026 (effective) | California SB 243, companion chatbots | Disclosure when a user could think the bot is human; published suicide/self-harm protocol with crisis referrals; extra protections for known minors; annual reporting from July 1, 2027; private right of action [S81, S82] | Whether a task-bounded practice partner is a "companion chatbot" under the statute's definition was **not verified**. Saved people with memory push toward it. Implement the protocol and disclosure regardless | Legislature bill pages |
| Nov 5, 2025 (effective) | New York GBL Article 47, AI companion models | Protocol to detect and address suicidal ideation/self-harm with crisis referral; notice that the AI is not human at session start and every 3 hours; AG penalties [S83, S84] | Same definitional question; same cheap mitigations | Governor's letter + bill text |
| Nov 6, 2025 | FDA Digital Health Advisory Committee | No GenAI mental-health device authorized; advised clinician oversight, escalation, disclosure for such devices [S73] | Making treatment claims could pull the product toward device regulation | FDA meeting summary |
| Nov 13, 2025 | APA health advisory | Chatbots/wellness apps should not replace qualified care; warns of dependence, unpredictable crisis handling; calls for laws barring AI posing as licensed professionals [S72] | Reinforces positioning and dependency guardrails | APA advisory |
| Apr 1, 2026 (enacted); July 1, 2026 (effective) | Tennessee SB 1580 | Bars developing or deploying AI that advertises or represents itself as a qualified mental-health professional [S85] | Same as Nevada | **Secondary source only** |
| Apr 13, 2026 (enacted); July 29, 2026 (effective) | Maine LD 2082 | Offering therapy via AI without a licensed professional is an unfair trade practice [S86] | Same as Illinois | Enacted bill text (effective date from secondary source) |
| June 3, 2026 (signed); Aug 12, 2026 (effective per secondary source) | Colorado HB26-1195 | Restricts psychotherapy professionals' AI use; exempts "educational, administrative, simulation, or training purposes" for regulated professionals [S87] | Positioning as practice/training aligns with the exemption's language, but it applies to professionals, not to us | Legislature page (effective date secondary) |
| June 17, 2026 (enacted, effective on passage) | Vermont H.816 | Mental-health services must be delivered by professionals, not independently by AI [S88] | Same as Illinois | Passed-bill text (unofficial) + secondary |
| June 22, 2026 (enacted) | Rhode Island S 2197 Sub A | Oversight of AI in mental health care; bans offering therapy via internet-based AI without a licensed professional [S89] | Same as Illinois | Public law text; effective date **not verified** |
| June 10, 2025 | Consumer coalition complaint to FTC and all state AGs | Alleged Character.AI and Meta AI Studio "therapy bots" claimed false licensure and confidentiality [S90] | Never let a counterpart claim credentials, even in roleplay (for example, a user-created "therapist" persona) | Complaint PDF |

No FTC enforcement action specifically against an AI therapy or mental-health chatbot was found in this session's searches. The September 2025 6(b) inquiry is a study, not an enforcement case.

### 4.2 What we should detect

Detection will be imperfect. Every detector needs test cases (as `docs/08` already requires), and the static Help/End control must keep working when detection misses something.

1. **Imminent risk to self or others.** Explicit suicidal ideation, self-harm intent, plans to harm someone, or immediate danger, in setup text, live transcript, or reflection inputs. Response: stop the scene, leave character clearly, give a brief supportive message and region-appropriate crisis resources, and offer to end. Do not resume the roleplay automatically. This is already specified in `docs/08`; the CA and NY laws make a *published* protocol prudent [S81, S83].
2. **Abuse, coercion, or unsafe relationship disclosures.** Setup descriptions like "practice confronting my abusive partner/parent" or "he hits me when I bring it up." Response: no improvised escalation. Acknowledge the situation, explain the scope, offer safety resources (verify a domestic-violence hotline per region before shipping), and offer a *different* ordinary scenario. Confronting someone who poses a physical risk is a safety-planning question, not a communication-practice one.
3. **Trauma reenactment.** Requests to simulate a specific past assault, abuse incident, or humiliation, or a deceased person. Response: decline, as in `docs/08`. Symptom activation and resurfacing memories were common even in structured AI interventions [S59].
4. **Over-rehearsal and reassurance seeking.** Signals: the same scenario practiced many times in a short window (for example, more than 3 takes in a sitting or more than 5 in 24 hours, thresholds to be tuned), repeated "Will it go okay?" / "Tell me they'll say yes" requests, or the real-conversation date repeatedly postponed. Response: acknowledge uncertainty without guaranteeing anything, point out that more practice of the same version adds less than the real conversation, and offer to set the real date or close for today [S53, S21]. Never block a user outright.
5. **Escalating distress.** The "name it" word or nervousness slider is very high after the call, or the user writes something like "I can't do this, I'm worthless." Response: a self-compassion line, the option to stop, and the support resources link. Do not push another take.
6. **Companion drift.** Signals: daily open-ended chatting with a saved person outside any goal, or attachment language toward the counterpart ("you're the only one who listens"). Response: gently restate what the tool is and point toward human connection. Do not add features that reward time-in-app [S69, S72].
7. **Likely minors.** Age-gate at sign-up. Text signals ("I'm in 8th grade," "my mom took my phone") lead to a scope message and resources for young people. CA SB 243 imposes extra duties for known minors [S81].
8. **Persona credential claims.** A user-created persona labeled as a doctor or therapist must never claim real licensure or give clinical advice in character. Strip or override such instructions [S90].

### 4.3 What we should refuse

- Roleplaying a counterpart who threatens, uses slurs, sexually harasses, or escalates cruelty, even at the highest challenge level (`docs/08`: mild pushback never means cruelty).
- Simulating a specific real, identifiable person as a prediction ("be my boss, Jane Doe, and tell me what she'll really think"), or reenacting abuse by a named person. Users can describe roles and traits; the counterpart stays fictional.
- Simulating deceased loved ones or "closure conversations" with someone who has died. This is grief territory, out of scope.
- Practicing manipulation, coercion, stalking, harassment, or deception of a real person ("help me practice guilting my ex into getting back together").
- Giving therapy, medical, legal, or crisis counseling in or out of character. The counterpart is not an advice assistant, and the reflection stays communication-focused.
- Claiming to remember or know the user in companion terms beyond the explicitly shared About-me facts (G3 sharing model).
- Sexual content of any kind.

### 4.4 Design-level guardrails that follow from the evidence

- **Bounded by default:** 3-5 minute calls, at most two extra takes per sitting by default, a firm close, no streaks, no engagement metrics shown to users.
- **AI disclosure on every call:** a visible "fictional AI practice partner" label at call start and on the call screen. This satisfies the spirit of the Utah, CA, and NY disclosure provisions at negligible cost.
- **Published safety protocol page:** describe crisis detection, the out-of-character exit, the resources shown, and known limits.
- **Evaluation set for the safety layer:** crisis phrases, abuse disclosures, reassurance loops, credential claims, and minor signals, run as automated tests against the setup model, counterpart prompt, and reflection model before each release.
- **Clinical review before public launch:** have a licensed clinician review the safety protocol, copy, and reflection rules. Before any outcome claim, conduct a properly designed study.

---

## 5. Sources

All accessed October 3, 2026. "Unverified" means the fact came from a search summary, secondary source, or abstract without access to the primary document, or a detail (author list, effective date) could not be confirmed. Book entries are standard bibliographic references that were not fetched this session.

**Rehearsal, SST, assertiveness**
- [S01] Mayo-Wilson, E., Dias, S., Mavranezouli, I., et al. (2014). Psychological and pharmacological interventions for social anxiety disorder in adults: a systematic review and network meta-analysis. *Lancet Psychiatry*, 1(5), 368-376. https://pmc.ncbi.nlm.nih.gov/articles/PMC4287862/ (author list from memory of the standard citation; the fetched page confirmed the content and numbers)
- [S02] Heller, I., Bolliger, C., et al., & Michel, G. (2026). The role of social skills training in the treatment of social anxiety: A systematic review. *SAGE Open*. https://doi.org/10.1177/21582440251409451 (full author list not verified)
- [S03] RCT: The impact of social skills training for social anxiety disorder: A randomized controlled trial. https://pmc.ncbi.nlm.nih.gov/articles/PMC4254620/ (authors and journal not extracted in this session; unverified)
- [S04] Speed, B. C., Goldstein, B. L., & Goldfried, M. R. (2018). Assertiveness training: A forgotten evidence-based treatment. *Clinical Psychology: Science and Practice*, 25(1), e12216. https://doi.org/10.1111/cpsp.12216

**Exposure, behavioral experiments, safety behaviors, post-event processing**
- [S05] Driving cognitive change: a guide to behavioural experiments in cognitive therapy for anxiety disorders (2025). *Cognitive Behaviour Therapy*. https://doi.org/10.1080/16506073.2025.2518427 (authors not extracted; unverified)
- [S06] Craske, M. G., Treanor, M., Conway, C. C., Zbozinek, T., & Vervliet, B. (2014). Maximizing exposure therapy: An inhibitory learning approach. *Behaviour Research and Therapy*, 58, 10-23. https://pmc.ncbi.nlm.nih.gov/articles/PMC4114726/
- [S07] Wells, A., Clark, D. M., Salkovskis, P., Ludgate, J., Hackmann, A., & Gelder, M. (1995). Social phobia: The role of in-situation safety behaviors in maintaining anxiety and negative beliefs. *Behavior Therapy*, 26(1), 153-161. https://oxcadatresources.com/wp-content/uploads/2020/07/1-s2.0-S0005789416300600-main.pdf
- [S08] McManus, F., Sacadura, C., & Clark, D. M. (2008). Why social anxiety persists: An experimental investigation of the role of safety behaviours as a maintaining factor. *Journal of Behavior Therapy and Experimental Psychiatry*, 39(2), 147-161. https://www.sciencedirect.com/science/article/abs/pii/S0005791607000055
- [S09] McMillan, D., & Lee, R. (2010). A systematic review of behavioral experiments vs. exposure alone in the treatment of anxiety disorders. *Clinical Psychology Review*, 30(5), 467-478. https://www.ncbi.nlm.nih.gov/books/NBK79820/
- [S10] Centre for Clinical Interventions. Stepping Out of Social Anxiety, Module 5: Safety Behaviours. https://www.cci.health.wa.gov.au/~/media/CCI/Consumer-Modules/Stepping-out-of-Social-Anxiety/Stepping-out-of-Social-Anxiety---Module-5---Safety-Behaviours.pdf
- [S11] Kircanski, K., Mortazavi, A., Castriotta, N., et al. (2012). Challenges to the traditional exposure paradigm: Variability in exposure therapy for contamination fears. *Journal of Behavior Therapy and Experimental Psychiatry*, 43(2), 745-751. https://cdn.vanderbilt.edu/t2-main/lab-prd/wp-content/uploads/sites/244/2026/01/Inhibitory-Learning-Exposure-2.pdf (full author list unverified)
- [S12] Is the hierarchy necessary? Gradual versus variable exposure intensity in the treatment of unacceptable obsessional thoughts (2019). https://pubmed.ncbi.nlm.nih.gov/30851653/ (authors not extracted; unverified)
- [S13] Niles, A. N., Craske, M. G., Lieberman, M. D., & Hur, C. (2015). Affect labeling enhances exposure effectiveness for public speaking anxiety. *Behaviour Research and Therapy*, 68, 27-36. https://escholarship.org/uc/item/91f398qp (page range unverified)
- [S19] Brozovich, F., & Heimberg, R. G. (2008). An analysis of post-event processing in social anxiety disorder. *Clinical Psychology Review*, 28(6), 891-903. https://doi.org/10.1016/j.cpr.2008.01.002
- [S20] Post-event rumination and social anxiety: a systematic review and meta-analysis (2024). https://pmc.ncbi.nlm.nih.gov/articles/PMC11018455/ (authors and journal not extracted; r ≈ .45 from search summary, unverified against full text)
- [S21] Donohue, H. E., Modini, M., & Abbott, M. J. (2024). Psychological interventions for pre-event and post-event rumination in social anxiety: A systematic review and meta-analysis. *Journal of Anxiety Disorders*, 102, 102823. https://doi.org/10.1016/j.janxdis.2023.102823
- [S22] Warnock-Parkes, E., Wild, J., Stott, R., Grey, N., Ehlers, A., & Clark, D. M. (2017). Seeing is believing: Using video feedback in cognitive therapy for social anxiety disorder. *Cognitive and Behavioral Practice*, 24(2), 245-255. https://pubmed.ncbi.nlm.nih.gov/29033532/
- [S23] Harvey, A. G., Clark, D. M., Ehlers, A., & Rapee, R. M. (2000). Social anxiety and self-impression: Cognitive preparation enhances the beneficial effects of video feedback following a stressful social task. *Behaviour Research and Therapy*, 38(12), 1183-1192. https://pubmed.ncbi.nlm.nih.gov/11104182/ (author list from standard citation; unverified in fetched text)
- [S53] Assessing excessive reassurance seeking in the anxiety disorders (2011). *Journal of Anxiety Disorders*. https://www.sciencedirect.com/science/article/abs/pii/S0887618511000934 (authors unverified)
- [S54] Rethinking the Subjective Units of Distress Scale: Validity and clinical utility of the SUDS (2025). https://pmc.ncbi.nlm.nih.gov/articles/PMC12293913/ (authors unverified); cites Tanner, B. A. (2012). Validity of global physical and emotional SUDS. *Applied Psychophysiology and Biofeedback*, 37, 31-34.
- [S71] The relationship between three subtypes of safety behaviors and social anxiety: Serial mediating effects of state and trait post-event processing (2022). *Frontiers in Psychology*. https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.987426/full (authors unverified)

**VR, avatars, LLM social-skill training**
- [S14] Shaikh, O., Chai, V., Gelfand, M. J., Yang, D., & Bernstein, M. S. (2024). Rehearsal: Simulating conflict to teach conflict resolution. *Proceedings of CHI 2024*. https://arxiv.org/abs/2309.12309
- [S15] Smith, M. J., Ginger, E. J., Wright, K., et al. (2014). Virtual reality job interview training in adults with autism spectrum disorder. *Journal of Autism and Developmental Disorders*, 44(10), 2450-2463. https://pmc.ncbi.nlm.nih.gov/articles/PMC4167908/
- [S16] Yang, D., Ziems, C., Held, W., Shaikh, O., Bernstein, M. S., & Mitchell, J. (2024). Social skill training with large language models. arXiv:2404.04204. https://arxiv.org/abs/2404.04204 (authors after Ziems from memory; unverified)
- [S17] Can LLM-simulated practice and feedback upskill human counselors? A randomized study with 90+ novice counselors (2025). arXiv:2505.02428. https://arxiv.org/html/2505.02428v2 (authors not extracted; Stanford SALT group per HAI coverage, unverified)
- [S18] Web-based AI-driven virtual patient simulator versus actor-based simulation for teaching consultation skills: Multicenter randomized crossover study. https://nottingham-repository.worktribe.com/output/57137415 (authors and journal not extracted; unverified)
- [S24] Tan, Y. L., Chang, V. Y. X., Ang, W. H. D., Ang, W. W., & Lau, Y. (2025). Virtual reality exposure therapy for social anxiety disorders: A meta-analysis and meta-regression of randomized controlled trials. *Anxiety, Stress, & Coping*, 38(2), 141-160. https://doi.org/10.1080/10615806.2024.2392195
- [S25] Chesham, R. K., Malouff, J. M., & Schutte, N. S. (2018). Meta-analysis of the efficacy of virtual reality exposure therapy for social anxiety. *Behaviour Change*. https://www.cambridge.org/core/journals/behaviour-change/article/metaanalysis-of-the-efficacy-of-virtual-reality-exposure-therapy-for-social-anxiety/523AE3EAF14DD82FB614431421656FC5 (co-authors and year from standard citation; unverified)
- [S26] Virtual reality exposure therapy for social anxiety disorder: A systematic review and meta-analysis (2020). *Psychological Medicine*. https://www.cambridge.org/core/journals/psychological-medicine/article/abs/virtual-reality-exposure-therapy-for-social-anxiety-disorder-a-systematic-review-and-metaanalysis/04F84DD9C217D582E03D0638E2E65FAE (authors not extracted; unverified)
- [S55] Employing simulated participants to develop communication skills in medical education (meta-analysis, searches through Feb 2023). https://exa.ai/library/publication/53059sq9m1l (authors and journal **unverified**)
- [S56] Is the use of standardized patients more effective than role-playing in medical education? A meta-analysis (2025). *Frontiers in Medicine*. https://doi.org/10.3389/fmed.2025.1601116 (authors unverified)
- [S57] Comparing automated and human-led social skills training in healthy adults: A randomized controlled trial (preprint). https://exa.ai/library/publication/f5d962ns719 (authors and venue **unverified**)
- [S58] VChatter: Exploring generative conversational agents for simulating exposure therapy to reduce social anxiety (2025). arXiv:2506.03520. https://arxiv.org/html/2506.03520v1
- [S59] Hlynsson, J. I., Mechler, J., Lindqvist, K., Andersson, G., & Carlbring, P. (2026). Anna vs. Judith: A randomized comparison of AI-delivered psychodynamic and cognitive behavioral therapies for social anxiety disorder. *Internet Interventions*. https://doi.org/10.1016/j.invent.2026.100960

**Communication frameworks**
- [S27] Kubany, E. S., Richard, D. C., Bauer, G. B., & Muraoka, M. Y. (1992). Verbalized anger and accusatory "you" messages as cues for anger and antagonism among adolescents. *Adolescence*, 27(107), 505-516. https://eric.ed.gov/?id=EJ451193; and Kubany, E. S., et al. (1992). Impact of assertive and accusatory communication of distress and anger. *Aggressive Behavior*, 18(5), 337-347.
- [S28] Rogers, S. L., Howieson, J., & Neame, C. (2018). I understand you feel that way, but I feel this way: The benefits of I-language and communicating perspective during conflict. *PeerJ*, 6, e4831. https://pmc.ncbi.nlm.nih.gov/articles/PMC5961625/ (authors and journal details from standard citation; unverified in fetched text)
- [S29] Juncadella, C. M. (2013). What is the impact of the application of the Nonviolent Communication model on the development of empathy? Overview of research and outcomes (master's dissertation). https://nvc-global.net/wp-content/uploads/2019/02/Carme_Mampel_Juncadella.pdf (year unverified)
- [S32] The contribution of skills to the effectiveness of dialectical behavioral therapy. https://exa.ai/library/publication/2c4wzp73xv6 (authors and journal unverified); Valentine, S. E., et al. (2015). The use of DBT skills training as stand-alone treatment: A systematic review. *Journal of Clinical Psychology*. https://onlinelibrary.wiley.com/doi/10.1002/jclp.22114
- [S33] Arqueros, M., Soler, J., & Pascual, J. C. (2026). Stand-alone dialectical behavior therapy skills training for borderline personality disorder: A systematic review and meta-analysis. *Personality Disorders: Theory, Research, and Treatment*. https://pubmed.ncbi.nlm.nih.gov/42275028/
- [S34] Does nonviolent communication education improve empathy in French medical students? (2022). https://pmc.ncbi.nlm.nih.gov/articles/PMC8994647/ (authors unverified)
- [S35] Loewenstein, J., Thompson, L., & Gentner, D. (1999). Analogical encoding facilitates knowledge transfer in negotiation. *Psychonomic Bulletin & Review*, 6, 586-597. https://doi.org/10.3758/BF03212967; Loewenstein, J., Thompson, L., & Gentner, D. (2003). Analogical learning in negotiation teams. *Academy of Management Learning & Education*. https://loewenstein.web.illinois.edu/papers/Loewensteinetal%20AMLE03.pdf
- [S37] Lewicki, R. J., Polin, B., & Lount, R. B. (2016). An exploration of the structure of effective apologies. *Negotiation and Conflict Management Research*, 9(2), 177-196. https://ncmr.lps.library.cmu.edu/article/id/264/
- [S62] Patterson, K., Grenny, J., McMillan, R., & Switzler, A. (2002). *Crucial Conversations: Tools for Talking When Stakes Are High*. McGraw-Hill. (book; not fetched)
- [S63] Stone, D., Patton, B., & Heen, S. (1999). *Difficult Conversations: How to Discuss What Matters Most*. Viking. (book; not fetched)
- [S64] Fisher, R., & Ury, W. (1981). *Getting to Yes: Negotiating Agreement Without Giving In*. Houghton Mifflin. (book; not fetched)
- [S65] Smith, M. J. (1975). *When I Say No, I Feel Guilty*. Dial Press. Publisher page: https://www.penguinrandomhouse.com/books/169305/when-i-say-no-i-feel-guilty-by-manuel-j-smith/
- [S66] Center for Creative Leadership. SBI feedback model. https://www.ccl.org/articles/leading-effectively-articles/sbi-feedback-model-a-quick-win-to-improve-talent-conversations-development/

**Motivation, practice, transfer**
- [S38] Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. *Advances in Experimental Social Psychology*, 38, 69-119. https://doi.org/10.1016/S0065-2601(06)38002-1
- [S39] Sheeran, P., Listrom, O., & Gollwitzer, P. M. (2024/2025). The when and how of planning: Meta-analysis of the scope and components of implementation intentions in 642 tests. *European Review of Social Psychology*, 36(1), 162-194. https://doi.org/10.1080/10463283.2024.2334563
- [S40] Webb, T. L., Ononaiye, M. S. P., Sheeran, P., Reidy, J. G., & Lavda, A. (2010). Using implementation intentions to overcome the effects of social anxiety on attention and appraisals of performance. *Personality and Social Psychology Bulletin*, 36(5), 612-627. https://doi.org/10.1177/0146167210367785
- [S41] Macnamara, B. N., Hambrick, D. Z., & Oswald, F. L. (2014). Deliberate practice and performance in music, games, sports, education, and professions: A meta-analysis. *Psychological Science*, 25(8), 1608-1618. https://journals.sagepub.com/doi/10.1177/0956797614535810
- [S42] Bandura, A. (1977). Self-efficacy: Toward a unifying theory of behavioral change. *Psychological Review*, 84(2), 191-215. https://doi.org/10.1037/0033-295X.84.2.191
- [S43] Byars-Winston, A., Diestelmann, J., Savoy, J. N., & Hoyt, W. T. (2017). Unique effects and moderators of effects of sources on self-efficacy: A model-based meta-analysis. *Journal of Counseling Psychology*. https://exa.ai/library/publication/chqf62k14qg (journal from standard citation; unverified)
- [S44] Blume, B. D., Ford, J. K., Baldwin, T. T., & Huang, J. L. (2010). Transfer of training: A meta-analytic review. *Journal of Management*, 36(4), 1065-1105. https://doi.org/10.1177/0149206309352880
- [S45] Wang, G., Wang, Y., & Gai, X. (2021). A meta-analysis of the effects of mental contrasting with implementation intentions on goal attainment. *Frontiers in Psychology*, 12, 565202. https://doi.org/10.3389/fpsyg.2021.565202
- Note: Ericsson, Krampe, & Tesch-Römer (1993), the original deliberate-practice paper, was not fetched; deliberate practice is summarized here via [S41].

**Feedback, self-compassion, social misprediction**
- [S30] Kardas, M., Kumar, A., & Epley, N. (2022). Overly shallow?: Miscalibrated expectations create a barrier to deeper conversation. *Journal of Personality and Social Psychology*, 122(3), 367-398. https://pubmed.ncbi.nlm.nih.gov/34591541/ (volume/pages from standard citation; unverified)
- [S31] Boothby, E. J., Cooney, G., Sandstrom, G. M., & Clark, M. S. (2018). The liking gap in conversations: Do people like us more than we think? *Psychological Science*, 29(11), 1742-1756. https://journals.sagepub.com/doi/10.1177/0956797618783714 (volume/pages unverified). Also referenced: Bruk, A., Scholl, S. G., & Bless, H. (2018), the "beautiful mess" effect, *JPSP* (cited via [S30]; not fetched).
- [S36] Kluger, A. N., & DeNisi, A. (1996). The effects of feedback interventions on performance: A historical review, a meta-analysis, and a preliminary feedback intervention theory. *Psychological Bulletin*, 119(2), 254-284. https://doi.org/10.1037/0033-2909.119.2.254
- [S46] Ferrari, M., Hunt, C., Harrysunker, A., Abbott, M. J., Beath, A. P., & Einstein, D. A. (2019). Self-compassion interventions and psychosocial outcomes: A meta-analysis of RCTs. *Mindfulness*, 10(8), 1455-1473. https://doi.org/10.1007/s12671-019-01134-6
- [S47] Wakelin, K. E., Perman, G., & Simonds, L. M. (2022). Effectiveness of self-compassion-related interventions for reducing self-criticism: A systematic review and meta-analysis. *Clinical Psychology & Psychotherapy*. https://onlinelibrary.wiley.com/doi/10.1002/cpp.2586 (co-authors unverified)
- [S48] Breines, J. G., & Chen, S. (2012). Self-compassion increases self-improvement motivation. *Personality and Social Psychology Bulletin*, 38(9), 1133-1143. https://doi.org/10.1177/0146167212445599

**Arousal regulation**
- [S49] Balban, M. Y., Neri, E., Kogon, M. M., Weed, L., Nouriani, B., Jo, B., Holl, G., Zeitzer, J. M., Spiegel, D., & Huberman, A. D. (2023). Brief structured respiration practices enhance mood and reduce physiological arousal. *Cell Reports Medicine*, 4(1), 100895. https://pubmed.ncbi.nlm.nih.gov/36630953/
- [S50] Fincham, G. W., Strauss, C., Montero-Marin, J., & Cavanagh, K. (2023). Effect of breathwork on stress and mental health: A meta-analysis of randomised-controlled trials. *Scientific Reports*, 13, 432. https://doi.org/10.1038/s41598-022-27247-y
- [S51] Brooks, A. W. (2014). Get excited: Reappraising pre-performance anxiety as excitement. *Journal of Experimental Psychology: General*, 143(3), 1144-1158. https://doi.org/10.1037/a0035325
- [S52] Poynter, M., & Pasqualini, M. S. (2025). Getting excited about public speaking: A replication. *Psychology of Language and Communication*. https://doi.org/10.58734/plc-2025-0011 (author initials unverified)

**Safety, ethics, regulation**
- [S67] Moore, J., Grabb, D., Agnew, W., Klyman, K., Chancellor, S., Ong, D. C., & Haber, N. (2025). Expressing stigma and inappropriate responses prevents LLMs from safely replacing mental health providers. *Proceedings of FAccT 2025*. https://dl.acm.org/doi/full/10.1145/3715275.3732039 (authors after Klyman from memory; unverified)
- [S68] Iftikhar, Z., Xiao, A., Ransom, S., Huang, J., & Suresh, H. (2025). How LLM counselors violate ethical standards in mental health practice: A practitioner-informed framework. *Proceedings of AIES 2025*. https://ojs.aaai.org/index.php/AIES/article/view/36632
- [S69] Fang, C. M., Liu, A. R., Danry, V., Lee, E., Chan, S. W. T., Pataranutaporn, P., Maes, P., Phang, J., Lampe, M., Ahmad, L., & Agarwal, S. (2025). How AI and human behaviors shape psychosocial effects of extended chatbot use: A longitudinal randomized controlled study. arXiv:2503.17473. https://arxiv.org/abs/2503.17473v2
- [S70] Balancing promise and concern in AI therapy: A critical perspective on early evidence from the MIT-OpenAI RCT (2025). *Frontiers in Medicine*. https://doi.org/10.3389/fmed.2025.1643202 (authors unverified)
- [S72] American Psychological Association (Nov 2025). Health advisory: Use of generative AI chatbots and wellness applications for mental health. https://www.apa.org/topics/artificial-intelligence-machine-learning/health-advisory-chatbots-wellness-apps ; press release: https://www.apa.org/news/press/releases/2025/11/ai-wellness-apps-mental-health (exact day of Nov 13 from a secondary source)
- [S73] U.S. FDA, Digital Health Advisory Committee (Nov 6, 2025). Generative AI-enabled digital mental health medical devices: meeting brief summary. https://www.fda.gov/media/190450/download
- [S74] Illinois Public Act 104-0054 (HB 1806), Wellness and Oversight for Psychological Resources Act, 225 ILCS 155, effective Aug 1, 2025. https://www.ilga.gov/Legislation/PublicActs/PrinterFriendly/104-0054 ; bill status: https://ilga.gov/Legislation/BillStatus?DocNum=1806&DocTypeID=HB&GAID=18&LegId=159219&SessionID=114
- [S75] Utah H.B. 452 (2025), Artificial Intelligence Amendments relating to mental health chatbots, enrolled copy. https://le.utah.gov/Session/2025/bills/enrolled/HB0452.pdf
- [S76] Alston & Bird (2025). New artificial intelligence laws in effect in Utah. https://www.alstonprivacy.com/new-artificial-intelligence-laws-in-effect-in-utah/
- [S77] Nevada AB 406 (2025), enrolled. https://archive.leg.state.nv.us/Session/83rd2025/Bills/AB/AB406_EN.pdf
- [S78] Wilson Sonsini (2025). Nevada passes law limiting AI use for mental and behavioral healthcare. https://www.wsgr.com/en/insights/nevada-passes-law-limiting-ai-use-for-mental-and-behavioral-healthcare.html
- [S79] Illinois IDFPR press release (Aug 4, 2025). Gov. Pritzker signs legislation prohibiting AI therapy in Illinois. https://idfpr.illinois.gov/content/dam/soi/en/web/idfpr/news/2025/2025-08-04-idfpr-press-release-hb1806.pdf
- [S80] Federal Trade Commission (Sept 11, 2025). FTC launches inquiry into AI chatbots acting as companions. https://www.ftc.gov/news-events/news/press-releases/2025/09/ftc-launches-inquiry-ai-chatbots-acting-companions
- [S81] California SB 243 (2025), Companion chatbots, Chapter 677, Statutes of 2025. https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202520260SB243 ; status: https://leginfo.legislature.ca.gov/faces/billStatusClient.xhtml?bill_id=202520260SB243
- [S82] Office of Senator Steve Padilla (Oct 13, 2025). First-in-the-nation AI chatbot safeguards signed into law. https://sd18.senate.ca.gov/news/first-nation-ai-chatbot-safeguards-signed-law
- [S83] Office of Governor Kathy Hochul (Nov 2025). Letter to AI companion companies; safeguards in effect Nov 5, 2025. https://www.governor.ny.gov/sites/default/files/2025-11/Companion_AI_Letter.pdf ; https://www.governor.ny.gov/news/governor-hochul-pens-letter-ai-companion-companies-notifying-them-safeguard-requirements-are
- [S84] New York A.6767 (2025), Article 47 Artificial Intelligence Companion Models (bill text). https://legislation.nysenate.gov/pdf/bills/2025/a6767 (as enacted via the FY26 budget; the final enacted text may differ from this bill version; unverified)
- [S85] Transparency Coalition (2026). States have passed new laws this year regulating the use of AI in health care (source for the Tennessee SB 1580 and Colorado/Maine effective dates). https://www.transparencycoalition.ai/news/state-lawmakers-have-passed-15-new-laws-regulating-the-use-of-ai-in-health-care (**secondary source**)
- [S86] Maine L.D. 2082 / H.P. 1397 (2026), An Act to Regulate the Use of Artificial Intelligence in Providing Certain Mental Health Services. https://legislature.maine.gov/legis/bills/getPDF.asp?item=3&paper=HP1397&snum=132
- [S87] Colorado HB26-1195, Psychotherapy Artificial Intelligence Restrictions (signed June 3, 2026). https://leg.colorado.gov/bills/hb26-1195
- [S88] Vermont H.816 (2026), as passed by both House and Senate (unofficial). http://legislature.vermont.gov/Documents/2026/Docs/BILLS/H-0816/H-0816%20As%20Passed%20by%20Both%20House%20and%20Senate%20Unofficial.pdf
- [S89] Rhode Island Public Law 2026 ch. 374 (S 2197 Sub A), Oversight of Artificial Intelligence Technology in Mental Health Care Act, enacted June 22, 2026. https://webserver.rilegislature.gov/PublicLaws/law26/law26374.htm (effective date unverified)
- [S90] Consumer Federation of America et al. (June 10, 2025). Complaint and request for investigation: unlicensed practice of medicine and mental health provider impersonation on character-based generative AI platforms. https://consumerfed.org/media/legacy/post_33017/Mental-Health-Chatbot-Complaint-June-10.pdf

**Searched for but not found or not verified in this session**
- No peer-reviewed controlled outcome trial was found for Crucial Conversations, Difficult Conversations, SBI, broken record, or fogging specifically.
- No RCT was found testing an LLM-driven *talking video avatar* for everyday (non-clinical) conversation rehearsal in general adults.
- No FTC enforcement action (as opposed to the 6(b) study) specifically against an AI mental-health or therapy chatbot was found.
- Whether California SB 243's "companion chatbot" definition or New York Article 47's "AI companion" definition covers a goal-bounded practice partner with saved personas was not determined; this needs legal review.
- Motivational interviewing efficacy meta-analyses were not reviewed; OARS is included only as a listening-skill scaffold.
