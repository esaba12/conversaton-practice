# R06: User needs and jobs to be done

Status: research report (planning input, not a spec). Written October 3, 2026. Sources accessed October 3, 2026. No user interviews were run for this report; it relies on published studies, product reviews and public forum posts. Treat forum posts as sentiment, not prevalence.

## 1. Who this is for (primary jobs)

| Job | Example | What they need most | Evidence it's real |
|---|---|---|---|
| **Say a hard thing to someone I know** | Roommate dishes, asking a parent for space, telling a friend they hurt you | Realistic pushback from *that kind of person*; the words to start; courage to actually do it | Most-shared ChatGPT rehearsal prompts are about exactly this [U1]; Rehearse, Prehearse, Convo market it [R01] |
| **Ask for something** | Raise, extension, help from a professor, a favor | Opening line, holding the ask under deflection | Skill shelves in Vocal Image, Convo [R01] |
| **Say no / set a boundary** | Declining extra work, a family request | Practice staying kind and firm when they push | Boundary practice prompts [U1] |
| **Get through a phone or video call** | Calling a doctor's office, a landlord, a first call with a stranger | Low-stakes exposure, ringing and answering, a call that feels real | 23% of UK 18–34s "never" answer calls (Opinium, n = 2,000, 2024) [U2]; 34% of Gen Z (18–25) find calls awkward (Sky Mobile, n = 1,000) [U3]; phone-anxiety apps exist (Murmur, Confident Caller) [R01] |
| **Social communication practice (autistic and neurodivergent users)** | Responding with empathy, turn-taking, workplace small talk | Clear, factual, user-chosen feedback; repetition; predictability | Noora RCT [U4, U5]; SocialWise pilot [U6]; co-design [U7]; preferences survey [U8] |
| **Warm-up before a big moment** | The 10 minutes before the actual conversation | Fast start, one breath, the opening line in pocket | Pre-event preparation evidence in R03 §1.3, §1.10 |

Secondary: language learners (Duolingo Video Call proves demand [R01]); people returning to social life; managers preparing feedback (served by enterprise tools; not our focus).

## 2. What users complain about in AI roleplay

**"Too nice, too fast."** The most consistent complaint across roleplay communities. A widely upvoted post: bots "forgive too fast. They understand too easily. They never stay upset… They turn every conflict into a therapy session within five messages" [U9]. Character.AI users: bots "immediately soften up", "Instead of the argument continuing, the bot instead felt guilty and apologised" [U10]. One reply names the design fix: "A character needs some persistent intent and scene state, not just a pleasant next reply" [U10]. The rehearsal prompts people write all fight this: "not cartoonishly difficult or unrealistically agreeable", "Don't be a pushover… Don't be cartoonishly hostile either. Real difficult conversations are hard because the other person has reasons" [U1].

Design implication: the counterpart needs a **want** and a **reason to resist** that persists across turns (generated at setup and editable). Pushback should *move only when the user does something specific* (names a concrete request, acknowledges their side). That is a concession condition, not a hardness slider. It stays within the docs/08 "mild pushback" ceiling: persistent, not cruel.

**"It coaches me instead of playing the person."** General assistants drift into advice [R01]. Our counterpart already forbids coaching (docs/07). Keep it, and give the coaching a separate, visible place (hint drawer, recap).

**"It's obviously fake."** Uncanny faces, robotic timing, monologues. Shared prompts insist on "2–4 sentences. Real conversations aren't monologues" [U1]. See R05 §2 for the face evidence.

**"I froze and it just kept talking" / "it waited forever."** Silence handling matters for anxious users. A popular prompt: "If I freeze up… have the character say something like 'what?' or 'are you okay?'" [U1]. → `idle_engagement: patient` plus an Ask-to-wait control [R04 §1, R02 §2.12].

**"Scores made me feel worse" vs "I want numbers."** Split preference (§3).

## 3. Neurodivergent users: specific needs

- **Repetition with feedback works.** Noora (Stanford; RCT, waitlist control; ages 11–35; ~30 participants per Stanford HAI): 10 prompts/day, 5 days/week for 4 weeks. Participants identify the statement's sentiment, respond, and get feedback with an example when empathy was missing. Empathetic responses improved and generalized to a Zoom conversation with a person, with an average 38% increase vs. a flat control [U4, U5]. It is a short-turn drill, not open conversation.
- **Feedback format must be selectable.** In a co-design study with autistic adults, participants strongly preferred personalized, non-numeric feedback. One rejected scoring ("I don't think behaviour like ours can be measured on a yes/no scale"), another preferred numbers. "Confirming the need for user-selectable format." Timing rule: interrupt in real time only for critical issues; save minor ones for end-of-session review. One participant preferred written text [U7].
- **Tone and modality.** Autistic participants (CHI 2025) preferred a factual tone (mean 3.59/5) and textual responses (3.32) over verbal or video; lists of suggestions and back-and-forth dialogue rated highest as structures, while rephrasing their words back and short stories rated lowest [U8].
- **Directness from a non-human is a feature.** Co-design participants valued that a non-human "can be objective without feelings" and deliver honest feedback friends can't [U7].
- **SocialWise pilot** (34 autistic adults, not a trial): 4.15/5 helpfulness; top cited benefits were turn-taking, conflict problem-solving and reduced anxiety in real conversations; users asked for "advanced scenarios" [U6].

Design implications: a **feedback style setting** in About me (Gentle words / Plain and direct / Show me a simple tally); captions and a transcript view on screen during the call (local only); a "type it first" rung; a predictable call structure (always rings, always the same controls, always ends with the same recap order); an optional **drill mode** (short repeated exchanges on one skill, à la Noora) as a later addition.

## 4. Anxious users: specific needs

From R03 (summarized, not re-cited): avoid self-focused live meters; avoid reassurance loops and unlimited re-takes; include a prediction-vs-outcome comparison; keep reflection bounded and self-compassionate; make dropping one safety behavior an explicit experiment. Users also benefit from **control signals**: visible End at all times, Ask to wait, honest "muted is not paused", and starting with a voice-only rung if a face feels like too much.

Phone anxiety specifically: 47% of Gen Z would prefer a text warning before a call [U3]. That suggests a "they're about to call you" mode, where the counterpart calls the user, as a later exposure step. It is not proposed for the MVP; it needs notifications.

## 5. Trust and privacy needs

- Users share intimate details when describing situations. They need to *see* where it goes: the private-notes boundary is a strength to make visible (R05 §3.3).
- No raw transcripts kept by default (current rule) is a selling point; say it on the recap ("This conversation isn't saved. Save only what you choose").
- AI disclosure: the counterpart is always labeled fictional AI. Tavus can also speak a disclosure line (`disclosure_type`) [R04 §2.2]; ours is visual and constant, which is clearer for this use.
- Regulatory context (R03 §6): several US states restrict AI "therapy"; positioning must stay "practice," not treatment, with a crisis resource reachable from every screen.

## 6. Jobs-to-be-done statements (for specs)

1. "When I'm dreading a conversation with someone I know, help me hear how it might go and find my first sentence, so I actually start it."
2. "When they push back or dodge, let me practice holding my point without becoming harsh."
3. "When I finish a practice, tell me one thing I did that worked, quoted, and one thing to try, so I don't spiral."
4. "When I'm about to have the real one, give me my plan in my pocket."
5. "After the real one, let me note how it went, including 'not yet', without judgment."
6. "Let me choose how feedback is given to me."
7. "Let me start with typing or voice if a face is too much today."

## 7. Unmet needs ranked (feeds docs/31)

1. Realistic, persistent counterpart intent (anti-agreeable) with a fair concession condition.
2. Feedback by default with a user-chosen style.
3. The real-world bridge: pocket card, date, check-in.
4. Presence and calm: green room, ringing, dark call mode, ask-to-wait.
5. Modality ladder (type → voice → face).
6. Repetition: go again with one change; later, drill mode.
7. Phone-call realism (they call you; voicemail; hold), as later exposure steps.

## Sources

- [U1] Shared rehearsal prompts: a-gnt "Conversation Rehearsal" https://a-gnt.com/agents/prompt-conversation-rehearsal ; Promptsmint "The Difficult Conversation Simulator" https://promptsmint.com/prompts/the-difficult-conversation-simulator/ ; r/ChatGPT https://www.reddit.com/r/ChatGPT/comments/1r01esg/i_made_a_difficult_conversation_simulator_prompt/
- [U2] Uswitch / Opinium (April 2024), "Call me maybe (not)." https://www.uswitch.com/media-centre/2024/04/Call-me-maybe-quarter-young-people-never-answer-phone/
- [U3] Sky Group, "CALL DECLINED!" (Sky Mobile survey, 1,000 parents and 1,000 aged 18–25). https://skygroup.sky/en-gb/article/call-declined-
- [U4] Koegel, L. K., et al. (2025). Using Artificial Intelligence to Improve Empathetic Statements in Autistic Adolescents and Adults: A Randomized Clinical Trial. *Journal of Autism and Developmental Disorders*. https://link.springer.com/article/10.1007/s10803-025-06734-x (NCT05987774)
- [U5] Stanford HAI, "An AI Social Coach Is Teaching Empathy to People with Autism." https://hai.stanford.edu/news/an-ai-social-coach-is-teaching-empathy-to-people-with-autism
- [U6] SocialWise (arXiv 2604.15347). https://arxiv.org/html/2604.15347
- [U7] Co-Designing Social Robots for Social-Cognition Training with Autistic Adults (arXiv 2608.18488). https://arxiv.org/abs/2608.18488 (small sample; robot context, applied here by analogy)
- [U8] Reimagining Support: Exploring Autistic Individuals' Visions for AI in Coping with Negative Self-Talk, CHI 2025. https://dl.acm.org/doi/10.1145/3706598.3714287
- [U9] r/AIChatReviews, "AI roleplay is worse when the bot is too nice." https://www.reddit.com/r/AIChatReviews/comments/1uch5zn/ai_roleplay_is_worse_when_the_bot_is_too_nice/
- [U10] r/CharacterAI, "Has anyone noticed?" https://www.reddit.com/r/CharacterAI/comments/1ukhgju/has_anyone_noticed/
