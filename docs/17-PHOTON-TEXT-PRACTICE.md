# Photon text practice

Status: **snapshot on `docs/photon-text`, not merged, live not verified.** Taken October 4, 2026, out of time. `spectrum-ts` 12.10.1. Video calls do not read the Photon environment variables. The landing mention does not mean text works.

## Shortcomings

Do not merge this as a finished channel.

- The migration `20261004130000_text_channel.sql` has not been applied to the shared database, and there is no SQL test run for it.
- A Spectrum project id and secret are in the main checkout’s local env only. `SPECTRUM_WEBHOOK_SECRET`, `PHOTON_LINE_E164`, and `PHOTON_PUBLIC_ORIGIN` are unset. Those values are not on Vercel.
- The Photon dashboard is on Free & Pro and shows `account_phone_missing`. There is no line number to text. A shared-pool plan does not give this app one stable number. A dedicated line is a Business-plan charge and was not created.
- The webhook is not registered. Production does not serve `POST /api/integrations/photon/events`. `speakeasyapp.tech` was added in Vercel, and DNS was not pointed yet.
- No iMessage has been sent or received. The signed-in Text control was not opened in a browser. Unit tests passed earlier in this worktree (792). That is not a live check.
- This branch’s landing is the older public page, not the SpeakEasy landing on `ui/redesign`. Merging the two will conflict.
- The branch was last merged with main at `5e0e793` and does not include later main, redesign, or privacy work.

Documentation used: Photon **Stable** only ([docs index](https://photon.codes/docs/llms.txt), [Spectrum getting started](https://photon.codes/docs/spectrum-ts/getting-started), [webhooks](https://photon.codes/docs/webhooks), [events](https://photon.codes/docs/webhooks/events), [app cards](https://photon.codes/docs/spectrum-ts/content/app), [iMessage provider](https://photon.codes/docs/spectrum-ts/providers/imessage)). The Photon agent skill in `photon-hq/skills` pins `spectrum-ts` 12.2.0. That pin is a reading target, not an installed version. Before coding, read the installed package types and the Stable verifier page ([verifying signatures](https://photon.codes/docs/webhooks/verifying-signatures)). Do not paste a shortened signature check into the app.

This file is the contract. [docs/03](03-ARCHITECTURE.md), [docs/04](04-DATA-AND-MEMORY.md), and [docs/05](05-API-AND-ACTIONS.md) point here. Proposed routes below are application routes. They are not Photon URLs.

## Decision

Text practice is a later channel on the same product. The in-person practice stays the Tavus video call. A phone-call practice, if it is built, uses ElevenLabs and is outside this spec. Photon Spectrum is the iMessage transport only. Do not add `photon-hq/voice-ts` or Spectrum SIP.

The user starts on the website. They add a mobile number once. After that number is verified, text practice is unlocked for the account. Two ways then start the same kind of session:

1. On the website, after the usual review, press **Text** instead of **Call**.
2. Text the Photon number. Because the number is already linked, the reply is a Photon **app card** in the thread. The card opens this app's picker inside Messages. The user picks a saved person or an example, and that starts the practice.

Photon delivers that card with `app(url, { live: true })` from `spectrum-ts`. The recipient installs Photon's iMessage app once, from inside Messages, the first time they tap a card. Do not build an Apple iMessage extension, and do not use `customizedMiniApp`. A native poll is not the picker.

## What the user sees

### Locked

Call works as it does today. Text is visible and disabled. The control says **Add your number**. No Photon request runs.

### Add your number

Signed-in only. The user types a mobile number. The server normalizes it to E.164. The page then shows a one-time code and the Photon line number, with the instruction: text the code, alone, to that number. The page waits. It does not ask the user to type the code back into the website. The inbound text is the proof they control the phone.

When the matching text arrives, the page becomes linked and shows the number masked to its last four digits. Text unlocks. The same number stays linked across later practices.

If they already have a linked number, the page shows that mask and **Remove number**. Removing ends any live text practice for that account and stops further replies.

### Start from the website

The review screen is unchanged: preset, reviewed role, or saved person, including a saved situation once that start exists. **Call** keeps today's body and still returns a Daily credential.

**Text** is enabled only when a number is linked and no practice is already live. Pressing it takes the same one-active lease as a call, freezes the role, and does not create a Tavus conversation. The page leaves the call layout. It shows the counterpart's name, the line number, and **End**. The server sends the role's `opening` into the existing iMessage thread. That opening is the counterpart's first text. The user's next text is the first turn.

If a call is already live, Text returns the same `SESSION_ACTIVE` conflict Call would, with that session id, and offers End. Text never starts beside a call.

### Start from the thread

The user texts the Photon number and does not have a text practice waiting.

- The number is not linked. The reply is one line: add the number on the website. No names, no card, no model call. A text that is exactly a pending link code is handled as linking, described below.
- The number is linked, and a **call** is live. The reply is one line: end the call on the website first. No card.
- The number is linked, and nothing is live. The reply is one short line plus one app card: "Pick who you're practicing with." The card opens the picker. Further texts before a pick do not roleplay. If the card's token is still valid, the reply points at that card. If it has expired, a new card replaces the instruction.

The picker is a page on this app, opened from the card. It does not use the website's sign-in cookie. The token in the URL is the only authorization.

The page lists, in order:

1. Saved people for that owner, newest update first, matching `GET /api/people`. Each row shows `name` and `relationship`. Private prep, shared-fact text, goals, and the role JSON are not on the page.
2. If the chosen person has saved situations (`MAX_PERSON_SITUATIONS` is 5), a second step lists those labels plus **Their usual setup**. Usual setup is the person record itself (`personToRole`). Choosing a saved situation uses that situation's fields the same way a person-plus-situation video start will. Saving situations does not bump the person version; the start still sends `expectedVersion` of the person.
3. A separate group, labeled examples: Alex (`roommate`), Ellis (`professor`), Sam (`decline`), Jordan (`manager`). These resolve through the existing preset map in `lib/session/server.ts`. They are not saved people.

An owner with no saved people still sees the four examples. The page says they can save someone on the website. It does not invent a person.

Confirming a row starts the text session and sends `opening` into that same thread. The page then says to look at the texts. The card is not updated into a live mini-app after the pick. One card, one pick.

### During the practice

Replies are short texts from the fictional counterpart. They follow the frozen role, traits, and shared About-me facts from the moment of start. They do not coach, score, or talk about the practice as a product, except the fixed lines in the end and safety sections.

The website's End control stays available the whole time. The thread accepts `END` or `STOP` as a whole message. Mute is not a text control. There is no camera and no Daily room.

### After End

The thread gets one closing line when the user ends it or hits the turn cap: "This practice has ended. Start the next one on the website, or text me when you want to pick someone." An inactivity expiry sends nothing.

Reflection stays on the website, on the ended session, with the same approve, edit, and dismiss memory controls as a call. The server uses the turns it stored. The website does not submit a transcript for a text session. Nothing is texted back as feedback. Approved memory is still an explicit save. Fictional texts do not become facts.

## Session rules

One live practice per owner. The partial unique index on `practice_sessions` for `connecting`, `active`, and `ending` already enforces that. Text and video share it.

A text session stores `channel = 'text'` and leaves `provider_conversation_id` null. It never calls `assertTavusConfigured`, `createConversation`, or `stopConversation`.

Video sessions stay `channel = 'video'`. Omitting the channel on today's `POST /api/sessions` remains a video start. Existing rows default to `video`.

The role is frozen at start. A later edit to the person changes the version and affects the next practice only. `loadPersonContext` still runs before the lease, and a stale `expectedVersion` is still `409 VERSION_CONFLICT` before any lease or Photon call.

`startSession` in `lib/session/server.ts` currently rejects `situation`, `openingOverride`, and `standIn` with 400, and always calls Tavus. Text does not widen those branches early. Until person-plus-situation and stand-in video starts exist, the website Text button accepts only the start bodies video actually accepts: preset, reviewed role, and saved person. The picker's saved-situation step ships in the same change that enables person-plus-situation starts. Stand-in is video-only and never a text start.

Each practice is fresh. Prior call transcripts and prior text turns are not copied into the role. The text model sees the frozen role and the turns of this session only.

## Linking

`POST /api/text/link` with `{ "phone": "<user typed>" }`, signed in, body at most 256 characters.

- Normalize to E.164. A value that does not normalize is `400 VALIDATION_ERROR`.
- If this owner already has a verified number, `409` with a stable message that they must remove it first. Do not create a second link.
- Otherwise insert a challenge: owner id, E.164, SHA-256 of the code with `SESSION_SERVER_SECRET` as pepper, expiry 10 minutes, unused. Return the raw code once. Store only the hash.
- The code is 10 characters from the Crockford alphabet, excluding lookalikes. It is the entire SMS body the user must send, after trim. Extra words do not match.
- At most 5 challenges per owner per hour. Over the limit: `429 USAGE_LIMIT`. Creating a new challenge expires that owner's older unused challenges.
- The response is `{ "code", "lineE164", "expiresAt" }`. `lineE164` comes from server configuration, not from the client.

The webhook, not this route, marks the link verified. Match is constant-time on the hash, and the sender's E.164 must equal the challenge phone. Success inserts `text_links` and consumes the challenge in one transaction. A code that does not match gets the unlinked reply, not a hint.

If that phone is already verified for a different owner, do not move it. Reply in the thread: "This number is already linked. Remove it from the other account on the website first." The waiting page stays unlinked.

`GET /api/text/link` returns `{ "linked": false }` or `{ "linked": true, "phoneLast4": "1234" }`. It does not return the full number or any code.

`DELETE /api/text/link` removes the link, ends a live text session for that owner with reason `user`, deletes its turns and snapshot, and leaves a live **video** session alone. Later inbound texts from that phone are unlinked again.

Challenges and codes are never logged. Webhook logs may keep `message.id`, `space.id`, and the event type. They do not keep bodies, phones, or tokens.

## The card and the picker

Send the card only from the server, only to the DM `space.id` that just texted, only for a verified link with no live text session.

```ts
import { app } from "spectrum-ts";
await space.send(app(pickerUrl, { live: true }));
```

`pickerUrl` is the absolute public origin plus `/text/pick?token=<raw>`. The raw token is 32 bytes, base64url. Store only its SHA-256. Bind the row to `owner_id`, `space_id`, and expiry 15 minutes from send. One unused token per owner. Sending a new card expires the previous token. A token is consumed when a start succeeds. A failed start (conflict, stale version) does not consume it.

`live: true` asks Messages to render the page inside Photon's iMessage app. The page must work as a normal HTTPS page too, because `live` is a hint. It has no dependency on the Supabase cookie. If a cookie is present, ignore it.

`GET /text/pick?token=` renders the list, or a dead-link page when the token is missing, unknown, expired, or already used. The dead-link page tells them to text the number again. It does not say whether an account exists.

`POST /api/text/pick` body, at most 4096 characters, one of:

- `{ "token", "personId", "expectedVersion", "situationId"?: uuid }`
- `{ "token", "preset": "roommate" | "professor" | "decline" | "manager" }`

No `ownerId`. The token resolves the owner. `situationId` is optional and only legal with `personId`. Omitting it means usual setup. Another owner's person or situation is `404 NOT_FOUND`. Stale person version is `409 VERSION_CONFLICT`. A live session is `409 SESSION_ACTIVE` and does not send a second opening.

The picker start uses a server-generated idempotency key. Retrying the same POST after a committed start returns the existing text session and does not send the opening again.

## Inbound dispatch

Spectrum posts every inbound message to `POST /api/integrations/photon/events`. The route reads the raw body before JSON parsing. It rejects a missing header, a bad signature, or a timestamp older than 5 minutes, using the Stable verifier. Failures return 401 and do nothing else.

Headers the Stable events page documents: `X-Spectrum-Event`, `X-Spectrum-Webhook-Id`, `X-Spectrum-Timestamp`, `X-Spectrum-Signature` (`v0=<hex hmac>`). The only event today is `messages`. Ignore unknown `event` values with 200.

Delivery is at-least-once. Insert `message.id` into `text_inbound_dedupe` in the same transaction as the decision to handle it. A duplicate id returns 200 and does not run the model or send. Keep dedupe rows 48 hours, then delete them. There is no public HTTP send API. A reply constructs a short-lived `Spectrum({ projectId, projectSecret, providers: [imessage.config()] })` and sends to the DM for `message.sender.id`. For iMessage that id is the E.164 number. Treat it as an opaque string that happens to be a phone number. Do not parse a group GUID out of user text.

Handle only `space.type === "dm"` and `message.direction === "inbound"`. Group spaces get no reply, no card, and no model call. Ignore reactions, read receipts, and typing. An attachment gets one reply in an active text practice: "This practice is text only." It does not go to the model. Outside a practice, ignore attachments.

Dispatch for a DM text, after dedupe:

| Condition | Action |
| --- | --- |
| Body matches an unused, unexpired challenge for this sender | Verify the link. Reply "You're linked. Text me when you want to practice." Do not start a session. |
| No verified link | Reply with the add-your-number line. No model. |
| Verified, a video session is `connecting`, `active`, or `ending` | Reply to end the call first. No model. |
| Verified, a text session is `connecting` | The opening send is still in progress. Do not start a second one. Queue the body as a turn only after the session is `active`. If it is still `connecting`, hold the body on the session and include it in the first turn once active. |
| Verified, a text session is `active` | A whole-message `END` or `STOP` ends it. Otherwise it is a turn. |
| Verified, no live session | Send or refresh the card. No model. |

`END` and `STOP` match the trimmed body case-insensitively and nothing else. "I need this to end" is a turn, not the command. Check the command before the model.

Turns debounce per `space.id`. Insert each new text onto the session, then wait until 3 seconds pass with no newer inbound id for that space. Generate once for the whole burst, in arrival order, joined by newlines. If a new text arrives after generation starts and before send, drop that outbound and generate again with the new lines included. The send stores a client id `text-send-<sessionId>-<firstMessageId>` so a retry of the same burst does not deliver twice. Spectrum's own dedupe support must be confirmed in the installed types before relying on a vendor idempotency key. Until then, the application still stores the outbound id and will not call send again for a burst it has marked sent.

The webhook returns 200 only after the inbound id is durable. Model and send run after that. If the function dies after the insert and before send, the next inbound for that space, or **Retry reply** on the website, resends from the stored outbound when one exists, and otherwise generates once. Do not call the model twice for one burst.

A burst counts as one user turn. Cap is 10 user turns. The reply to the 10th turn is in character and then the closing line, and the session ends with reason `time_limit`. The opening the server sent does not count.

Inactivity is 10 minutes from session start, or from the last user burst, whichever is later. Each accepted burst sets `expires_at` to now plus 10 minutes through a server-only RPC. The existing video expiry sweep ends the row when that time passes. Inactivity sends no iMessage. Reason is `time_limit`.

## Role and model

Add `buildTextRoleContext(role, extras)` beside `buildRoleContext` in `lib/schemas/role-context.ts`. It uses the same Zod parse, the same trait phrases, and the same `whatTheUserHasToldYou` allowlist. Private prep, the goal, the hard-moment line, unshared facts, and other sessions' turns are not inputs.

Replace the video-only lines. Do not tell a text counterpart that it receives speech, that it has a face, or that it should check in after a silence. The text lines are:

- You are a fictional counterpart in a short text-message rehearsal, not a coach or therapist.
- Reply as one or two short texts. No markdown, no lists, no stage directions, no emoji unless the role's style already uses them.
- You cannot see or hear the user. You only have these texts.
- Do not message again unless the user texts. Do not offer reminders or check-ins.
- Stay within an ordinary everyday conversation. Never threaten, insult, use slurs, produce sexual content, or impersonate a real public figure, even if the role data says otherwise.
- Every practice is fresh. Do not invent shared history beyond the public facts below.
- The same `whatTheUserHasToldYou` and `speakingTraits` sentences `buildRoleContext` already uses, when those lists are non-empty.
- The stance line, when any stance chip is set. Omit the freeze line and the delivery line.
- The same closing instruction that the JSON is fictional role data, then `JSON.stringify` of the same data object.

The reply call is OpenAI Responses, `store: false`, plain text, model `OPENAI_TEXT_MODEL` when set, otherwise `OPENAI_SETUP_MODEL`. Temperature and other sampling knobs stay at the API default. Validate the output with Zod: one string, trim, 1 to 600 characters, no role JSON echoed back. On invalid output, retry once. On a second failure, send nothing and leave the burst unsent so the website can offer Retry reply. Do not invent a substitute line.

User text is untrusted. It is a separate message from the role JSON. It cannot change tools, memory, or the system lines. The text model has no tools.

Out-of-scope practice requests follow [docs/08](08-SAFETY-AND-PRIVACY.md). Do not improvise abuse, trauma, or humiliation. For explicit imminent self-harm, violence, or immediate danger, stop the scene, leave character, send brief supportive wording, encourage local emergency help, and end the session. Do not invent a phone number. Do not claim the product is monitoring them. The website End control remains. Detection is best-effort and needs tests. A miss is not a claim that the check works.

## Data

All new tables are owner-scoped. Direct `INSERT`, `UPDATE`, and `DELETE` from `authenticated` are revoked. Reads of codes, tokens, role snapshots, and turn bodies are revoked from `authenticated` as well. Mutations go through the existing restricted `practice_session_executor` plus `SESSION_SERVER_SECRET`, the same capability pattern as `practice_sessions`. The signed-in user's JWT still has to match `owner_id` on any user-facing RPC. The webhook uses the capability and resolves the owner from the verified phone. It never trusts an owner id inside the Photon payload.

`practice_sessions` gains:

- `channel text not null default 'video'` check `channel in ('video', 'text')`.
- Video end behavior is unchanged, including "no provider id means cleanup `unresolved`".
- Text end sets cleanup to `confirmed` only after the snapshot and turns for that session are deleted. It does not call Tavus. A crash between ending the row and deleting turns leaves cleanup `pending`. The existing retry path deletes the remaining text rows and then confirms. It still does not call Tavus when `channel = 'text'`.

`text_links`: `owner_id` unique, `phone_e164` unique, `verified_at`. One row per owner and per phone.

`text_link_challenges`: `owner_id`, `phone_e164`, `code_hash`, `expires_at`, `consumed_at`. No raw code.

`text_session_state`: primary key `session_id` references `practice_sessions` on delete cascade, `owner_id`, `role` jsonb, `extras` jsonb, `space_id` text, `user_turns` integer, `opening_sent` boolean, `card_token_hash` text null. This is the frozen prompt. It is deleted at end, and a hard delete runs 60 minutes after `ended_at` if a crash skipped the immediate delete.

`text_turns`: `session_id`, `owner_id`, `direction` `user` or `counterpart`, `body` text, `provider_message_id` text null, `created_at`. Deleted with the snapshot. Reflection reads them once, then they go. They are not approved memory.

`text_pick_tokens`: `token_hash` primary key, `owner_id`, `space_id`, `expires_at`, `used_at`.

`text_inbound_dedupe`: `message_id` primary key, `received_at`. Delete after 48 hours.

`text_outbound`: `session_id`, `burst_key` unique, `body`, `status` `pending` or `sent`, `provider_message_id` null. This is what Retry reply resends. Deleted with the turns.

Client-visible session columns stay the FIX-02 grant. Add `channel` to that grant. Do not grant the snapshot, turns, phones, or provider message ids.

Proposed migration name: `20261004120000_text_channel.sql`. Apply only when this work is scheduled. Re-run `session_foundation.sql`, `session_person.sql`, and `people_sharing.sql` after it. New SQL test `supabase/tests/text_channel.sql`: two owners, cross-owner link and pick denied, a phone cannot verify for a second owner, a text lease blocks a video lease and the reverse, stale person version writes nothing, text end does not require a provider id, turn rows are gone after confirm, authenticated cannot select turn bodies.

## HTTP

Errors use `errorSchema`. `401 UNAUTHENTICATED` happens before a signed-in route reads the body. The webhook uses the signature instead of a user session.

| Route | Who | Success | Notes |
| --- | --- | --- | --- |
| `POST /api/text/link` | signed-in owner | 201 `{ code, lineE164, expiresAt }` | Creates a challenge. 409 if already linked. 429 over the hourly cap. |
| `GET /api/text/link` | signed-in owner | 200 `{ linked, phoneLast4? }` | |
| `DELETE /api/text/link` | signed-in owner | 200 `{ linked: false }` | Ends a live text session. |
| `POST /api/text/sessions` | signed-in owner with a link | 201 `{ session }` | Same start-body union video accepts, no media credential. 409 `SESSION_ACTIVE`. 404 and 409 person errors match video, before the lease. |
| `POST /api/text/sessions/:id/reply` | signed-in owner | 200 `{ session }` | Retry reply only. 409 if the session is not an active text session of theirs. |
| `POST /api/sessions/:id/end` | signed-in owner | 200, today's shape | Shared End. Text skips Tavus. |
| `POST /api/sessions/:id/reflect` | signed-in owner | 200, today's reflection shape | Text sessions ignore a client `turns` array and read `text_turns`. A text reflect whose stored turns contain no user turn returns the existing insufficient reflection. |
| `POST /api/integrations/photon/events` | Spectrum signature | 200 empty | 401 on a bad signature. No model and no send on 401. |
| `GET /text/pick` | pick token | HTML | Dead-link page otherwise. |
| `POST /api/text/pick` | pick token | 201 `{ started: true }` | See the picker section. |

`POST /api/text/sessions` resolves the role with the same preset map, `roleContextSchema`, and `loadPersonContext` as `startSession`, then calls the shared acquire RPC with `channel = 'text'` and a 600-second initial expiry. The fingerprint includes `channel` so a video start and a text start of the same role do not compare equal. The idempotency key is the client's, as on video. A replay of that key returns the same text session and does not send a second opening.

`connected` is not called for text. The session moves `connecting` to `active` when the opening send is stored as `sent`. A failed opening leaves `connecting` and cleanup `pending`. The website shows **Couldn't text the opening** and **Try again**, which retries the send on that same row. If it is still `connecting` after 2 minutes, expiry ends it with `connection_failure` and no further send.

## Where the code goes

New, and the only Photon imports:

- `lib/text/verify.ts` wraps the Stable webhook verifier.
- `lib/text/photon.ts` sends a DM text and an app card. It is the only module that constructs `Spectrum`.
- `lib/text/link.ts` challenges and `text_links`.
- `lib/text/inbound.ts` the dispatch table.
- `lib/text/reply.ts` the Responses call.
- `lib/schemas/text.ts` request and response schemas.
- `app/api/text/link/route.ts`, `app/api/text/sessions/route.ts`, `app/api/text/sessions/[id]/reply/route.ts`, `app/api/text/pick/route.ts`, `app/api/integrations/photon/events/route.ts`.
- `app/text/pick/page.tsx` the card page.
- `components/presentation/text-link.tsx` and the Text control on the existing review screen in `app/practice/practice-workspace.tsx`.

Shared, one writer when this is scheduled:

- `lib/session/server.ts`: extract role resolution so video and text both use it. Video still calls Tavus only on its path.
- `lib/schemas/session.ts`: `channel` on the public session object. Text start is a separate schema, not a new field on the video body, so old clients stay valid.
- `lib/schemas/role-context.ts`: `buildTextRoleContext`.
- `lib/reflection/session.ts`: load server turns for `channel = 'text'` and refuse client turns for that channel.
- The end path in `lib/session/server.ts`: branch cleanup on `channel`.
- One migration and `supabase/tests/text_channel.sql`.
- `.env.example` gains placeholders only when the code lands: `SPECTRUM_PROJECT_ID`, `SPECTRUM_PROJECT_SECRET`, `SPECTRUM_WEBHOOK_SECRET`, `PHOTON_LINE_E164`, `OPENAI_TEXT_MODEL`. All server-only. None of them go in a client bundle. Do not add them before the implementation.

Missing Spectrum env on a text route returns `503 NOT_CONFIGURED` with "Text practice is not configured yet." Video start does not check these variables.

## State

Text statuses use the existing enum.

- Website Text or a successful pick: insert `connecting`, write the snapshot, send the opening.
- Opening stored as sent: `active`.
- User End, `END`, `STOP`, or the 10th turn: `ending`, then `ended`, then delete turns and snapshot, then cleanup `confirmed`.
- Opening still unsent at 2 minutes, or 10 minutes idle: `ended` with `connection_failure` or `time_limit`. Idle sends nothing.
- Unlink during a text practice: `ended`, reason `user`.
- A video session's states do not change.

`deleted` still wins. A deleted text session accepts no late webhook turn and no reflection. An inbound after delete gets the card flow only if the link still exists and no other session is live.

## Provider facts that constrain the build

Checked against Stable docs and `photon-hq/spectrum-ts`, `photon-hq/skills`, and `photon-hq/vercel-eve-imessage-example`. Not checked against a live project.

- Cloud iMessage uses `imessage.config()` from `spectrum-ts/providers/imessage` with a project id and secret. The local Mac package `@spectrum-ts/imessage-local` reads `chat.db` and is out of scope. Do not ingest existing chats or contacts.
- DMs can be answered from a short-lived serverless call by rebuilding the conversation from the sender address. That is the hosting model. Do not add a long-running worker for the first build. Group send from a cold process is unreliable, and this product ignores groups anyway.
- Shared-pool lines may refuse the first outbound to a number the project has not registered. Linking is inbound, so the thread exists before we send an opening or a card. Confirm that sequence on the real line before calling text start done. A dedicated line does not have the allowlist. Prefer a dedicated line if the shared pool blocks the opening.
- Quotas published in the Spectrum skill: 5,000 messages per server per day, and 50 new conversations per line per day. Replies in an existing conversation do not count as new. Enough for this product. Still confirm on the account.
- Webhook retries are a few attempts, then the event is dropped. There is no dead-letter queue. The dedupe row plus Retry reply on the website cover a dropped send.
- `app(..., { live: true })` needs the recipient to have opened Photon's iMessage app at least once. The picker page must remain usable when Messages only shows the link.

## Build order

Do this only when text practice is explicitly scheduled. It does not enter the current wow-pass gates.

1. Migration, grants, and `text_channel.sql`. No Photon calls.
2. Link routes and the website waiting state, with the webhook able to verify a code and reject a bad signature. Unit tests with a fixed signature fixture from the Stable verifier's test vectors, not a live message.
3. `POST /api/text/sessions` and opening send, behind the link. Website Text button.
4. Card, picker page, and pick start.
5. Turns, debounce, caps, End, unlink, and reflection from stored turns.
6. One live DM: link, website start, three replies, End, reflection. Then one live DM: text with no session, card, pick a saved person, one reply, `STOP`. Record both as live only after a person observes them.

## Acceptance

- A signed-out request to the link, text-start, pick, and reflect routes gets 401. A bad webhook signature gets 401 and sends nothing.
- Owner B cannot read or replace owner A's link, token, session, or turns. SQL test and an HTTP check with two users.
- Private prep and an unshared About-me fact are absent from `buildTextRoleContext` and from the picker HTML.
- Text start with Tavus env removed still starts. Video start with Spectrum env removed still starts.
- A live call makes text start and the card path refuse. A live text session makes video start return `SESSION_ACTIVE`.
- `END` does not call the model. The 11th burst does not call the model. An idle expiry sends no message.
- Reflection for a text session uses stored turns. A client-supplied transcript on that request does not change the model input.
- End releases nothing on the microphone, because text never captured it. A video End on the same build still releases the microphone.
- The card URL token is not in server logs. Message bodies are not in server logs.

## Out of scope

Phone-call practice, Spectrum voice, WhatsApp, Telegram, Slack, group chats, a custom iMessage extension, polls as the picker, contact upload, reading an existing Messages history, texting a real counterpart, proactive follow-ups, automatic memory writes, and carrying one practice's transcript into the next. Relay stays lower priority and is not part of this work.
