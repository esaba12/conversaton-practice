# R07: Why it looks vibe-coded, and how to make it look like it does more

Status: research report (planning input, not a spec). Written October 3, 2026, 22:30 EDT. Builds on [R05](R05-DESIGN-DIRECTION.md) (visual direction) and [docs/33](../33-DESIGN-SYSTEM-AND-SCREENS.md) (tokens and screens); does not repeat them. The plan built from this is [docs/next/05-UI-UPGRADE](../next/05-UI-UPGRADE.md).

Owner direction (22:05): "too lackluster and vibe code looking … I want it to look better and look like it does more."

## 1. What "vibe-coded" actually is

Sources agree on the mechanism. Models fill every unspecified design decision with the most common choice in their training data, so agent-built apps converge on the same look [U1, U2, U3]. Adjectives like "clean, modern, premium" don't help; they collapse to the same average [U2]. Two failure types:

1. **Default patterns:** centered text-only hero, three equal cards, one font at similar weights, decorative status dots, uniform radius and shadow everywhere, gradient blobs [U1, U3, U5].
2. **Incoherence:** each component generated locally, so radii, borders, accents, spacing and motion drift between screens. Readers sense "not one mind" even when they can't name it [U4]. Missing states (hover, focus, loading, empty, error) make screens "feel like demos, because they are" [U5].

**Our screenshots** (`artifacts/research-ui/01–05`) show both:

| Tell | Where |
|---|---|
| Centered text-only hero, small eyebrow label with a dot ("● YOU'RE SIGNED IN") | Home |
| Three equal cards giving account plumbing the same weight as the main action | Home |
| Numbered "how it works" list instead of showing the product | Home |
| The character is a form: labeled inputs with character counters | Review, person page |
| Eyebrow-label + two-tone headline repeated on every page ("Shape the / conversation.") | Review, home |
| Grey disabled slabs (Save, Generate) that look broken | Person page, describe |
| A flat olive rectangle as the "call"; controls below the fold | Call |
| No image of a person anywhere in the product | All |
| Every element at rest: no hover lift, no motion, no sound | All |

## 2. What makes polished products read as premium

- **Interaction density, not pixel density.** Linear, Vercel and Stripe look sparse but every element responds to hover, focus, keyboard and context [P1]. "Done" means default, hover, focus-visible, active, disabled and loading all exist [P1, P2].
- **Type first.** A precise type system with one confident display face does more than color [P5]. Ours uses one family at similar weights.
- **Show the real product.** The best landing pages put the actual interface on the page, lightly animated [P5].
- **Restraint plus one accent that is yours** [P5]. We have it (sage), plus a warm clay for "you did it" moments (docs/33).
- **Designed states.** Skeletons that match final layout, shown only after ~200 ms; specific empty states with a next action; inline, fixable errors [P3].
- **Real disabled states.** Not `opacity: .5`; keep contrast, explain why [P2].
- **Focus rings as a quality signal:** 2 px, brand color, offset, `:focus-visible` only [P2].

## 3. Making an AI product look like it does more (truthfully)

The best AI products make the real work visible instead of hiding it behind a spinner [A1–A5]:

- **Stream structure, not a spinner.** Show the skeleton, then fields as they land, then the final result [A2, A3]. OpenAI's Responses API streams structured output as JSON text deltas; the final object is validated at the end [A6]. A partial parser can render the name, then how they talk, then the stance chips, as the model writes them.
- **Show real pipeline steps, never theater.** "Reading your situation", "Shaping Jordan", "Writing the opening line" are fine only if they map to real events. Fabricated "thinking…" sequences erode trust [A5].
- **Progressive disclosure.** Summary first, details on demand (the Meet card leads with the person; "Edit details" holds the form) [A4].
- **Make capabilities visible where they act.** Speaking glow, the goal pill, the "hears your tone" ear, the "What Jordan knows about you" chips, and the "Only you see this" lock are each a capability the user can *see*. Today most of the product's real intelligence (privacy boundary, shared facts, generated stance, natural ending) is invisible.

## 4. References for this product's surfaces

- **Live AI video call** (Tavus guidance [V1, V2]): intro screen with the face, a hair-check (device test) screen, a FaceTime-like call, a closing screen with a next step, and *human* error screens that differ by cause (busy vs failure). Tavus's own `Conversation` block has animated connect and leave states.
- **Character select** (games [C1, C2]): full-screen gallery of portrait cards; hover reveals role and metadata; click opens a large dossier with a confirm action; staggered reveals and portrait crossfades; keyboard and controller navigation with clear hovered, selected and pending states. This is the owner's "simulator" request (docs/31 §4a).
- **Warm emotional products** (How We Feel, Headspace [W1–W3]): metaphor and illustration over literal clinical imagery; warm neutrals with no pure black or white; colored shadows; slow breathing motion for calm moments; guided step-by-step choices instead of long forms (How We Feel's emotion wheel narrows choices progressively).

## 5. How to stop agents from regressing to the average

The fix every source gives is the same: **decide before the agent does, in a form it reads and a reviewer can check** [U1, U4, U5]. Concretely:

1. One design contract file the agent must read (we have docs/33; add a short "UI rules" list of nevers and musts).
2. A living component gallery that shows every state (`/design-preview`).
3. Machine checks where possible (no raw hex in components, no `opacity` disabled states, no default focus outlines).
4. Screenshot review at fixed widths as a gate on every UI PR, checked against the rules.

## Sources

- [U1] Rottoways, "The vibecoding design problem." https://rottoways.com/blog/vibecoding-design-problem
- [U2] Taste Profile, "Why AI-generated UI looks generic." https://tasteprofile.io/blog/why-ai-generated-ui-looks-generic
- [U3] Superdesign, "Why AI design looks generic (2026)." https://superdesign.dev/blog/why-ai-design-looks-generic
- [U4] DEV, "Why AI-generated UIs look 'off'." https://dev.to/kiwibreaksme/why-ai-generated-uis-look-off-and-the-one-principle-that-fixes-it-4j20
- [U5] HorizonX, "Why AI-generated UI looks generic (and the UI specification that fixes it)." https://horizonx.so/blog/ai-generated-ui-looks-generic-ui-specification
- [P1] Mantlr, "How Stripe, Linear, and Vercel ship premium UI." https://mantlr.com/blog/stripe-linear-vercel-premium-ui
- [P2] DEV, "The secret to elite UI kits." https://dev.to/davekurian/the-secret-to-elite-ui-kits-its-not-features-its-obsession-with-details-5enb
- [P3] SmoothUI, "State-first design." https://skills.smoothui.dev/docs/state-design
- [P5] Studio Maydit, "The Linear, Vercel, and Raycast aesthetic." https://studiomaydit.com/blog/linear-vercel-raycast-aesthetic
- [A1] UX Patterns for Developers, "AI loading states." https://uxpatterns.dev/patterns/ai-intelligence/ai-loading-states
- [A2] Brainy, "Designing for latency." https://brainy.ink/paper/designing-for-ai-latency
- [A3] Modern AI Guide, "Streaming UX." https://modernaiguide.dev/docs/patterns/pattern-streaming-ux
- [A4] Agentic Design, "Progressive disclosure patterns." https://agentic-design.ai/patterns/ui-ux-patterns/progressive-disclosure-patterns
- [A5] Multigrid, "Progressive disclosure of AI reasoning." https://multigrid.ai/learn/reasoning-ux
- [A6] OpenAI, "Streaming API responses" and "Structured model outputs." https://developers.openai.com/api/docs/guides/streaming-responses ; https://developers.openai.com/api/docs/guides/structured-outputs
- [V1] Tavus, "The Tavus hackathon cookbook." https://www.tavus.io/blog/hackathon-cookbook
- [V2] Tavus docs, CVI component library blocks. https://docs.tavus.io/sections/conversational-video-interface/component-library/blocks
- [C1] Claim Your Hero (character selection screen). https://github.com/brunocalado/claim-your-hero
- [C2] Nexo, "AOT — tactical UI design" (character dossier concept). https://nexo-studio-red.vercel.app/work/aot/
- [W1] How We Feel design (B. Powell). https://www.bpowell.co/design/how-we-feel
- [W2] ScreensDesign, How We Feel UI breakdown. https://screensdesign.com/showcase/how-we-feel
- [W3] Blake Crosley, "Headspace: designing for calm" (secondary analysis). https://blakecrosley.com/guides/design/headspace

Accessed October 3, 2026. Secondary design blogs are opinion and pattern summaries, not measured studies; treat them as craft guidance.
