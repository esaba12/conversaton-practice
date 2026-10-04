# 3E: Demo seed (W8)

- Owner: coordinator. Path: `scripts/demo/seed.mjs`. Spec: docs/next/04-NEW-SPECS.md W8.
- Behaviour: signs in as the fictional demo account (`DEMO_EMAIL`/`DEMO_PASSWORD` in `.env.local`, never committed) and refuses unless its Auth metadata has `demo: true`. It resets, then adds the About-me facts "I've been on the team for two years" and "I'm leading the API work", copies the Jordan starter, shares both facts with Jordan and sets his face to the `manager` starter. `--checkin` plans the talk for today so the check-in banner shows; `--reset` only removes people, facts and plans through the owner-checked RPCs. `--create` (service key passed inline for that command only) creates or labels the demo account.
- Evidence (02:45): demo account created; seed run twice in a row and reset each time. SQL check on the linked project after seed: 1 person, preset `manager`, 2 shared links, 2 facts, 1 plan; after reset: 0 / null / 0 / 0 / 0. No provider calls.
