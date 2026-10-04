# Remaining work

Updated October 4, 2026, 11:15 AM America/Detroit. Submission is due at noon. Dependencies stay frozen. The October 3 version of this page is in Git history.

## What shipped

The compressed plan in [docs/next](next/README.md) through Phase 3, then the SpeakEasy name, the redesigned landing, dashboard and lobby ([PR #98](https://github.com/esaba12/conversaton-practice/pull/98)), and the domain https://speakeasyapp.tech. `main` `9b7bc93` is in production.

Built: email-and-password sign-in; a lobby with saved people and four starters (Jordan, Alex, Ellis, Sam), each with its own stock face and premade voice; a briefing with a goal and an optional hard-moment line; Show me first with a stand-in; Meet and a green room; a live call with video-first gating, a goal light, captions and End; a recap with a self-check and one retry of the hard moment; saved people with trait chips, About-me sharing (drag and keyboard), and a look-and-voice picker; Your data with provider cleanup labels; a demo seed script.

Live: the owner's October 4, ~10:23 AM report ("it all worked") covers saved Jordan through Show me first, the call, recap and one retry, then a call using Alex's look. It ran before PR #98 was deployed. See [STATUS](../STATUS.md).

## Still open

| Item | State | Owner |
| --- | --- | --- |
| Devpost submission ([#36](https://github.com/esaba12/conversaton-practice/issues/36)) | Paste ready in [DEMO-01](tasks/DEMO-01-submission-prep.md) | Owner, before noon |
| Judging, 1:00–3:00 PM, Duderstadt Basement | Science-fair pitch in DEMO-01 | Owner |
| Live call on the redesigned lobby | Not run | Owner, optional, before judging |
| Real-Auth scripts on the redesign ([#30](https://github.com/esaba12/conversaton-practice/issues/30)) | Not re-run; needs `.env.local` and a Supabase login | Coordinator, after submission |
| [#31](https://github.com/esaba12/conversaton-practice/issues/31) old-screen walkthrough | Proposed: close as superseded | Owner decision |
| Rest of [LIVE-01](tasks/LIVE-01-human-checks.md): sharing probe, chip tone, Your data, video loss, behavior probes, screen reader | Automated only | Owner, when they choose |
| Host allowlist change, uncommitted in the main checkout | No PR, no live call; do not deploy before judging | Coordinator, after judging |

## Leave alone

- Photon, Relay and other sponsor integrations.
- Voice cloning, photo upload, group calls, scores and branching replay.
- Dependency upgrades and new features before judging.

## Working rules

- Record only checks that ran, with mode `static`, `unit`, `mock` or `live`.
- Private notes and unshared About-me facts stay out of counterpart context.
- Preserve uncommitted work.
