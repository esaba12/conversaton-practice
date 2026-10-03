# Photon text-message rehearsal

Status: first stretch feature, authorized for planning. Not implemented. Core voice remains mandatory. Sponsor requirement and prize details come from the official MHacks prize page (S36); exact Spectrum SDK and hosting requirements still need verification before coding.
Confirmed solo build: deferred until all core gates pass and demo/submission preparation is covered.

## Product
Practice a difficult text conversation with a fictional counterpart through iMessage. Example: telling a roommate you cannot cover their share of rent again. This is rehearsal with the app, not drafting or sending messages to the actual roommate.

Share approved persona traits and user preferences across channels. Freeze their versions at session start. Keep each session's transcript separate; never inject prior voice transcripts into text roleplay automatically. The counterpart sees only the same role-safe context allowlist as voice.

## User flow
1. In the authenticated web app, configure scenario, persona, and communication goal.
2. Choose Text practice and explicitly link an iMessage identity through a verified pairing flow.
3. Review the fictional-counterpart label and delivery/privacy disclosure; explicitly start practice.
4. Exchange messages through Spectrum. Each inbound message receives a context-appropriate response, not proactive companionship.
5. End with END/STOP or the web End control. Turn cap and inactivity expiry also close the session.
6. Return to the web app for optional reflection and memory approval. No automatic follow-up messages.

Start requires a verified messaging identity and explicit confirmation. A single user can have only one active voice or text session. Starting text while voice is active returns a conflict and offers to end the existing session first.

## Proposed limits
Product defaults, not clinically validated: 10 user turns maximum and 10 minutes of inactivity. Warn in the web UI before starting; enforce limits server-side. A cap may include one brief closure in response to the final inbound message. Inactivity expiry closes silently, without a re-engagement notification. After closure, require a new explicit start in the web app.

Recognize END/STOP case-insensitively as control commands before model invocation. End cancels queued replies and checks closed state again immediately before delivery. Clearly explain any provider delivery that cannot be recalled once sent.

## Integration gate
Before coding, verify with official Photon/Spectrum documentation or sponsor staff:
- Account access, credits, iMessage sender provisioning, hosting/runtime requirements, and available SDK.
- Authentication for inbound events and how sender identity is represented.
- Stable message IDs, ordering, delivery acknowledgments, retries, and outbound idempotency support.
- Text retention, deletion capabilities, rate limits, and costs.

No guessed SDK methods, environment-variable names, or webhook signature formats are authorized by this document. If trustworthy event authentication or identity linking cannot be established, do not enable a public integration. A clearly described supervised development demo is the fallback.

## Application contract
Keep provider calls behind lib/text/. The adapter accepts a session snapshot and verified user message; it returns a fictional counterpart response through a server-side text model. Reuse context validation and safety boundaries, not the audio pipeline.

Link owner identity using a short-lived, single-use, high-entropy challenge initiated in the authenticated app. Verify control of the messaging identity and require web confirmation before enabling delivery. Do not treat a typed phone number as proof of ownership. Minimize identifiers and never log pairing tokens or message bodies.

Deduplicate inbound provider events transactionally. Serialize turns per session. Track outbound status; use vendor idempotency where supported. If send outcome is unknown, avoid blind retries and expose a recoverable status in the web app. Do not promise exactly-once delivery without provider support.

## Temporary context and memory
Store only the minimum temporary text context needed for active roleplay and web reflection, encrypted and owner-scoped. Proposed cleanup: after reflection or 30 minutes after closure, whichever is first; hard TTL one hour from receipt. Implement scheduled cleanup for abandoned sessions. These are application limits, not guarantees about provider/device storage.

Persist only user-approved preferences, persona edits, and permitted summaries. Fictional dialogue cannot establish real-world facts. End does not silently generate and send a judgment by iMessage. Reflection remains optional in the web app, with approve/edit/dismiss memory controls.

## Boundaries
- No existing iMessage chat ingestion, contact-book access, or impersonation of an actual person's account/voice.
- No messages to the real counterpart or third-party group chats.
- No unsolicited reminders, reassurance check-ins, or messages after closure.
- No scoring of social worth, predicted approval, or inferred anxiety.
- No automatic profile/persona changes from text conversation.
- Clearly identify the conversation as fictional AI practice.

## Build and cut rule
For this solo build, complete all core gates and cover demo/submission preparation first. Only then, if time remains, spend at most 60-90 minutes establishing text feasibility. Cut text before compromising situation generation, voice quality, identity isolation, memory approval, or the submission deadline. Relay is lower priority and should not be built alongside this extension.

## Sponsor submission
The MHacks Photon category requires Spectrum connecting the agent to iMessage. Listed first prize is $700 combined value: $400 cash, $300 Photon credits, plus a fast-track to the final interview round. Second is $300 combined value: $200 cash and $100 credits. Confirm eligibility and category stacking with organizers; the interview fast-track is not a job offer.

Show a real round trip, persistent approved persona settings, context-aware replies, and a clean ending. Describe precisely what was built. No registration, messages, account linking, or provider configuration has been performed by this documentation update.
