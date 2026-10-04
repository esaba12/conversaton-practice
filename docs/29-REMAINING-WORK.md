# Remaining work

Written October 3, 2026, 20:00 EDT. G1–G5 are merged. G1 and G2 passed on human live calls. G3–G5 are accepted on automated evidence and stay **live not verified**. This plan is the source for everything still open. It does not reopen closed gates or authorize a new feature before the human says the workspace is good enough.

Submission target: **11:30 AM America/Detroit, October 4** (hard noon). Dependencies stay frozen.

Local `main` is `8f61d0968e1eba755c79281780f199f7960248f3`, one commit ahead of `origin/main`, not pushed. That commit is the workspace polish (situation first, shared header, collapsed character fields). Browser verification of it has not been recorded.

## Order

| Band | When | Tasks |
| --- | --- | --- |
| A | Now | [POST-01](tasks/POST-01-workspace-polish.md) — verify the polish commit in the browser |
| B | Human, in parallel, no product code | [LIVE-01](tasks/LIVE-01-human-checks.md), [SUB-01](tasks/SUB-01-submission-execution.md). [REV-01](tasks/REV-01-g5-privacy-review.md) is an optional read-only agent review |
| C | Only after the human accepts the workspace, and only if it fits before the freeze | [UX-02](tasks/UX-02-duration.md), then [UX-01](tasks/UX-01-presets.md), then [UX-03](tasks/UX-03-captions.md) |
| D | After submission | [DATA-01](tasks/DATA-01-session-attribution.md), [APPEAR-01](tasks/APPEAR-01-appearance.md) |
| E | Human decision, no default | [NAME-01](tasks/NAME-01-project-name.md), [HOST-01](tasks/HOST-01-hosting.md) |

An agent does not start band C, D, or E because this document exists. Each task stays `planned` or `blocked` until its unblock condition is met. Demo text already written in [DEMO-01](tasks/DEMO-01-submission-prep.md) is the submission copy; [SUB-01](tasks/SUB-01-submission-execution.md) is the execution checklist.

## What is already built

Sign-in, generated editable setup, one roommate example, a three-minute Tavus call with ElevenLabs speech, End and teardown, optional reflection, explicit Save / Update, About me, per-person sharing, and Your data. The start schema already accepts 180 or 300 seconds. The preset literal is only `"roommate"`.

## Product gaps

| Gap | Spec | Today | Task |
| --- | --- | --- | --- |
| Professor and saying-no presets | PRD P01; docs/02 home presets | One “Use roommate example” button. The other two situations appear as hint text | UX-01 |
| 3- or 5-minute choice | PRD defaults | `durationSchema` allows 180 and 300. The workspace always sends 180 | UX-02 |
| Optional collapsed captions | docs/02 practice | Tavus is created with `enable_closed_captions: false`. No control | UX-03 |
| Which saved person a session used | docs/26 as-built; G5-04 deferred | Sessions store owner, lease, status, and cleanup. The person version is only in the idempotency fingerprint | DATA-01 |
| Stock face and premade voice per person | docs/00, October 3 17:23 | One configured face and voice for every call | APPEAR-01 |
| App host | docs/10; README | Authenticated app runs locally. The Vercel site is the static preview in `website/` | HOST-01 |
| Project name | docs/00 | Unnamed. The wordmark is “Conversation practice” | NAME-01 |

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
| G5 privacy review | REV-01. [G5-04](tasks/G5-04-integration.md) notes the dispatched reviewer did not return | Read-only agent |

Around 18:48–18:52 EDT the human saved a person and edited chips on a real call, and could not assign a fact by drag in the embedded browser. Click-to-share was added after that and has not been confirmed on a live call.

## Leave alone

- Memory proposals (PRD P07 / tests T04–T07). G3 replaced them with explicit Save / Update.
- Photon and Relay. First stretch only after submission prep is covered (docs/17).
- Repeat-practice shortcut. Optional, and early in the docs/10 cut order.
- A second model provider, voice cloning, photo upload, group calls, scores, and branching replay.
- Dependency upgrades.
- The empty checkboxes in docs/10. Those targets were met by the gate records. This document is the remaining plan.

## Cut order if the clock wins

Keep generation, live video, editable personas, explicit save and sharing, End, and owner isolation. Drop, in order: Photon → decorative motion → the appearance catalog → a repeat-practice shortcut → automated reflection (keep the self-note and Skip). UX-03 is the first band-C task to drop, because it changes the live-call path. UX-02 and UX-01 are small and stay off the call path except for the duration value Tavus already accepts.

## Working rules

- One writer per task. Coordinator owns STATUS, schemas, migrations, and integration.
- Preserve uncommitted work. Do not revert `8f61d09`.
- Click and keyboard paths stay on every drag surface.
- Private notes and unshared About-me facts stay out of counterpart context.
- Record only checks that ran, with mode `static`, `unit`, `mock`, or `live`.
- Open a GitHub issue when a task moves to `ready`. None of these issues exist yet.
