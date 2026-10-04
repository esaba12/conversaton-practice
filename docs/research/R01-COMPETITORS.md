# R01: Competitor landscape

Status: research report (planning input, not a spec). Written October 3, 2026. Sources accessed October 3, 2026.
Method: web search and vendor pages, app-store listings, launch pages, one comparison article written by a competitor (Vocal Image), Reddit threads, and research papers. No product was installed or tried hands-on. Prices are as reported by the cited source on its stated check date. Vendor claims are marked as claims.

## 1. Ten takeaways

1. **Two-way spoken AI roleplay is now a commodity.** A September 2026 roundup lists at least eight apps that let you rehearse a hard conversation out loud with an AI that answers back (Vocal Image, Yoodli, VirtualSpeech, Prehearse, Assertr, Hard Talk Roleplay Coach, ChatGPT Voice, Pi) [C1]. Our live call is necessary, not a differentiator.
2. **A talking face is no longer unique either.** At least one consumer app named Rehearse advertises a "real, lip-synced face" that pushes back, alongside voice-only mode [C9]. VirtualSpeech, Second Nature, Coachello, and Mursion use avatars in enterprise training [C4, C14, C15]. What still seems rare is a face that fits the specific person and relationship the user described.
3. **The real competitor is general-purpose voice AI.** ChatGPT's voice mode is reported to have become full-duplex (GPT-Live, July 2026, per a third-party guide [C18]). People already write "difficult conversation simulator" prompts for it [C19]. Its weaknesses are our openings: it drifts into coaching, it's "too agreeable" unless the role is locked, it has no face, and it keeps no structure or memory of the person [C18, C19].
4. **The loop around the call is where competitors are moving.** Rehearse lets you set the date of the real conversation, gives you a prep card, and "on the day, asks how the real one went" [C9]. Prehearse builds a prep card with your opening line and key phrases [C1]. Work Coach reviews your actual interviews [C21]. We have none of this today.
5. **Moment-level feedback is the feedback people value most.** Several apps converge on "the exact line where it turned, and what to say instead" (Rehearse [C9, C10], Vocal Image [C1], iGrow [C6], Hyperbound's transcript-cited scorecards [C13]). A single aggregate score is described as less useful than pointing at specific moments [C1].
6. **Most consumer apps score you. Some users and researchers push back.** Readiness scores out of 10 (Prehearse, Rehearse/Maison GR), "confidence scores" (iGrow), and XP (KallyConfidence) are common [C1, C6, C11, C17]. Autistic co-design participants split on scoring, and one rejected it outright [R06]. Our no-score stance is a real position. But it needs a substitute that still feels like progress.
7. **Private and personal beats workplace-only.** Most products stop "at the office door" (Yoodli, VirtualSpeech, Assertr) [C1]. Personal conversations (parents, partners, roommates, friends) are served mainly by small apps, and one of them stores rehearsals on the device [C1]. Several apps lead their marketing with privacy ("your practice history never leaves your phone" [C10]; "your voice is never recorded or stored" [C16]).
8. **Phone-call anxiety is a crowded micro-niche.** Murmur, KallyConfidence, Confident Caller, and Convo all target scary calls (doctors, landlords, customer service) with scenario libraries, difficulty levels, and pre-call breathing [C16, C17, C20, C22]. That niche is largely voice-only.
9. **Libraries organized around skills retain users; custom setups convert them.** Vocal Image claims 200+ scenarios organized around 14 behavioral skills across 7 life contexts, with a daily plan [C1]. Prehearse and our product start from the user's own situation. The strongest position combines both: start from your situation, then practice the underlying skill elsewhere.
10. **Research prototypes show what works and isn't shipped yet.** Stanford's Rehearsal (counterfactual "what if?" branches plus feedback grounded in theory) beat lecture training in a live conflict with a confederate [C23]. CARE showed that practicing with an AI without feedback reduced empathy [C24]. BodySwaps' "swap bodies and watch yourself" perspective exercise is a signature mechanic [C12]. None of these is in a polished consumer app for personal conversations.

## 2. Feature matrix

Legend: ✓ documented, ~ partial or limited, ✗ not found, ? unverified. Based only on the cited pages.

| Product | Custom scenario from user's words | Talking video face | Voice | Persona editing | Saved people / memory | Feedback type | Score | Transcript / replay | Retry / again | Mid-call help | Real-world follow-up | Library | Price (per source) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Ours (today)** | ✓ generated, editable | ✓ one stock face | ✓ | ✓ fields + chips | ✓ people + shared facts | ~ optional 3-part reflection | ✗ by design | ~ captions in memory only | ~ back to setup | ✗ | ✗ | 3 examples | n/a |
| Vocal Image [C1] | ~ (library-led) | ? | ✓ | ? | ✓ progress across sessions | moment-level | ? | ? | ✓ | ? | ✗ | 200+ | free daily; $39.99/yr+ |
| Yoodli [C2, C3, C1] | ✓ builder (org) | ✓ video/avatar modes | ✓ | ✓ name, voice, tone, avatar image | ~ org tracking | rubric + delivery analytics | ✓ (unscored goals optional) | ✓ | ✓ | ✗ | ✗ | templates | free 5 sessions; $8–20/mo annual |
| VirtualSpeech [C4, C1] | ✓ Roleplay Studio | ✓ avatars, VR | ✓ | ✓ | ~ | AI feedback + AI coach reflection | ? | ? | ✓ | ✗ | ✗ | HR scenarios | $45/mo |
| Prehearse [C1] | ✓ describe person + toughness | ✗ | ✓ | ✓ toughness | ✗ starts from scratch | debrief, phrases to try | ✓ readiness | ? | ✓ | ✗ | ~ prep card | presets | $39.99/yr |
| Rehearse (iOS/Android) [C9] | ✓ "describe your own and set the date" | ✓ lip-synced face (claim) | ✓ | ? | ~ real-world outcome shapes next practice | exact line + what to say instead | ? | ? | ✓ | ✗ | ✓ day-of check-in | 33 work scenarios | free to try |
| Rehearse (jeanie.dev) [C10] | ✗ library | ✗ | text/voice? | difficulty: calm/defensive/very | ✓ on-device history | quoted sentence that cost you + stronger wording | ✓ 4 dimensions | ? | ✓ | ✗ deliberately none | ✗ | ~10 manager scenarios | 3 free |
| Rehearse (Maison GR, Arabic) [C11] | ✗ 18 scenarios | ? | ✓ | 3 difficulty | ✓ progress | what worked / fell flat / exact phrase / one change | ✓ 1–10 | ? | ✓ | ? | ✗ | 18 | ? |
| Assertr [C1] | ✗ (work set) | ✗ | ✓ interrupts | ? | ? | ✓ | ? | ? | ✓ | ? | ✗ | work | free 1/day; $49.99/yr |
| Hard Talk Roleplay Coach [C1] | ~ | ✗ | ✓ | ? | ? | coaching per session | ? | ? | ✓ | ? | ✗ | family/boundaries | $29.99/yr |
| iGrow [C6] | ✓ "tell it what conversation" | ✗ | ✓ voice or text | ? | ? | what you did well + exact phrase | ✓ confidence | ? | ✓ | ✗ | ✗ | work-heavy | ? |
| Tough Tongue AI [C7] | ✓ custom | ? | ✓ | ✓ | courses | scored feedback | ✓ /10 | ? | ✓ | ? | ✗ | courses | AppSumo deal |
| Coachello [C15] | ✓ customizable (org) | ✓ avatar | ✓ | ✓ | org | competency scoring + debrief | ✓ | ? | ✓ | ✗ | ✗ | manager library | quote |
| Hyperbound [C13] | ✓ bots (org) | ✗ (voice) | ✓ | ✓ | ✓ real calls + practice | criterion pass/fail with transcript citations | ✓ | ✓ recording | ✓ "re-roleplay" | ✗ | ✓ practice assigned from real-call gaps | sales | enterprise |
| BodySwaps [C12] | ✓ educator-customized | ✓ 3D humans, VR | ✓ | ✓ | org | behavioral + semantic analytics | ? | ✓ watch yourself back | ✓ | ✗ | ✗ | 35+ modules | enterprise |
| Murmur [C16] | ✓ write your own | ✗ | ✓ expressive | 3 difficulty | ? | notes: what worked / try next | ✗? | ✗ voice not stored | ✓ | ✗ | ✗ share wins | 40+ | free trial |
| KallyConfidence [C17] | ✗ | ✗ | ✓ | ✗ | ✓ XP progress | ✓ | ✓ XP | ? | ✓ | ✗ | ✗ | phone calls | freemium |
| Confident Caller [C20] | ~ script builder | ✗ | ✓ | 5 personalities | ✗ | ✓ | ✓ | ? | ✓ | ✗ | ✗ "Confidence Steps" ladder | 21+ | free |
| Convo [C22] | ✗ | ✗ | ✓ OpenAI Realtime | ? | ? | ✓ incl. "Recovery" | ✓ | ? | ✓ | ✗ | ✗ | 63 | ? |
| ChatGPT Voice / GPT-Live [C18, C19] | ✓ anything | ✗ | ✓ full duplex (reported) | via prompt | ~ chat memory | ask for it | ✗ | text transcript | ✓ | ✗ | ✗ | none | free / $19.99 |
| Pi [C1] | ~ | ✗ | ✓ | ✗ | ~ | supportive, unstructured | ✗ | ? | ✓ | n/a | ✗ | none | free |
| Duolingo Video Call (Lily) [C8] | ✗ | ✓ stylized 2D (Rive) | ✓ | ✗ | ✓ learner facts | post-call | ✗ | ✓ | ✓ | ✓ help if stuck | ✗ | n/a | subscription |
| Work Coach [C21] | ✓ from job description | ✗ | ✓ | ✗ | ✓ across interviews | per-answer | ? | ✓ records real interviews locally | ✓ | ✗ | ✓ reviews real interviews | interviews | ? |
| Stanford Rehearsal (research) [C23] | ✓ | ✗ text | ✗ | ✓ | ✗ | strategy feedback (IRP) | ✗ | ✓ | ✓ counterfactual branches | ✓ feedback during | ✗ | conflicts | research |

## 3. Short profiles

**Vocal Image** [C1]. A voice-coaching company. Its roleplay layer covers work and personal life (relatives, friends, children, dating). It is organized as 14 skills across 7 contexts, with a daily plan, video lessons, podcasts, and moment-level feedback. Note: the roundup we rely on is written by Vocal Image itself, so its ranking is self-interested. Lesson: skills are the retention backbone.

**Yoodli** [C2, C3, C1]. The best-known name. Builder: personas with name, voice, tone, demeanor, and avatar image. It also has multi-persona calls with up to 3 people, plus voice, video, chat, and screen-share modes. Goal types include rated, binary, compound, knowledge-based, and *unscored goals* ("qualitative, feedback-only insights … without assigning a score"). Delivery analytics cover pacing, filler words, and conciseness. It also works inside Zoom, Meet, and Teams. It is work-focused and runs in the browser. Lesson: "unscored goals" validates our position; binary goals ("confirmed next steps") are a gentle way to show that something happened.

**VirtualSpeech** [C4]. HR-style scenarios (poor performance, layoffs, disciplinary) with avatars and VR. The learning journey is "practice → feedback → reflect with a coach," and each roleplay comes with "5 essential tips." Lesson: a short tips sheet per scenario type is cheap and helpful.

**Prehearse** [C1]. Closest to our original idea in concept. You describe the person and choose how tough they are. The debrief has a readiness score, what landed, where you hedged, and phrases to try. A prep card holds your opening line and key phrases. Rehearsals stay on the device. Free tier: 2 rehearsals.

**Rehearse (Product Hunt, 2026)** [C9]. The closest to our full concept. It has a lip-synced AI face, 33 work scenarios or your own, and you can set the date of the real conversation. Afterward it shows "the exact line where it turned, what they heard, and what to say instead," gives you a prep card, and checks in on the day. Traction is tiny (2 upvotes on the listing). The face claim is the maker's own description. The listing describes it as covering work conversations.

**Rehearse: Conversation Coach (jeanie.dev)** [C10]. Manager scenarios with sharp names ("The midnight messages — naming a pattern nobody wants to name"). Difficulty is calm / defensive / very defensive. "Nothing coaches you mid-conversation, because nothing does in the room either." It scores clarity, empathy, directness, and confidence, and quotes back "the specific sentence that cost you." History stays on the phone. Lesson: evocative scenario names; a deliberate stance against mid-call help is a defensible choice.

**Rehearse (Maison GR)** [C11]. Arabic-first, built right-to-left. 18 scenarios across work, personal, and life, with a debrief of "What worked / What fell flat / The exact phrase / One thing to change." Lesson: our three-part reflection lacks the "exact phrase" and "one thing to change" pieces that every scored competitor converges on.

**iGrow** [C6]. "Tell iGrow what conversation you're walking into." Voice or text. "The exact phrase you should have said differently. Not 'be more confident.' The actual words."

**Murmur** [C16]. Phone-call practice. A "coach that sounds human," 40+ scenarios plus your own, 3 difficulty levels, notes after every call, multiple languages, breathing exercises before the real call, and "your voice is never recorded or stored." Recently added "share the little wins … with your friends." Lesson: pre-call breathing and sharing wins are low-cost warmth.

**Convo** [C22]. iOS app built on OpenAI's Realtime API. 63 scenarios, a morning warm-up voice session, and an anxiety-specific dimension called "Recovery (did you push through the stumble?)." Lesson: rewarding recovery rather than perfection fits our values.

**Confident Caller / KallyConfidence** [C20, C17]. Phone anxiety. Personality modes (friendly, busy, skeptical, difficult), "Confidence Steps" from easy to hard, script builder, XP.

**Hyperbound** [C13]. Sales roleplay. Scorecards with yes/no criteria and transcript citations, "re-roleplay and compare," and "show the exact moment your top performer got it right." It also assigns practice from gaps found in real calls. Lesson: citing the transcript makes feedback trustworthy; re-running with a comparison makes progress visible.

**BodySwaps** [C12]. VR/desktop/mobile soft skills. The signature is swapping bodies to "relive the experience and self-reflect" from the other person's viewpoint. Desktop supports screen readers.

**Duolingo Video Call with Lily** [C8]. The most polished consumer AI video call, and stylized rather than photoreal. Notable mechanics: the first question is generated while the call "rings"; mid-call evaluations steer the conversation; the system "whispers in Lily's ear 'Psst! Say it's time to go'" to close the call naturally; "thinking" poses hide latency; 64 idle variations prevent repetitive loops. Lesson: the ringing moment hides setup latency; the wrap-up whisper is exactly our natural-ending need.

**ChatGPT Voice / GPT-Live** [C18, C19]. Flexible and free, and reportedly full-duplex as of July 2026 (third-party claim, not checked against OpenAI). Weaknesses: helpfulness drift, no face, no structure, people paste sensitive real cases into consumer accounts.

**Work Coach** [C21]. Records your *real* interviews locally on a Mac and reviews them. This is a different privacy philosophy (covert recording of others) that we should not copy. It shows that "practice → real event → review" is a valued loop.

**Stanford Rehearsal** [C23]. Research system (CHI 2024). Lets users explore counterfactual "what if?" paths. Uses IRP prompting (classify the counterpart's strategy, then generate). Reduced competitive strategies by 67% and doubled cooperative ones versus lecture training (n = 40).

## 4. Features we lack that users praise (ranked by how often they appear × praise)

1. **Quoting the exact moment with a better alternative** (Rehearse ×3, iGrow, Vocal Image, Hyperbound). We deliberately avoid "optimal scripts" (docs/07). A user-requested "try saying it like this" is a decision for the owner (see docs/30).
2. **Do it again** (nearly all). We only offer Back to setup.
3. **Prep card for the real conversation** (Prehearse, Rehearse).
4. **Difficulty / personality presets with evocative names** (calm/defensive/very defensive; friendly/busy/skeptical/difficult).
5. **Scenario library organized by skill** (Vocal Image, Convo, Murmur).
6. **Real-conversation date and check-in afterward** (Rehearse, Work Coach).
7. **Pre-call breathing / warm-up** (Murmur, Convo).
8. **Delivery analytics** (pace, filler words, talk ratio; Yoodli, Hyperbound). Mixed value for anxious users.
9. **Text mode** as an alternative to voice (iGrow, Yoodli chat roleplays, Rehearsal).
10. **Multiple languages** (Murmur, Maison GR).
11. **Share a small win** (Murmur).

## 5. Where competitors fail (our openings)

- **Too agreeable or too coachy.** General-purpose voice AI drifts into helping [C18, C19]. Our counterpart already forbids coaching (docs/07). We can go further with realistic pushback strategies (section 6) and visibly separate "the character" from "your coach."
- **One-size feedback.** Scores out of 10 can't explain themselves. Autistic co-designers want to choose the feedback format [R06].
- **Workplace-only.** Personal relationships are underserved and handled by small, generic apps.
- **No sense of who the other person is.** Scenarios are generic ("a skeptical manager"). Few let you keep *your* people with their quirks, or control what each knows about you. Our saved people and per-person sharing are rare.
- **Privacy is a claim, not a feature you can see.** Apps say "not stored." Few *show* what is stored and let you delete it per provider. Our data page does this.
- **Uncanny faces.** Photoreal avatars with lip-sync drift look eerie, and audio arriving before video makes it worse [R04/R05]. Stylized characters like Duolingo's are friendlier; our provider is photoreal. Design must manage this (framing, warmth, honest labeling).
- **The practice ends at the call.** Only Rehearse and Work Coach connect to the real event.

## 6. White space: what nobody does well

1. **Your people, not personas.** A contact list of the real relationships you practice for (Mom, Alex the roommate, Professor Ellis), each with a fitting face and voice, the traits you chose, and exactly the facts you chose to share. It is persistent but never invents facts.
2. **Before → during → after → the real thing → after that.** One gentle arc: prediction and settle-in before; goal light and a hint drawer during; a debrief citing your own words and one more take after; a pocket card for the real conversation; a check-in after the real event comparing what happened with your prediction. Rehearse has fragments of this; nobody has the whole arc with an evidence base.
3. **Progress you can feel without scores.** "Things you actually said out loud" and "conversations you actually had" as the record of progress. This matches docs/08's "progress is the user's chosen action."
4. **Visible privacy as part of the experience.** "What Alex knows about you" as a tangible card. Private notes visibly locked. A data page that tells the truth about each provider.
5. **A gradual ladder of modalities.** Type it, then say it with the face hidden, then face to face. No competitor offers a gradual ramp of social presence inside one scenario.

## 7. Sources

- [C1] Vocal Image, "Best Apps to Practice Difficult Conversations with AI (2026)," updated September 2026. Self-interested (author's own app ranked first). https://www.vocalimage.app/en/articles/37-practice-difficult-conversations-ai-apps/
- [C2] Yoodli Help Center, "How to build and customize Roleplays." https://support.yoodli.ai/en/articles/11565137-how-to-build-and-customize-roleplays
- [C3] Yoodli, product and feedback pages. https://yoodli.ai/ and https://yoodli.ai/platform/ai-feedback ; custom goals: https://support.yoodli.ai/en/articles/11556965-creating-custom-goals
- [C4] VirtualSpeech, "Difficult Conversations." https://virtualspeech.com/practice/difficult-conversations
- [C6] iGrow listing (MWM). https://mwm.ai/apps/igrow-ai-roleplay-practice/6757130429
- [C7] Dave Swift, "Tough Tongue AI AppSumo Hands-On." https://daveswift.com/tough-tongue-ai-appsumo-hands-on/
- [C8] Duolingo blog, "How Duolingo uses AI to Create the Perfect Speaking Practice." https://blog.duolingo.com/ai-and-video-call/ ; Rive, "Duolingo's AI-powered Video Call brings Lily to life with Rive." https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life
- [C9] Rehearse Product Hunt launch overview (hunted.space mirror). Maker's description; claims unverified. https://www.hunted.space/product/rehearse-2
- [C10] Rehearse: Conversation Coach, Shipaton showcase listing. https://apps.shipaton.com/app/rehearse-conversation-coach
- [C11] Maison GR, "Rehearse — AI Conversation Training Platform." https://www.maisongr.com/en/work/rehearse
- [C12] BodySwaps features and pedagogy. https://bodyswaps.co/features ; https://bodyswaps.co/resources/blog/how-bodyswaps-works-vr-vs-desktop-vs-mobile
- [C13] Hyperbound support and product pages. https://support.hyperbound.ai/articles/2088692386-how-to-use-ai-coaching-effectively-in-hyperbound ; https://support.hyperbound.ai/articles/4766442898-how-to-create-scorecards ; https://www.hyperbound.ai/product/hyperbound-practice
- [C14] Hyperbound, "Hyperbound vs Second Nature." Self-interested comparison. https://www.hyperbound.ai/blog/hyperbound-vs-second-nature-ai-sales-demo
- [C15] Coachello, "Practice Difficult Conversations with AI Roleplay." https://coachello.ai/ai-avatar-roleplays/practice-difficult-conversations/
- [C16] Murmur: AI practice calls, App Store. https://apps.apple.com/us/app/murmur-ai-practice-calls/id6755495030
- [C17] KallyConfidence. https://kallyai.com/kallyconfidence
- [C18] Real Talk Studio, "How to Roleplay with ChatGPT" (third-party description of GPT-Live; not checked against OpenAI). https://www.realtalkstudio.com/blog/how-to-roleplay-with-chatgpt
- [C19] r/ChatGPT, "Difficult Conversation Simulator" prompt thread. https://www.reddit.com/r/ChatGPT/comments/1r01esg/i_made_a_difficult_conversation_simulator_prompt/
- [C20] r/AppsWebappsFullstack, Confident Caller launch thread. https://www.reddit.com/r/AppsWebappsFullstack/comments/1skkona/i_built_a_free_web_app_that_lets_you_practice/
- [C21] Work Coach, job search page. https://work.coach/job-search
- [C22] Convo. https://www.tryconvo.app/
- [C23] Shaikh, Chai, Gelfand, Yang, Bernstein, "Rehearsal: Simulating Conflict to Teach Conflict Resolution," CHI 2024. https://arxiv.org/abs/2309.12309
- [C24] Louie et al., "Can LLM-Simulated Practice and Feedback Upskill Human Counselors? A Randomized Study with 90+ Novice Counselors," CHI 2026. https://arxiv.org/abs/2505.02428
- [R06] See [R06-USER-NEEDS.md](R06-USER-NEEDS.md) for the autism co-design source.

Not verified: Assertr and Hard Talk Roleplay Coach details beyond the C1 roundup; whether Rehearse's face is a third-party avatar API; Vocal Image's feature claims.
