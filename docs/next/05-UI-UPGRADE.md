# UI upgrade: look better, look like it does more

Status: **planning, not built.** Written October 3, 2026, 22:30 EDT. Research: [R07](../research/R07-UI-CRAFT.md) (why it looks vibe-coded; how AI products show their work) and [R05](../research/R05-DESIGN-DIRECTION.md) (visual direction). Tokens and screen layouts stay in [docs/33](../33-DESIGN-SYSTEM-AND-SCREENS.md); this file adds the rules, the capability surfaces, the flows and the quality gate. Slices land in [02-BUILD-PLAN](02-BUILD-PLAN.md).

## 1. What was already planned, and what this adds

| Already planned (docs/33, R05) | Added here |
|---|---|
| Tokens: warm neutrals, sage, clay, honey, night call surface, colored shadows | **UI rules** that agents must follow, with machine checks (§2) |
| Display serif for names and headlines | **Capability surfaces**: make the real intelligence visible (§3) |
| Portraits, person cards, lobby, briefing, Meet card, green room, ringing, call, recap, pocket card | **Every flow with every state**, including first run, errors and recovery (§4) |
| Morph transitions, sound, reduced motion | A **screen-by-screen before/after** against today's screenshots (§5) |
| Accessibility checklist | A **UI quality gate** on every UI PR: state gallery, screenshots at 3 widths, rule check (§6) |

## 2. UI rules (the contract agents read before any UI change)

These go at the top of docs/33 at freeze, and each "check" becomes a unit test over `components/**` and `app/**` where possible.

**Never**
1. A centered text-only hero. Every page leads with a person, the product, or the action. *(review)*
2. Equal-weight card rows for unequal things. The main action is visibly bigger. *(review)*
3. Eyebrow label + dot + two-tone headline as a page template. Use it at most once (the landing). *(review)*
4. A character shown as a form. Forms live behind "Edit details". *(review)*
5. Raw hex or `rgb()` in component CSS; only tokens. *(check: grep `#[0-9a-f]{3,8}` in `*.module.css`)*
6. Disabled by `opacity` alone. Disabled keeps 4.5:1 text contrast and shows a reason line. *(check: grep `opacity` inside `:disabled` rules)*
7. `outline: none` without a `:focus-visible` replacement. *(check)*
8. A spinner where a skeleton or real progress fits. Skeletons match final layout and appear after 200 ms. *(review)*
9. Pure black or pure white. *(check: `#000`, `#fff`, `black`, `white` in CSS)*
10. Emoji as icons, icons outside Lucide, or icons without labels in primary controls. *(check: icon imports; review for labels)*
11. Fake activity: animated "thinking" or step lists that don't map to real events (R07 §3). *(review)*
12. Scores, counts, streaks, confetti (docs/08). *(review)*

**Always**
1. One radius personality: 10 controls, 16 cards, 28 portraits and the call tile, pill for chips. One shadow language (sage-tinted). One accent per moment.
2. Six states per interactive element: default, hover, focus-visible, active (0.5 px press), disabled-with-reason, loading.
3. Designed empty, loading, error and success states for every view, with a next action.
4. Names of people in the serif; UI text in the sans.
5. A person's face wherever that person appears (portrait source per W6).
6. Motion with purpose and the token curves; reduced-motion fallback.
7. Copy in plain sentences; the button says what happens ("Call Jordan", not "Continue").

## 3. Capability surfaces: show the work that's really happening

Today most of the product's intelligence is invisible: the generated character, the privacy boundary, what a person knows, the natural ending. Each surface below makes one real capability visible. None invents activity.

### U1. Watch Jordan come together (streamed setup)

**Now:** press Generate, wait on a disabled button, a form appears.
**Target:** the Meet card appears at once with the portrait and name. Below it, fields arrive as the model writes them: "How they talk" types in, then the three stance rows fill with their chips, then the opening line lands in the speech bubble. A small status line names the real step: "Reading your situation" (request sent), "Shaping Jordan" (first field arrived), "Ready" (validated). If validation or the private-note probe fails, the partial card is replaced by the designed error state. Nothing partial is ever used as the role.

**Contract (proposal for C1, coordinator).** `POST /api/scenarios/draft` with `Accept: text/event-stream` streams the OpenAI Responses `output_text.delta` text through a server-side partial-JSON reader that emits `{ field, value }` events for completed top-level fields. The final `done` event carries the validated `draftResponseSchema` object after the same checks as today (Zod, FIX-01 probe). A JSON request without that header behaves exactly as today. The rate limit and errors are unchanged. Private notes are never echoed in any event. **Spec ID:** W11, slice 1C (server) and 1D (UI).

### U2. What Jordan knows, and what Jordan never sees

A panel on the Meet card and the person page, two columns:
- **Knows:** the chips Jordan was given (situation summary, shared About-me facts as chips, stance chips).
- **Never sees:** lock chips for "Your line", "When it gets hard", "Your notes", "What you're worried about", each present only if the user wrote one.

This turns the privacy rule into a visible feature. It reads from the same client state the start body is built from, and a unit test asserts the "Knows" list equals what `buildRoleContext` receives for that start (by field name). Show me first adds: "The stand-in gets: your line." Slice 1D.

### U3. The call HUD

Already specified (S3): speaking glow from real speaking events, streaming captions, timer arc that turns honey for the wrap-up, goal pill, the ear icon for tone perception (static, never a readout), "Fictional AI" pill. Added here: a **connection quality dot** from Daily network stats (verify the API in the installed types), shown only when poor ("Connection is weak"). Slice 1A.

### U4. Keyboard and shortcuts

In the call: `M` mute, `C` captions, `T` type, `W` ask to wait, `Esc` opens the End confirm. `?` opens a small sheet listing them. In the lobby: arrows move between cards, `Enter` opens, `N` is Someone new. Shortcuts never fire while typing in a field. Signals depth to power users; required by the a11y checklist anyway. Slice 1A, 1B.

### U5. Person dossier

The person page leads with the portrait (240), name in serif 40, relationship, trait chips, then: "Last practiced Thursday", "Talked for real" (if B2 = yes), the next date if set, saved situations as tappable cards, Look and voice, the U2 knowledge panel with the existing drag-and-keyboard sharing board, and brave things. No counts. Slice 3D.

### U6. Your data as a map

Replace the list with a diagram of where things live, using real statuses from the existing data route: **This app** (people, About me, situations, dates; delete buttons), **Tavus** (per session: "Deleted at provider" or "Pending"), **ElevenLabs** ("Not tracked by this app"), **OpenAI** ("Sent once, `store:false`"). It makes the honest privacy engineering look engineered. Slice 3D.

### U7. The landing shows the product

Already specified (R6): a captioned, muted, labeled recorded clip of the hero path. Added: below it, a **live, non-network Meet card** rendered from the Jordan fixture with working stance chips (tapping alternatives changes them locally), so visitors touch the real UI before signing in. No call, no request. Slice 4E, moved earlier to Phase 2 as 2D because judges see it first.

### U8. The recap as a keepsake

W7 staging, the quoted line in serif, the W4 arc, the pocket card. Already specified. Slice 2A.

## 4. Flows, with every state

Each flow lists its screens in order and the states each must design. "Live not verified" applies to any flow that includes a call.

**F1. First run.** Sign in → lobby with starters and Someone new, one guidance line, Jordan's card gently highlighted as "Start here" → hero flow. States: first visit (no people), loading (card skeletons), lobby error (inline retry). About me is offered later, after the first recap ("Want Jordan to know something about you next time?"), never before.

**F2. Practice with a saved person (hero).** Lobby → briefing → Meet card (U1, U2) → green room → Show me first (first time) or call → Your turn → call → recap → pocket card. States per screen: briefing (empty, typed, saved-situation chosen), Meet (streaming, ready, validation error, out of scope), green room (permission primer, denied, no mic, ready), ringing (connecting, busy, failed), call (live, muted, wrapping up, waiting, poor connection, provider left), recap (reflection loading, skipped, ready, support exit).

**F3. Someone new.** Lobby → briefing with name (optional) and relationship chips → Set up the scene → Meet card streaming → … → recap offers "Save {name}". States: name generated vs typed; save success; save conflict.

**F4. Returning user.** Lobby ordered by "coming up" then recent; check-in banner if a date passed; saved situations as quick picks in the briefing. States: banner answered (Yes / Not yet / Decided not to), dismissed.

**F5. Edit what someone knows.** Person page → U2 panel → drag or keyboard-move About-me facts between "Not shared" and "Knows" → version conflict state (someone else edited: reload). Existing behavior, restyled.

**F6. After the real conversation.** Check-in → optional note → Add to brave things → the person card shows "Talked for real". Only if the user set a date (D8 answer).

**F7. Recovery.** Designed screens, each with a human sentence and one action: microphone blocked (how to re-enable, try again); provider busy (try again in a minute; the session is cleaned up); generation out of scope (offer an ordinary scenario); generation unavailable (retry; your text is kept); call dropped (your practice isn't lost; recap with what was captured, or start over); signed out mid-call (media released, sign in again). Each maps to an existing error code.

**F8. Your data.** U6 map → delete one item → delete all with a typed confirm → result showing anything still pending at a provider.

## 5. Screen by screen, from today's screenshots

| Today | Problem (R07 §1) | Target | Slice |
|---|---|---|---|
| Home (01): centered headline, three equal cards, numbered list | Generic template; no person; plumbing equals main action | Lobby: portrait card grid, "Start here" on Jordan, avatar menu holds About me and Your data | 1B |
| Describe (02): blank 1,000-char box, grey Generate | Blank page; broken-looking button | Briefing beside the person's portrait, situation chips and skill chips, private card with a lock, primary button always primary with a reason line | 1B |
| Review (03): the character as a form with counters | A spec, not a person | Meet card: portrait, serif name, stance chips, speech bubble with Hear, U1 streaming, U2 panel; form behind Edit details | 1D |
| Call (04): flat olive box, light chrome, controls below the fold | Not a call | Night surface, full-bleed face, floating glass bar, HUD (U3), ringing before | 1A |
| Person (05): two cards, dense chip form, grey Save | A person page with no person | Dossier (U5) with portrait header and knowledge panel | 3D |
| Your data | A list | Map (U6) | 3D |
| Landing | Text and a button | Clip plus a live Meet card (U7) | 2D |

## 6. Process: the UI quality gate

Every PR that changes UI passes this before review. The coordinator owns the scripts.

1. **State gallery.** `/design-preview` (development only, exists today) becomes the living gallery: every component and screen in every state from §4, rendered from fixtures. A PR adds its states there first.
2. **Screenshots.** `scripts/ui/screenshots.mjs` (new, coordinator) uses the installed Playwright to capture each gallery state at 390, 900 and 1440 px, in light and night surfaces, with reduced motion on and off, into `artifacts/ui/<branch>/` (ignored by Git). The PR lists the states it changed.
3. **Rule check.** The §2 checks run in `npm test` (`tests/unit/ui-rules.test.ts`).
4. **Review.** A reviewer, human or agent, goes through the screenshots against §2 and the Web Interface Guidelines skill (`.agents/skills/web-design-guidelines`), and records findings in the task file. Contrast is measured for every new color pairing.
5. **Mock is not live.** Screenshots of the call use the existing synthetic media seam, labeled. Live audiovisual quality is still a human check.

## 7. Where this lands in the build plan

| Item | Slice |
|---|---|
| §2 rules, `ui-rules.test.ts`, gallery expansion, screenshot script | **0E (new, Phase 0)**, coordinator plus one worker, before any Phase 1 UI merges |
| U1 streaming setup (W11) | 1C server, 1D UI |
| U2 knowledge panel | 1D |
| U3 HUD, U4 shortcuts | 1A, 1B |
| U5 dossier, U6 data map | 3D |
| U7 landing | 2D (moved up from 4E) |
| F7 recovery screens | each owning slice; listed in its acceptance |

## 8. Owner decisions (October 3, 22:35 EDT)

- **Icons: Lucide** (`lucide-react`, MIT). One icon set everywhere, at the same stroke width (1.75) and sizes (16, 20, 24). Icons in primary controls always have a text label. Import individual icons only, so the bundle stays small. Rule §2 #10 becomes "no icons outside Lucide, no emoji as icons" and gets a check (grep for other icon imports and inline `<svg>` in components, except the logo and illustrations).
- **Animation: Motion** (`motion`, the Framer Motion package). Used for springs (card lift, chip press, self-view drag with keyboard fallback), staggered lobby reveal, and layout animation inside a screen. React `<ViewTransition>` stays the tool for screen-to-screen morphs (docs/33 §6). Every Motion animation reads `useReducedMotion()` and falls back to a ≤150 ms fade or nothing. Spring presets live in one file (`lib/ui/motion.ts`) next to the CSS motion tokens, so the two stay coherent.
- **Who adds them:** the coordinator, in slice 0A's contract commit, pinned exact versions in the lockfile, current stable as of that day, with the versions recorded in the task file. Workers do not add dependencies. No upgrades during demo preparation (AGENTS.md).
