# R05: Design direction

Status: research report (planning input, not a spec). Written October 3, 2026. Screenshots in `artifacts/research-ui/` (01–05) were captured from the local app the same day; the call screenshot is the design preview with a synthetic placeholder, not a live call. The screen spec built from this report is [docs/33](../33-DESIGN-SYSTEM-AND-SCREENS.md).

Owner direction: the UI is "very lackluster"; quality matters more than cost or time.

## 1. Critique of the current UI

What works (keep): warm ivory background, restrained sage accent, generous whitespace, a calm tone, honest labels ("Fictional AI counterpart", "Private preparation notes — never shared"), and a clear 4-step explanation on home.

What is missing:

| Screen | Observation | Effect |
|---|---|---|
| All | One type family (Avenir Next) at similar weights; no display face; sage headline second line is the only flourish | Reads like a settings page, not a product with a voice |
| All | No imagery, illustration, portraits, motion, or sound anywhere | Nothing signals "you're about to talk to someone" |
| Home (01) | Three equal cards (Practice / About me / Your data) give account plumbing the same weight as the core action | The main job competes with housekeeping |
| Home (01) | Numbered "Once you start" list is the only onboarding | Explains rather than shows |
| Describe (02) | A blank 1,000-character textarea with three text-link examples | Blank-page anxiety at the most important moment |
| Describe (02) | Private notes in a grey sub-panel; Generate is a pale disabled slab | The primary action looks unavailable even when it's the next step |
| Review (03) | The character is a form: Name, Role, How they talk, Knows, Opening line, constraints with Remove buttons | Users must read a spec to meet a person. The character is never *shown* |
| Call (04) | A flat olive rectangle with small black pills, camera tile cropped at bottom-right, controls below the fold edge, intention text in small grey | Not a call. No sense of presence, focus, or occasion |
| Call (04) | Light page chrome around the video | Bright surround competes with the face; video apps use dark surrounds |
| Person (05) | Two cards side by side, chip editor dense, Save disabled-grey, no portrait | A person page with no person on it |

The core problem: **the interface describes a conversation instead of staging one.** Every high-quality reference below stages it: there's a moment before (ringing, a green room), a moment of presence (full-bleed face, dark surround), and a moment after (a recap you'd keep).

## 2. References and what to borrow

**FaceTime / phone call grammar.** Full-bleed remote video, self-view as a small draggable rounded tile, controls in a floating translucent bar that fades when idle, red end button on the right, caller name and timer at the top. Ringing screen with large portrait and name before connect. Borrow the whole grammar; users already know it.

**Google Meet green room.** Self-check before joining: "If the mic bar moves, your mic works", speaker test, camera preview [D1]. The permission redesign asks the user's intent first ("Allow microphone and camera" only after they choose to be heard), reassures they can turn devices off later, and raised first-join allow rates by 14% [D2]. Borrow: intent-first permission primer, live mic bar.

**Duolingo Video Call (Lily).** The phone rings, she picks up and greets you; during processing delays she tilts her head "so if there's any processing delay, it looks like she's pondering"; 8 head × 8 body idle animations combine into 64+ variations so idle never loops; eyes too wide felt "weird" and were dialed back [D3]. Ringing masks the model's first-question latency [D4]. Borrow: ringing as latency cover, a "thinking" state, idle variety, restraint.

**Sesame voice presence.** Four components: emotional intelligence, conversational dynamics (timing, pauses, interruptions), contextual awareness, consistent personality [D5]. Use these four as the review rubric for the counterpart's feel (and as the A/B checklist in R04 §1).

**Headspace / calm-product craft.** The rebrand moved away from the mental-health "dreary sea of blues and greys" toward warm, bright color and kept "breath-driven animations" [D6]. A secondary design analysis reports no pure black or white, warm neutrals, colored shadows, and 400–600 ms transitions where most apps use 250–300 ms [D7]. A reconstructed token set from the live site shows 150/300/400 ms durations [D8]. Borrow: warm neutrals, colored shadow, slightly slower motion on transitions *into* calm moments (green room, recap), normal speed elsewhere.

**Uncanny valley evidence.** In 113 participants, lip-sync asynchrony increased uncanniness, and audio-leading-video was worse than video-leading-audio [D9]. Cartoon-like agents trended less eerie than human-like ones [D10]; stylized avatars helped people read mood, while photorealistic ones were praised for lip sync but called uncanny and low-emotion [D11]. Design consequences: (1) never play counterpart audio before its video is rendering; (2) frame the face generously, without a harsh crop or tiny tile; (3) for the "Say it" rung and loading states, use a stylized portrait, not a frozen photo of the real face.

## 3. Proposed direction: "a warm room, then a call"

Two modes, one brand:

- **Room mode** (home, describe, review, recap, people): the current warm ivory, upgraded with a display serif, portraits, soft depth, and motion. Feels like a calm studio or notebook.
- **Call mode** (green room handoff, ringing, call): deep warm charcoal surround (not pure black), full-bleed face, floating controls. Feels like FaceTime at night.

The transition between them is the signature moment: the character card from review **morphs** into the call tile (React `<ViewTransition>`, no dependency; see R04 §5), the page darkens, and the ring begins.

### 3.1 Tokens (proposal; see docs/33)

Color (warm neutrals; no `#000`/`#fff`):

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F7F5F0` (current) | Room background |
| `--card` | `#FFFDF8` | Raised surfaces |
| `--ink` | `#1F2421` | Text (not pure black) |
| `--ink-muted` | `#5E655F` | Secondary text (≥ 4.5:1 on paper; verify) |
| `--sage-700` | `#345A49` (current) | Primary action, focus |
| `--sage-100` | `#E4ECE6` | Selected chips, quiet fills |
| `--clay` | `#C46A4A` | Warm accent: the "goal reached" light, highlights |
| `--honey` | `#E8B65A` | Gentle attention: wrap-up cue |
| `--night` | `#151816` | Call surround |
| `--night-raised` | `#22272380` | Translucent call controls (with backdrop blur) |
| `--end` | `#C2453A` | End call |
| shadow | `0 12px 32px -12px rgb(52 90 73 / 0.25)` | Sage-tinted shadow, not grey |

Type: keep Avenir Next (or system sans) for UI; add a **display serif** for headlines, character names, and pocket cards (candidates: Fraunces, Newsreader, or Source Serif 4 via `next/font`; one variable font). Scale: 14 / 16 / 20 / 28 / 40 / 56. Character names always in the serif, so "a person" reads differently from "a field".

Radius: 12 (inputs), 20 (cards), 28 (call tile), full (pills). Spacing on a 4-pt grid.

Motion:

| Token | Duration | Curve | Use |
|---|---|---|---|
| `--t-quick` | 150 ms | ease-out | Hover, press, toggles |
| `--t-base` | 280 ms | `cubic-bezier(0.2, 0, 0, 1)` | Panels, chips, drawers |
| `--t-calm` | 520 ms | `cubic-bezier(0.32, 0.72, 0, 1)` | Into green room, into recap, mode change |
| `--t-breath` | 4–6 s loop | sine | Settle breath, ringing pulse |

All motion has a `prefers-reduced-motion` fallback (opacity-only or none). Nothing moves on its own during the call except the speaking glow.

Sound (optional, off when system is muted; user setting): a soft two-tone ring, a connect chime, a gentle hang-up tone. Max ~1.5 s each. No sound on errors.

### 3.2 Character presence without a live call

Portrait everywhere a person appears: the review card, the person page, the people list, the ringing screen, the recap. Source options, in quality order:

1. **The Tavus face's own still** (a frame or thumbnail of the selected stock face). Consistent with the call, so the person you meet is the person who answers. Verify the faces API exposes a thumbnail/preview URL.
2. A stylized illustrated avatar generated from the chosen preset (consistent palette; reduces uncanny effect in non-call states).
3. Monogram on a warm gradient, as a fallback only.

### 3.3 Screen-by-screen direction (summary; full spec in docs/33)

**Landing / signed-out.** Hero: a looping, muted, captioned 8–12 s clip of a real practice call (counterpart speaking, captions, goal light turning on), labeled as a recorded demo. One line: "Practice the conversation before you have it." Below: the arc in three illustrated steps (Before → Call → After), the privacy promise as a visible design element ("Your notes never reach the character"), and one CTA.

**Home (signed-in).** One big primary: "What's on your mind?" with an inline describe field (start typing right here). Below: "Upcoming" (real conversations the user dated), "Your people" as portrait cards, and "Skills" shelf. About me and Your data move to the header/avatar menu.

**Describe.** Big serif prompt, a roomy field with rotating placeholder examples, example chips grouped by skill, optional "What do you want to happen?" as a single line, and private notes as a visibly *locked* notebook card (lock icon, "Only you see this"). Primary button always looks primary; disabled state explains what's missing.

**Review → "Meet Alex."** Lead with a **character card**: portrait, name in serif, relationship, a one-line "how they talk", reaction style as a named chip ("Gets a bit defensive"), and the opening line in a speech bubble. "Edit details" expands the existing form below. Challenge/pace become named personality chips. Length picker as two pills. CTA: "Call Alex".

**Green room.** Dark mode begins. Self-view (only if camera opted in) or a mic orb that reacts to the voice; mic bar; device picker; goal card ("Your goal: ask for a dish schedule") with "only you see this"; optional prediction card; optional 60 s settle breath with a breathing circle. CTA: "I'm ready".

**Ringing.** Large portrait, name, "Calling…" with a slow pulse ring; 2–6 s while Tavus boots. Cancel available. Transitions to live only when video is rendering (never audio first).

**Call.** Full-bleed face on `--night`. Top: name (serif), "Fictional AI" pill, timer as a thin progress arc rather than digits only. Self-view tile top-right, draggable, "Only you can see this" on hover. Bottom floating bar: Mute, Camera (local), Captions, Hint (opt-in), Ask to wait, End (red). Goal pill bottom-left: grey outline, then glows `--clay` with a soft check when reached. Speaking glow: thin animated ring around the face when the counterpart speaks; around self-view/mic orb when the user speaks. Captions: two lines max, large, high contrast, bottom-center. Wrap-up: the timer arc turns `--honey` and a small "Wrapping up" chip appears. Controls fade after 3 s idle and return on pointer or keyboard focus (never hidden for screen readers).

**After the call (recap).** Back to room mode with a calm transition. A breathe-out line ("That was a real try."). Cards: "You said" (your line that carried the goal, quoted), "Next time" (one behavior), "What you expected vs. what happened" (if a prediction was made), "Go again with one change" chips, "Make a pocket card", "Save Alex". Pocket card: a portrait-format card in serif with the opening line, an if-then plan and the date, exportable as an image.

**People.** Grid of portrait cards with name, relationship, last practiced, and an "Upcoming" badge if a real date is set. Person page: big portrait header, "Practice with Maya", "What Maya knows about you" as the drag/keyboard sharing board (existing), personality chips, history of brave things (user-entered).

### 3.4 Delight moments (each small, each optional)

1. Character card morphs into the call (ViewTransition).
2. Ringing with the character's portrait and a breathing pulse.
3. Goal light: a soft glow and check when you've said the thing.
4. "Wrapping up" honey cue, then the counterpart closes naturally.
5. Recap opens with your own best line quoted back in serif.
6. Pocket card export with a gentle paper texture.
7. "Brave things" list entry when you log that the real conversation happened.

No confetti, streak flames, badges, or scores (docs/08).

### 3.5 Accessibility

- WCAG 2.2 AA contrast for all text, including captions on video (use a scrim).
- Every drag action has a keyboard path (existing for sharing; keep for the self-view tile).
- Live call status announced via `aria-live="polite"` (connected, goal reached, wrapping up, ended), never more often than once per state change.
- Captions on by default if the user chose them in the green room; caption size setting.
- Reduced motion: no morphs, no pulses; instant state changes with fades ≤ 150 ms.
- Focus visible on dark surfaces (sage-100 ring on night).
- Hit targets ≥ 44 px on the call bar.

### 3.6 Implementation notes

- No new dependencies are required for the core direction: CSS custom properties, `next/font` for the serif, React `<ViewTransition>`, Web Audio for the meter, Daily audio-level observers for speaking glow.
- Optional dependency decisions: Motion (spring physics for the self-view drag and chip interactions), Rive (stylized character idle animation for the voice-only rung and loading states).
- Video-first rule: keep the counterpart's audio element muted until the first video frame renders (`loadeddata`/`playing` on the video element), then unmute. Prevents the most uncanny failure [D9].

## Sources

- [D1] Google Meet Help, "Connect your video & audio." https://support.google.com/meet/answer/10409699?hl=en
- [D2] web.dev, "How Google Meet improved audio and video permissions" (2024). https://web.dev/case-studies/google-meet-permissions-best-practices
- [D3] Rive blog, "Duolingo's AI-powered Video Call brings Lily to life with Rive" (March 20, 2025). https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life
- [D4] Duolingo blog, "How Duolingo uses AI to create the perfect speaking practice." https://blog.duolingo.com/ai-and-video-call/
- [D5] Sesame, "Crossing the uncanny valley of conversational voice." https://www.sesame.com/journal/crossing-the-uncanny-valley-of-voice (also at https://www.sesame.com/blog/crossing-the-uncanny-valley-of-voice)
- [D6] It's Nice That, Headspace rebrand with Italic Studio. https://www.itsnicethat.com/articles/italic-studio-headspace-graphic-design-project-250424
- [D7] Blake Crosley, "Headspace: Designing for Calm" (secondary analysis, not Headspace documentation). https://blakecrosley.com/guides/design/headspace
- [D8] Layout Kit Gallery, Headspace (reconstructed tokens). https://layout.design/gallery/headspace
- [D9] Tinwell, Grimshaw & Abdel Nabi (2015), "The effect of onset asynchrony in audio-visual speech and the Uncanny Valley in virtual characters," Int. J. Mechanisms and Robotic Systems 2(2). https://vbn.aau.dk/ws/files/209823441/The_effect_of_onset_asynchrony_final.pdf
- [D10] "Do Not Freak Me Out! The Impact of Lip Movement and Appearance on Knowledge Gain and Confidence," Macquarie University. https://research-management.mq.edu.au/ws/portalfiles/portal/349349689/339451944.pdf
- [D11] FAME, CHI 2026. https://dl.acm.org/doi/10.1145/3772318.3790402
