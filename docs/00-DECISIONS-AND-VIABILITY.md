# Decisions and viability

## Decision
Proceed as a hackathon prototype. Business viability and clinical benefit remain unproven.

The founder's experience is specific: a therapist played the other person so he could rehearse a feared conversation. The product reproduces the practice interaction, not the therapist's clinical role.

## Confirmed user direction, October 3
- Latest resource/preference: user supplied a Tavus student offer and wants ElevenLabs used wherever practical. Research confirms Tavus CVI can use ElevenLabs TTS. Evaluate that combination before requiring LiveAvatar, while explicitly distinguishing ElevenLabs speech from the full ElevenLabs Agents platform. Offer activation, account access, provider choice, and live behavior remain unverified; see docs/22-LIVE-VIDEO.md. No backend/model/provider migration has been executed.
- Confirmed product correction: FaceTime-style practice with a visible talking AI counterpart is the main draw and mandatory core scope. This supersedes voice-only acceptance and the blanket avatar exclusion. The first feasibility candidate is ElevenLabs with HeyGen LiveAvatar; separate account access, personalization, and live quality are unverified. See [live video](22-LIVE-VIDEO.md).
- One human builder, explicitly using multiple coding agents and worktrees in Warp. Parallelize independent engineering tasks inside ordered product gates. Keep shared contracts and integration under one coordinator; see docs/19-AGENT-WORKFLOW.md. This app's service access and credentials are not yet verified.
- Fresh sessions are desired. Approved settings can persist without carrying fictional events into later sessions.
- The user confirmed live roleplay: generate the counterpart, context, and opening from a user-described situation, then respond live to the user's speech. Written dialogue generation is outside the current scope.
- Keep situation generation in core scope. Defer Photon until all core gates pass; simplify automated reflection and extra voices first.
- The product name is SpeakEasy (owner decision, October 4, 2026).
- Latest infrastructure direction: return to Supabase Auth/PostgreSQL because AWS credits will not arrive in time. This explicitly supersedes the earlier AWS/Cognito/Aurora plan. Keep required sign-in; no anonymous workspace. The user supplied the fresh project configuration; Auth health passed, while sign-in/database integration remains unverified. No unrelated project is being reused.
- Sign-in is required before all persona/conversation design and practice. This supersedes anonymous sign-in and guest-first entry.
- Visual direction: warm and minimal, with crisp, modern typography, spacing, and controls.

## Appearance presets

Decided October 3, 17:23 EDT. Built October 4 as the four-starter picker ([PR #87](https://github.com/esaba12/conversaton-practice/pull/87), issue #37). A saved person can keep the default look or use one of the four starters: Alex (roommate), Ellis (professor), Sam (saying no), or Jordan (manager). Each starter is a stock Tavus face and a premade ElevenLabs voice, on its own PAL. There is no photo upload, no generated likeness, and no voice cloning. The choice does not change traits or which About-me facts that person knows, and it does not make the counterpart a real person.

The picker is on the saved-person page, under "Look and voice." The browser sends a starter name (`roommate`, `professor`, `decline`, `manager`) or null for Default. It never sends a provider id. The server maps that name to the starter's face and PAL. The larger catalog of about eight faces was cut with Phase 4. The stand-in face stays reserved and is not one of the four.

A live call with a non-default face has not been reported. Until that call, this picker is automated-tested and **live not verified**. Details: [docs/02](02-UX.md), [docs/06](06-ELEVENLABS.md), [docs/26](26-PEOPLE-AND-SHARING.md).

## One-moment retry, October 3, 21:26 EDT

Decided, not built. The buildable shape is [docs/30](30-ONE-MOMENT-RETRY.md).

The user asked for a goal set before the practice, and a way to try again at the moment they did not follow it. The example was giving in when the other person gets emotional. The same request asked for a design that does not become rumination.

- The goal stays one observable line the user will say. An optional second line covers the hard moment: "When they sound disappointed, I will acknowledge it once and repeat what I need."
- The product suggests actions. "Stay calm," "don't feel guilty," "get a yes," and "don't cave" are the wrong targets, because they describe a feeling, an outcome the user does not control, or a judgment of the person.
- After the call, the user answers whether they said the line. Yes stops there. Not sure stops there. No may offer one new call that starts at that moment.
- The product does not detect giving in, assign a grade, or rewind the first call.
- The second call practices acknowledging the disappointment and keeping the request. Ignoring the other person's feeling is a different behavior, and this feature does not teach it.
- One retry in a sitting, then stop. The first call is not played back and is not stored for this feature.

This narrows the deferred rewind row in the scope table below. Rewind, group roleplay, scores, and branching replay stay out. If the optional repeat-practice shortcut in the PRD is ever built, it uses docs/30.

Research behind the one-moment retry, reviewed October 3. It informs the design. It does not show that the feature helps.

- Skills rehearsal uses one target behavior, one correction, and an immediate second try. A detailed review after a social event is a different activity, and social-anxiety models treat that review as something that keeps anxiety going (Clark & Wells, 1995; Dannahy & Stopa, 2007, *Behaviour Research and Therapy*).
- Feedback that pulls attention onto the self reduces performance more often than feedback about the task (Kluger & DeNisi, 1996). An automatic "you caved" label is that kind of feedback.
- In negotiation experiments, people conceded more when a counterpart showed disappointment or worry, and high-trust people conceded more to disappointment than to happiness. A counterpart's displayed guilt had the opposite effect (Van Kleef, De Dreu, & Manstead, 2006, *Journal of Personality and Social Psychology*). Disappointment is the moment to practice. Cruelty stays out of scope (docs/08).
- Answering a partner's destructive moment with a constructive response is associated with better relationship functioning (Rusbult, Verette, Whitney, Slovik, & Lipkus, 1991). The line to practice is "I hear that you're frustrated, and I still need this," not indifference.
- Rehearsed if-then plans have a stronger evidence base than open-ended extra practice (Gollwitzer & Sheeran, 2006; the 2024 update summarized in [docs/research/R03](research/R03-SCIENCE-AND-FRAMEWORKS.md)). Deliberate practice explains much less of performance in unpredictable work than in games or music, so the retry is one variant of one moment.
- Watching a recording of yourself helps only after a prepared, single viewing (Harvey, Clark, Ehlers, & Rapee, 2000). This product does not record the user. The retry goes forward from the planned line.
- A third take in the same sitting crosses the over-rehearsal line already in docs/08 and in R03 section 4.

## Post-submission plan, owner answers October 3, ~21:50 EDT

Decided, not built. The roadmap is [docs/31](31-PRODUCT-VISION.md), the feature specs are [docs/32](32-FEATURE-SPECS.md), and the screens are [docs/33](33-DESIGN-SYSTEM-AND-SCREENS.md). The running app keeps today's prompts and privacy behavior until those specs are implemented. docs/07 and docs/08 record the amendments below so a later build does not follow the older lines.

The owner asked for a simulator: practice opens on people cards, and the situation is entered after choosing a person (docs/31 §4a). A person is identity. A situation is per practice and starts fresh. Saved situations, at most five per person and only when the user explicitly saves one, stay an open question (D13).

| # | Decision | Spec |
|---|---|---|
| D2 | Reflection runs after End unless the user presses Skip. Skip during a short grace period sends nothing. The green room says the in-memory transcript is sent once and not stored. | L1 |
| D3 | "Another way to say it" returns one phrasing of the user's own goal line, only when they ask, labeled as one option. The counterpart never says it. | A1 |
| D4 | Goal light is opt-in and off by default. A separate model may mark that the user said their line. The counterpart never receives the goal. | G1 |
| D6 | Setup infers three short chips — what they want, why they hold back, when they soften — with alternatives the user can override. The recap may show those chips in a collapsed dropdown, labeled as fiction set before the call. No prose about hidden thoughts. | Q2 |
| D7 | The counterpart may hear vocal tone through Tavus Raven-1 with emotion recognition set to full, and no camera analysis. The character card and the green room say so. Tone is not saved or shown. | T1 |

Still open, and not to be built as if decided: numeric feedback (D1), a mid-call hint drawer (D5), reminders outside the app (D8), designed voices (D9), a custom counterpart LLM (D10), more than the one retry in docs/30 (D11), a drill mode (D12), and saved situations (D13).

## Wow pass, owner answers October 3, ~22:15 EDT

Decided, not built. Specs in [docs/next/04-NEW-SPECS](next/04-NEW-SPECS.md); plan in [docs/next/02-BUILD-PLAN](next/02-BUILD-PLAN.md).

The owner corrected the origin story: in the original practice, the other person played him first to show him how it could go, while he played his boss. Then he played himself. The product copies that order.

| # | Decision | Spec |
|---|---|---|
| D14 | **Show me first**, built into the main flow (22:25): the recommended first step the first time the user practices with a person, always skippable. Before the user's own call, a call where a fictional stand-in plays the user and says the user's own goal line, while the user plays the counterpart. Then "Your turn." Once per sitting; at most three calls per sitting including the docs/30 retry. The stand-in gets the goal and hard-moment line for that call only. The counterpart still never receives the goal. The stand-in's face and voice never match a person preset or the user. | W10 |
| D15 | No spoken situation input. The situation stays typed. | – |
| D8 | No reminders outside the app. The real-conversation date is optional, a side option, never a required or repeated prompt. | B1, B2 |
| D17 | The owner gives the pitch himself. The product never uses "therapy" or "therapist". | W9 |
| UI deps (22:35) | Add `lucide-react` for all icons and `motion` for springs, staggers and in-screen layout animation, both with reduced-motion fallbacks. Screen-to-screen morphs stay on React `<ViewTransition>`. Rive is not approved. | [05-UI-UPGRADE](next/05-UI-UPGRADE.md) §8 |
| Faces (22:41) | More faces in the product, split across phases. **Phase 1:** real portraits (Tavus face thumbnails, served by preset id) and a distinct stock face plus premade voice for each starter (Jordan, Alex, Ellis, Sam). **Phase 3:** the full catalog of about 8 faces with 4–6 premade voices and the "Look and voice" picker for saved people (B4). Same limits as before: stock faces and premade voices only, no photo upload, likeness or cloning; the stand-in face stays reserved. **Built October 4, narrower than this row:** the picker shipped with Default plus these four starters only. The rest of the catalog was cut. | B4, W6; [02-BUILD-PLAN](next/02-BUILD-PLAN.md) §3 C1 |

## Research direction
NICE recommends disorder-specific CBT that includes behavioral experiments or graduated exposure, depending on the model, with practice beyond treatment sessions (S05). CCI's assertiveness materials cover expressing needs, saying no, responding to criticism, and progressively practicing chosen challenges (S39). These sources support focusing practice on a concrete action followed by an optional real-world step; they do not establish this AI app as treatment.

The directly relevant VChatter paper reports a six-day qualitative evaluation with 10 participants (S40). It is preliminary evidence about feasibility and experience, not a comparative efficacy trial of this product. No source reviewed establishes that roommate, professor, or refusal scenarios are clinically superior to one another. Keep user-chosen situations primary and retain the roommate cleaning request as a practical demonstration of making a clear request. That demo selection is a product judgment, not a research ranking.

## Competitive position
Rehearse offers custom voice scenarios; Talkville offers social roleplay; Yoodli offers configurable professional conversation training. The concept is not novel by itself. Research found small visible consumer footprints for some direct alternatives, but does not establish market size or a vacant market. See S01-S04 in [sources](14-SOURCES.md).

Proposed differentiation is the combination of:
- User-editable, coherent fictional counterparts.
- Explicitly approved profile/persona updates.
- Bounded practice centered on expressing a goal.
- Natural voice interaction and visible user control.

This combination is a product hypothesis, not a verified market first.

## Scope decisions

| Decision | Rationale |
|---|---|
| Adults and everyday college conversations | Clear audience and manageable demo |
| One live counterpart per session | Fits the time budget |
| Generated setup from the user's situation, with three fallback presets | Makes the user's stated requirement the primary flow |
| One base ElevenLabs roleplay agent | Avoids creating one remote agent per user persona |
| Application-owned profiles and versions | Makes memory auditable |
| Structured output for draft/reflection | Enables validation and predictable UI |
| No permanent raw transcript by default | Reduces unnecessary sensitive data |
| No score or automatic difficulty increase | Avoids optimizing practice for approval or perfection |
| Rewind/group roleplay deferred | High implementation cost and replay-loop concerns. October 3, 21:26: a later one-moment retry is allowed only in the shape in docs/30 |
| Coding subagents/worktrees with task ownership | Reduces independent implementation time without adding a runtime orchestration framework |
| Documentation updated with each change | Clear contracts and actual evidence make parallel work and restarts reliable |
| Minimal durable identity/session records in G1 | Required sign-in, owner authorization, concurrency, and cleanup need a real storage foundation before the first gate passes; saved domain memory remains G3 |

## Risks and responses
1. Voice feels like a helpful assistant. Fix short role-specific responses and natural disagreement before adding features.
2. Reflection becomes reassurance. Keep a factual takeaway; do not predict approval.
3. Persona learns invented facts. Restrict updates to user statements and explicit edits.
4. Setup dominates practice. Offer a preset in a few clicks; avoid mandatory personal histories.
5. Latency or venue noise undermines the demo. Test a headset on the actual connection; record a backup demonstration.
6. Auth/hosting delays consume the build. Keep a visibly labeled local mock for UI development, but do not present it as persistence or voice.
7. Clinical interpretation exceeds evidence. Describe rehearsal only, with clinician review required before any treatment positioning.

## Go/no-go gates
- Hour 2 target: authenticated real audio round trip, durable owner-scoped session limits, and functional End control.
- Hour 6: a new user-described situation generates an editable setup; its character remains coherent for five turns and accepts interruptions.
- Hour 10: one authorized persona and approved profile update survive refresh.
- Hour 18: no critical privacy, ownership, or session-teardown failures.
- If a gate fails: cut features in the order in the build plan. Do not compensate with unimplemented claims.

## Evidence boundaries
NICE and CCI support considering safety behaviors, self-focused attention, and pre/post-event processing (S05-S06). They do not validate our session duration, retry limit, memory design, or efficacy.
Official live-page links now establish track descriptions, listed prizes, submission deadline, pitch duration, and general judging factors (S35-S38). No numeric judging weights or permission to stack prizes were found. Target Actually Intelligent and both ElevenLabs categories; see [event strategy](16-MHACKS-STRATEGY.md).
