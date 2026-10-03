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
- The project remains unnamed.
- Latest infrastructure direction: return to Supabase Auth/PostgreSQL because AWS credits will not arrive in time. This explicitly supersedes the earlier AWS/Cognito/Aurora plan. Keep required sign-in; no anonymous workspace. The user supplied the fresh project configuration; Auth health passed, while sign-in/database integration remains unverified. No unrelated project is being reused.
- Sign-in is required before all persona/conversation design and practice. This supersedes anonymous sign-in and guest-first entry.
- Visual direction: warm and minimal, with crisp, modern typography, spacing, and controls.

## Appearance presets, October 3, 17:23 EDT
Decided, not built. A closer face and voice make practice more useful, so a saved person should be able to look and sound like that relationship. For now the user picks from a short preset catalog: stock Tavus faces and premade ElevenLabs voices. There is no photo upload, no generated likeness, and no voice cloning. The counterpart stays fictional; a preset does not make them the real person and does not change traits or which About-me facts they know.

This is not part of the in-progress G3 gate. Do not add a picker, person fields, or extra provider characters while G3 is open. Current calls keep the one configured face and voice.

When it is scheduled: the face is already chosen per call. The voice is fixed on the immutable PAL, so each distinct premade voice needs its own PAL with the same roleplay settings (docs/06). The person stores a preset id; the server maps it to provider ids. The browser does not send those ids. Do not create the extra PALs until that work starts. If demo time is short, drop the catalog before cutting generation, live video, or G3 sharing (docs/10).

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
| Rewind/group roleplay deferred | High implementation cost and replay-loop concerns |
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
