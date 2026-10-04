# Design system and screens (post-submission plan)

Status: **planning, not built.** Derived from [R05](research/R05-DESIGN-DIRECTION.md). Feature behavior is in [docs/32](32-FEATURE-SPECS.md); this file covers how it looks, moves and sounds. Existing visual direction ("warm and minimal, crisp, modern typography") from docs/00 and docs/18 still holds; this extends it with presence, depth and a dark call mode. Contrast values marked "verify" must be measured before merge.

## 1. Concept

**A warm room, then a call.** Room mode for preparing and reflecting (ivory, serif names, portraits, soft depth). Call mode for the conversation (deep warm charcoal, full-bleed face, floating glass controls). The handoff between them (card → ringing → call, and call → recap) is the product's signature moment.

## 2. Tokens

Extend `app/globals.css` `:root`; keep the existing names so current components keep working.

### Color

| Token | Value | Status | Use |
|---|---|---|---|
| `--background` | `#F7F5F0` | existing | Room background |
| `--surface` | `#FFFEFB` | existing | Cards |
| `--surface-sunk` | `#EFEDE6` | new | Wells, locked private cards |
| `--ink` | `#232A28` | existing | Text |
| `--muted` | `#626963` | existing | Secondary text (verify ≥ 4.5:1 on background) |
| `--border` | `#DDDDD5` | existing | Hairlines |
| `--sage` | `#345A49` | existing | Primary action |
| `--sage-soft` | `#E6EDE6` | new | Selected chips, quiet fills |
| `--clay` | `#C46A4A` | new | Warm accent, portraits' backdrop, "you said it" moments |
| `--honey` | `#E2AE4F` | new | Wrapping-up cue |
| `--danger` | `#B8433A` | new | End call, destructive (verify white text contrast) |
| `--focus` | `#245B91` | existing | Focus ring in room mode |
| `--night` | `#141715` | new | Call surround |
| `--night-raised` | `rgb(38 44 40 / 0.72)` | new | Glass controls (with `backdrop-filter: blur(16px)`) |
| `--night-ink` | `#F3F1EA` | new | Text on night |
| `--night-muted` | `#A9B0A8` | new | Secondary on night (verify) |
| `--focus-night` | `#9FC7B1` | new | Focus ring on night |

Shadows are sage-tinted, never grey: `--shadow-1: 0 1px 2px rgb(52 90 73 / .08)`, `--shadow-2: 0 12px 32px -12px rgb(52 90 73 / .22)`, `--shadow-3: 0 24px 60px -20px rgb(20 23 21 / .45)` (call tile).

### Type

- **UI sans:** existing stack (`"Avenir Next","Segoe UI",system-ui`).
- **Display serif (new):** one variable serif via `next/font` (candidates: Fraunces, Newsreader, Source Serif 4; choose by rendering the three at 56 px and 20 px with real names). Used for page headlines, character names, pocket cards, the recap's quoted line. Never for form labels or controls.
- Scale (px): 12, 14, 16, 18, 22, 28, 40, 56; line height 1.5 body, 1.1 display. Letter-spacing on display −0.02em (replaces current −3.4 px fixed values).

### Space, radius, size

4-pt grid. Radius: `--r-sm 10px` (inputs, buttons; existing 10), `--r-md 16px` (cards; existing 16), `--r-lg 28px` (call tile, portrait), `--r-pill 999px`. Minimum hit target 44 px; call bar buttons 56 px.

### Motion

| Token | Value | Use |
|---|---|---|
| `--t-quick` | `150ms cubic-bezier(.2,0,0,1)` | Hover, press, chip toggle |
| `--t-base` | `280ms cubic-bezier(.2,0,0,1)` | Panels, drawers, expand details |
| `--t-calm` | `520ms cubic-bezier(.32,.72,0,1)` | Room ↔ call, entering green room and recap |
| `--t-breath` | `5s ease-in-out infinite` | Settle circle, ringing pulse |

`prefers-reduced-motion: reduce`: no morphs, pulses or slides; fades ≤150 ms; breathing circle becomes a static ring with a text count.

### Sound

Ring (soft two-tone loop), connect (single warm chime), hang-up (descending two-note). ≤1.5 s except ring. User toggle "Sounds" (default on). Never on errors.

## 3. Components

| Component | Notes |
|---|---|
| **Portrait** | Rounded-28 image of the face still; fallback monogram on a clay→sage gradient. Sizes 40 / 64 / 120 / 240. Alt text "{name}, fictional AI character". |
| **Person card** | Lobby tile, 4:5: portrait, serif name, relationship, ≤3 trait chips, meta line, "Practice with {name}". Whole card is one button with an accessible name "Practice with {name}, {relationship}"; the "⋯" menu is a separate button. Variants: saved, Starter (badge), Someone new (+). |
| **Character card** | Portrait 120, name (serif 28), relationship (muted 14), "how they talk" line, `Wants …`, reaction chip, opening line in a speech bubble (surface-sunk, tail left). |
| **Private card** | `--surface-sunk`, lock icon, title "Only you see this", holds goal and hard-moment line. Dashed border to read as "set aside". |
| **Chip** | Pill, 36 px tall, sage-soft when selected with a check; keyboard toggles with Space. |
| **Primary button** | Sage fill, 48 px; disabled shows a reason line beneath instead of fading to grey. |
| **Mic meter** | 12 rounded bars responding to local level; label "If the bar moves, they'll hear you." |
| **Call bar** | Floating glass pill, bottom center, 56 px icon buttons with text labels under (Mute, Camera, Captions, Type, Wait, End). End is `--danger`, rightmost, slightly larger. |
| **Timer arc** | Thin ring around the small portrait in the top bar; sage → honey in the last 30 s; text time for screen readers. |
| **Speaking glow** | 2 px ring outside the face tile, `--sage-soft` at 60% opacity, animates in 150 ms, fades out 400 ms after stop. User's glow on self-view or mic orb. |
| **Captions** | Max two lines, 18–22 px, `--night-ink` on a 60% night scrim, bottom center above the call bar; speaker name in muted small caps. |
| **Status chip** | Small glass pill top-right: "Connecting", "Wrapping up" (honey dot), "Muted". |
| **Pocket card** | 3:4, ivory with subtle paper grain, serif, the person's portrait small top-left, lines: Open with / If … I'll … / On {date}. |

## 4. Screens

Each screen lists layout, states and the copy that matters. Wireframes are indicative.

### 4.1 Landing (signed out)

```
[wordmark]                                   [Sign in]
Practice the conversation          [ demo clip: face speaking,
before you have it.                  captions, goal pill lights ]
[Start practicing]                 "Recorded demo · fictional AI"
-------------------------------------------------------------
 Before            Call                After
 Meet them,        It rings. They      Your line, quoted.
 set your line.    answer. You talk.   One thing to try.
-------------------------------------------------------------
 Your notes never reach the character. Calls aren't saved
 unless you choose. Not therapy.
```

States: reduced motion shows a still frame. No autoplay sound.

### 4.2 Lobby (signed-in home, simulator select; owner direction 21:41)

The signed-in home *is* the lobby. About me and Your data move to the avatar menu.

```
Who do you want to practice with?              [avatar ▾: About me, Your data, Sign out]
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ [portrait    │ │ [portrait    │ │ [portrait    │ │      +       │
│   tall 4:5]  │ │   tall 4:5]  │ │   tall 4:5]  │ │              │
│ Maya         │ │ Prof. Ellis  │ │ Dad          │ │ Someone new  │
│ Roommate     │ │ Professor    │ │ Parent       │ │              │
│ warm · brief │ │ formal       │ │ blunt        │ │              │
│ Coming up Thu│ │              │ │ Knows 3      │ │              │
│[Practice with│ │[Practice with│ │[Practice with│ │ [Start]      │
│  Maya]       │ │  Ellis]      │ │  Dad]        │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
Starter characters
 [Alex · Roommate · Starter] [Ellis · Professor · Starter] [Sam · Favor · Starter]
```

- **Card:** 4:5, radius 28, portrait fills the top ~65% over a soft clay→sage gradient; the name is serif 22 over a bottom scrim. Hover/focus lifts 4 px with `--shadow-2` and the portrait scales 1.03 (quick). If a looping face preview is available from Tavus (verify), it plays muted only on hover/focus and never autoplays in a grid. Reduced motion means no lift or scale, only a border change.
- **Grid:** 4 columns ≥1200 px, 3 ≥900, 2 ≥600, 1 below (horizontal snap carousel on phones is an alternative to test).
- **Check-in banner** above the grid when due ("Did you talk with Maya?").
- **States:** no saved people (starters + Someone new, one line of guidance); loading (card skeletons with breathing shimmer, reduced-motion static); error (retry inline).

### 4.3 Briefing (enter the situation)

The clicked card morphs into the left column (`--t-calm`); the rest of the grid fades.

```
[← All people]
┌──────────────┐   What's going on with Maya?
│ [portrait    │   [ She keeps leaving dishes in the sink and I want   ]
│   240]       │   [ us to agree on a schedule…                         ]
│ Maya         │   Same as last time: Dishes · Ask · Say no · Set a boundary
│ Roommate     │   ┌ Only you see this ────────────────────────────┐
│ warm · brief │   │ What do you want to do? [                     ] │
│ Knows 2 →    │   │ When it gets hard, I'll say [                 ] │
└──────────────┘   └───────────────────────────────────────────────┘
                                              [Set up the scene →]
```

"Someone new" uses the same layout, with a monogram, an optional name field and relationship chips in the left column. Clarifying chips (R2), if returned, appear inline after "Set up the scene" as "A couple of quick questions (optional)".

### 4.4 Meet card (review)

Under the character card, three stance rows (Q2): "Wants", "Holds back because", "Softens when". Each row shows its inferred chip selected and 2–3 alternative chips; tap to override, "Edit" for a custom chip (≤40). Below them is the tone notice (T1) with an ear icon: "{name} can hear your tone of voice and may react to it. Nothing about your tone is saved." Two columns on desktop: left Character card (sticky), right "Before you call" (Private card with goal and hard-moment line, optional "They may sound disappointed", length pills, mode choice if R3, "Surprise me" if R4). "Edit details" opens the full form under the character card. CTA "Call {name}" bottom right.

### 4.5 Green room (call mode begins)

Background transitions to night over `--t-calm`.

```
                 [portrait 240, gently breathing scale]
                         Maya
   ▮▮▮▮▮▯▯▯▯▯▯▯  If the bar moves, they'll hear you.   [Mic ▾]
   ( ) Show my camera to me only
   ┌ Only you see this ─────────────────────────────┐
   │ Your line: "Can we split dishes by night?"      │
   │ If she sounds disappointed: "I get it. I still…"│
   └────────────────────────────────────────────────┘
   What are you worried she'll say? [            ]  How likely? ───●── 60
   [Settle for 60 seconds]                         [I'm ready]
```

Also in the green room: the toggle "Light up my goal when I say it" (G1, off by default, with its processing note), the tone notice (T1), and the reflection disclosure line (D2): "After the call, what was said is sent once to make your reflection. It isn't stored."

States: permission primer (before any browser prompt); permission denied (instructions to re-enable, no dead end); no mic found.

### 4.6 Ringing

Night; portrait 240 centered with a slow expanding ring (`--t-breath`), "Calling Maya…", Cancel (glass pill). Ring sound if enabled. Transition to call once remote video is playing.

### 4.7 Call

```
 [● Maya  ◔ 2:14]  Fictional AI                         [self-view, if on]

                     ( full-bleed face on night )

                 "I mean, I've been really busy this week."
            [Mute] [Camera] [Captions] [Type] [Wait]   [ End ]
 [Your line ○]
```

- Goal pill bottom-left shows the line, outline only; if the user turned on the goal light (G1), it lights clay with a check the first time they say it.
- "Wait" shows "Maya is waiting. The timer is still running." in the status chip.
- Type opens a glass input above the bar.
- Controls fade after 3 s idle; any pointer move, key press or focus restores them.
- Mobile portrait: face fills; top bar compact; call bar wraps to two rows only if needed; self-view 96 px.

### 4.8 Recap

Back to room mode. Top: small portrait and "That was a real try." in serif. Cards in fixed order (predictable for neurodivergent users): Did you say it? (docs/30) → reflection, starting automatically with a Skip link (D2): What you did (quoted line in serif) → Next time, with the "Another way to say it" button (A1) → What you expected → collapsed "How Maya was played" dropdown (chips only, "Fiction, set before the call") → Actions (Pocket card, Save Maya, Done). "This call isn't saved. Save only what you choose." in muted text.

### 4.9 People and person page

People grid: portrait cards (name serif, relationship, "Coming up Thu" badge). Person page header: portrait 120, name serif 40, "Practice with Maya", "When will you talk for real?" date. Below: Look and voice (B4), personality chips, What Maya knows about you (existing sharing board, restyled), Brave things list.

## 5. Accessibility checklist

- WCAG 2.2 AA contrast for all text on both surfaces, including captions over video (scrim).
- Keyboard: every action reachable; drag (self-view, sharing) has keyboard alternatives; visible focus on night (`--focus-night`).
- Screen readers: call state changes announced once via `aria-live="polite"` (connecting, live, wrapping up, ended); faded controls stay in the accessibility tree.
- Captions available on every call; size setting (M / L / XL).
- Reduced motion honored everywhere; no flashing.
- Touch targets ≥ 44 px; call bar 56 px.
- Text alternatives for portraits; the demo clip has captions.

## 6. Implementation notes

- No new dependency is required: CSS variables, `next/font`, React `<ViewTransition>` (installed Next.js docs: `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`), Web Audio, Daily audio-level observers, Tavus speaking events.
- Dependency decisions (owner, October 3, 22:35 EDT): **Motion approved** (springs, staggers, in-screen layout animation) and **Lucide approved** for all icons; see [docs/next/05-UI-UPGRADE](next/05-UI-UPGRADE.md) §8. Rive is not approved.
- Night mode is a class on the practice shell, not a global theme; room pages stay light.
- Keep CSS modules per component as today; tokens live in `globals.css`.
- Build order: tokens and type → Portrait, Person card and lobby → briefing and morph → Character card → call shell (night, bar, captions, glow) → green room → ringing and morph → recap → people restyle → landing.
