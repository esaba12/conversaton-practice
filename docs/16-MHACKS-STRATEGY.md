# MHacks strategy and confirmed requirements

Updated October 3, 2026, America/Detroit. Based on the official live page, linked prize list, track definitions, and handbook (S35-S38). This is a researched plan, not confirmation of entry, eligibility, prize stacking, or acceptance of rules.

## Primary target
Build under Actually Intelligent. The track asks for AI solving a real problem. Demonstrate one believable conversation, editable fictional traits, private context boundaries, and approved memory. Win on implementation and usability, not the number of sponsor logos.

## Prize priorities
| Priority | Category | Listed award | Action |
| --- | --- | --- | --- |
| Primary | Actually Intelligent | $2,500 | Select main theme and demonstrate the user problem |
| Primary | Best Project Built with ElevenLabs | Three months Scale per teammate, listed $897/member | Make real-time expressive voice central |
| Primary | MLH Best Use of ElevenLabs | Wireless earbuds | Confirm separate entry and stacking rules |
| Secondary | Figma x MHacks Best Design | First: LEGO Architecture Trevi Fountain; second/third: merch | Polish controls/accessibility; confirm detailed eligibility |
| Low added scope | Notability | One year Pro and four merch pieces per teammate | Genuine Pro planning/wireframing, tools tag, usage note, at least two screenshots |
| Optional provider choice | MLH Gemini API | MLH swag kits | Use for structured persona drafts/reflection only if chosen before implementation |

Grand prize: $5,000. The additional ElevenLabs Pro benefit listed for the overall winning team is separate from the Scale award. All-participant Creator credits are listed; confirm redemption and availability with sponsors.

## Product and stack decisions
Hero scenario: setting a cleaning boundary with a fictional roommate who deflects with jokes but is friendly underneath. Keep professor and saying-no presets as alternatives.
The confirmed solo product centers on generating practice from the user's own situation. The roommate example is a demo choice, not a research-established superior scenario. Defer Photon until all core gates pass and demo/submission preparation is covered.

Keep Next.js, ElevenLabs, and the currently specified structured-output provider. The user's later AWS credits/account-capacity decision replaces Supabase with AWS-hosted PostgreSQL and required account sign-in (docs/18-DESIGN-AND-AWS.md). This is an infrastructure decision, not prize-driven provider expansion. Gemini is an optional substitution, not a second model layer or an instruction to migrate. If selected, update the server adapter, SDK dependencies, environment example, schemas/refusal handling, privacy disclosure, and provider retention checks together, using official Gemini docs before coding.

The timed demo uses one session. Persona edits must affect actual behavior; approved profile memory must survive refresh. A second session is optional for Q&A, not a forced replay loop.

## Additional sponsor decisions
| Sponsor | Actual requirement or fit | Decision |
| --- | --- | --- |
| Relay | Agent must work in Relay app; first prize includes SF trip/week at Relay house | Lower priority after selecting Photon. Do not build two extra channels during this hackathon. Travel terms remain unverified. |
| Photon | Spectrum framework and iMessage integration required | Deferred for the solo MVP; first stretch only after all core gates and submission preparation. Bounded texting rehearsal with shared persona settings and separate session history. First prize: $400 cash + $300 Photon credits + fast-track to final interview round; second: $200 cash + $100 credits. See docs/17-PHOTON-TEXT-PRACTICE.md. |
| Presage | Human-sensing SDK integration | Defer physiological/emotion scoring; it shifts the experience toward self-monitoring |
| FinchNode | Working API integration with synthetic health records | Defer unless deliberately pivoting to appointment rehearsal |
| FetchAI | Agentverse registration, ASI:One discovery, meaningful actions, extra ASI submission | Weaker fit for current rehearsal scope |
| Neon | Meaningful backend usage; prizes are AI Gateway credits | Do not replace a working backend for eligibility |
| Spacetime | Core real-time backend, meaningful shared state | Defer multiplayer/shared-state expansion |
| SpaceXAI | Cursor plus Grok Imagine or Voice API required | Do not change development and voice stacks solely for this category |
| Nessie, Solana, Tiger Data, FREE-WILi | Financial, blockchain, analytics, or hardware integrations | No natural role in MVP |
| .Tech | Domain-name category | Optional only after core demo and submission are ready |

## Event timing and obligations
All times America/Detroit, October 3-4, 2026.
- Saturday 11:30 AM-1 PM: Sponsor Expo, Pierpont Connector Hall.
- Saturday noon: hacking starts. Handbook requires all coding and building during the event.
- Sunday 11:30 AM: our internal submission target.
- Sunday before noon: official Devpost submission deadline.
- Sunday 12:30-2:30 PM: on-site judging at Duderstadt. Three-minute pitch; repeat judging possible; team must be present.

Teams: 1-4 accepted students. Include teammates, project description, table number, and any additional requested materials in Devpost. Confirm sponsor selections and evidence in the actual form. The handbook lists innovation, technical complexity, usability, and presentation quality; no scoring weights were found.

## Questions to resolve at the expo
1. Can one team enter and win both listed ElevenLabs awards? Are sponsor/main prizes stackable?
2. How are participant credits redeemed, and are there specific ElevenLabs submission requirements?
3. Does Best Design require Figma files or use of a particular Figma tool?
4. If pursuing Relay, can the existing ElevenLabs voice integration and user-controlled personas run in its app?
5. What advance planning/tool setup is allowed? Do not assume this pack authorizes early coding.

Do not delay the core build to resolve optional categories. No account registration, submission, rule acceptance, or sponsor contact has been performed by this documentation update.
