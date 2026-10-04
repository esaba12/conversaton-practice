# Remaining work

Updated October 3, 2026, 21:26 EDT. G1–G5 are merged. G1 and G2 passed on human live calls. G3–G5 are accepted on automated evidence and stay **live not verified**.

Submission target: **11:30 AM America/Detroit, October 4** (hard noon). Dependencies stay frozen.

On `main` since the 20:00 draft of this plan: three example presets, a 3- or 5-minute choice, collapsed captions, saved-person session attribution (migration applied), a signed-in home, and a Google sign-in button. Google sign-in has not been completed against the provider.

## Still open

Agent-ready briefs for every open item are in [docs/issues](issues/README.md). The October 3, 21:44 snapshot of what is done and what is left is [docs/next](next/README.md).

| When | Task | State |
| --- | --- | --- |
| Human | [LIVE-01](tasks/LIVE-01-human-checks.md), [SUB-01](tasks/SUB-01-submission-execution.md) | Not run. Pitch copy is [DEMO-01](tasks/DEMO-01-submission-prep.md) |
| Human decision | [HOST-01](tasks/HOST-01-hosting.md) | Hosting decision. [NAME-01](tasks/NAME-01-project-name.md) is SpeakEasy |
| After submission, if wanted | [APPEAR-01](tasks/APPEAR-01-appearance.md) | Decided, not built. One face and voice for every call |
| Done | [REV-01](tasks/REV-01-g5-privacy-review.md), [UX-01](tasks/UX-01-presets.md), [UX-02](tasks/UX-02-duration.md), [UX-03](tasks/UX-03-captions.md), [DATA-01](tasks/DATA-01-session-attribution.md), landing in [UI-01](tasks/UI-01-landing-oauth.md) | Merged |
| No commit | [POST-01](tasks/POST-01-workspace-polish.md) | The polish is in `8f61d09`, which is an ancestor of `main`. A separate browser pass was not recorded |

## What is built

Sign-in by email, plus a Google button that returns through `/auth/callback`. Signed-out `/` is the public landing. Signed-in `/` links to practice, About me, and Your data. `/practice` leads with the situation, then three examples (Alex, Ellis, Sam) and saved people. Generate stays the primary path. Review can choose 3 or 5 minutes. The call has optional collapsed captions from in-memory turns. End, optional reflection, explicit Save / Update, sharing, and Your data are in place. A saved-person session stores that person’s id and version.

## Product gaps

| Gap | Today |
| --- | --- |
| Stock face and premade voice per person | One configured face and voice. [APPEAR-01](tasks/APPEAR-01-appearance.md) |
| App host | The authenticated app runs locally. The Vercel site is the static preview in `website/` |
| Project name | SpeakEasy. Wordmark, document title, and Devpost title match |
| Google provider | The button is in the app. The Supabase Google provider and redirect allow list are still a dashboard step |

## Workflows not run

| Workflow | Record | Owner |
| --- | --- | --- |
| Browser pass of the polish commit | POST-01 | Agent, then human look |
| G3 live checklist: save after End, share one fact, hear it used, hear a chip change | LIVE-01; steps in [G3-04](tasks/G3-04-integration.md) | Human, when they choose |
| Reflection from a real call’s transcript | LIVE-01 | Human |
| Rest of the live video matrix and behavior probes in docs/09 | LIVE-01 | Human |
| Screen-reader pass (G5 checked labels in code) | LIVE-01 | Human |
| 3–5 volunteer sessions | LIVE-01, optional | Human |
| Backup recording labelled prerecorded | SUB-01; shot list in DEMO-01 | Human |
| Devpost, table number, theme, stacking confirmation, timed pitch | SUB-01; drafts in DEMO-01 | Human |
| G5 privacy review | [REV-01](tasks/REV-01-g5-privacy-review.md) | Done. 0 blockers. Three should-fix items are unfixed |

Around 18:48–18:52 EDT the human saved a person and edited chips on a real call, and could not assign a fact by drag in the embedded browser. Click-to-share was added after that and has not been confirmed on a live call.

## Leave alone

- Memory proposals (PRD P07 / tests T04–T07). G3 replaced them with explicit Save / Update.
- Photon and Relay. First stretch only after submission prep is covered (docs/17).
- A full repeat of the call. The later shape is the one-moment retry in [docs/30](30-ONE-MOMENT-RETRY.md): decided, not built, and after submission. The old optional shortcut stays early in the docs/10 cut order.
- A second model provider, voice cloning, photo upload, group calls, scores, and branching replay.
- Dependency upgrades.
- The empty checkboxes in docs/10. Those targets were met by the gate records. This document is the remaining plan.

## Cut order if the clock wins

Keep generation, live video, editable personas, explicit save and sharing, End, and owner isolation. Drop, in order: Photon → decorative motion → the appearance catalog → the one-moment retry (docs/30) → automated reflection (keep the self-note and Skip). Presets, duration, and captions are already merged.

## Working rules

- One writer per task. Coordinator owns STATUS, schemas, migrations, and integration.
- Preserve uncommitted work. Do not revert `8f61d09`.
- Click and keyboard paths stay on every drag surface.
- Private notes and unshared About-me facts stay out of counterpart context.
- Record only checks that ran, with mode `static`, `unit`, `mock`, or `live`.
- GitHub issues #27–#37 track the open items; the mapping is in [docs/issues](issues/README.md).
