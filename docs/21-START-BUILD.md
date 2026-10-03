# Resume the active build

Read STATUS.md first, then AGENTS.md, README.md, current build gate and task. The build is active on `build/g1-foundation`; do not repeat account/key setup or initialize another app.

## Local app
Use Node 22 (`.nvmrc`). `npm ci` installs frozen dependencies including a local Node binary for npm scripts. Preserve existing ignored `.env.local`; `.env.example` describes safe names only.
- `npm run dev`: app on http://127.0.0.1:3000.
- `npm run typecheck`, `npm test`, `npm run build`.
- `npm run test:ui`: isolated Chromium checks on port 3100.
- External frontend agent: worktree `.worktrees/g1-frontend`, port 3003, exact ownership in [its task](tasks/G1-03-frontend-preview.md).

## Provider feasibility
Selected route is Tavus CVI + explicit ElevenLabs TTS. PAL/face/voice IDs already exist in local configuration; do not create duplicates. Setup script `scripts/preflight/provider-setup.mjs` checks existing configuration and test-mode acceptance. It sends the ElevenLabs key to Tavus server-to-server when creating the PAL.

Live local harness: `node_modules/.bin/node --env-file=.env.local scripts/preflight/video-server.mjs`, http://127.0.0.1:3010. Coordinate microphone use with the human. It is an isolated feasibility instrument, not the authenticated application. Follow [live checks](22-LIVE-VIDEO.md). Never count test mode or a mock as audiovisual acceptance.

## Supabase
Fresh project is linked; migrations and actual results are in STATUS/G1-00C. Do not ask for keys again or manually recreate tables. Coordinator reviews then uses `supabase db push --dry-run`, followed by the intended migration application. `supabase db query --linked --file supabase/tests/session_foundation.sql` runs rollback-only synthetic database assertions.

The server-only session capability is provisioned with `node_modules/.bin/node --env-file=.env.local scripts/preflight/provision-session-secret.mjs`; raw capability stays local, digest goes into private schema. This is not a service-role key and does not replace user ownership.

Actual sign-in/email delivery and callback configuration still need verification. Production callback URLs are not configured by the static preview. Confirm local Site URL/redirects for the browser origin used (localhost/127.0.0.1); avoid broad production wildcards. Default SMTP may restrict delivery to organization members and rate-limit messages.

## Workflow
The user authorized routine GitHub branches, commits, draft PRs and coordinated integration. Keep the external frontend's paths untouched. Do not freeze live media contracts until preflight evidence exists, and do not advance beyond G1 until the signed-in video slice passes. All secrets remain outside Git.
