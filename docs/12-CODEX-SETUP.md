# Codex CLI setup for this build

Researched October 3, 2026. Commands are recommendations for the user's Mac and project; they were not executed there. Start with the minimal set. Source IDs link to [the source register](14-SOURCES.md).

Latest same-day update: Context7 4.1.1 is installed locally and the two project skills are active. Recheck MCP registration after restart; this session cannot write Codex settings or `.agents`. See [actual tooling state](../tooling/README.md). The user returned to Supabase Auth/PostgreSQL and will create a fresh project; required non-anonymous sign-in remains. AWS setup is no longer required. See [current direction](18-DESIGN-AND-AWS.md). The global latest-version commands below are historical recommendations; use the pinned finish script only for incomplete setup.

## Recommended tools

| Priority | Tool | Role |
|---|---|---|
| Essential | ElevenLabs agents skill | Current voice-agent integration guidance |
| Essential | Playwright CLI | Let Codex inspect and exercise the running UI |
| Essential | OpenAI Docs MCP | Current Codex/OpenAI API documentation |
| Useful | Context7 MCP | Find version-specific library documentation |
| Useful | Vercel web-design-guidelines skill | Accessibility and UI review |
| Optional | ElevenLabs CLI | Manage agent configuration from the terminal |
| Alternative | ElevenLabs full plugin | Account-connected agent management; use instead of duplicate skills |
| Alternative | Playwright MCP | Rich persistent browser interaction if CLI workflow is insufficient |

Skills are instructions; MCP servers expose tools; npm app dependencies are runtime libraries. Installing a skill does not install or authenticate the service it describes.

## 1. Check prerequisites

In Terminal:

    node --version
    npm --version
    git --version
    codex --version
    codex mcp --help

Use a supported Node LTS that satisfies the chosen Next.js release. Check its current requirements instead of copying an old minimum. Keep your working Codex authentication. Do not change models or reinstall Codex solely for this pack.

Copy README.md, AGENTS.md, and docs/ into the intended repository. If a project already exists, merge instructions and let Codex inspect it before scaffolding.

## 2. Add the focused ElevenLabs skill

Run from the project directory:

    npx skills add elevenlabs/skills --skill agents --agent codex

This is the official ElevenLabs skills repository; targeted installation uses Vercel's skills installer flags. Project scope is preferred. Inspect the installation changes, restart Codex if discovery fails, and ask it to identify the installed agent skill. S21 and S22.

Optional terminal management:

    npm install -g @elevenlabs/cli
    elevenlabs --help

The CLI reads ELEVENLABS_API_KEY. Supply secrets through your normal secure environment setup; do not paste keys into prompts or commit them.

Alternative full plugin, only if your installed Codex supports plugin commands:

    codex plugin --help
    codex plugin marketplace add elevenlabs/plugin

Then open Codex and install from /plugins, following the plugin's account authentication. This is documented by ElevenLabs; verify local CLI support first. It is an alternative to the standalone agents skill, not another required layer. The plugin's account authorization does not automatically provision application runtime credentials. S23.

## 3. Install one browser-control option

Recommended CLI:

    npm install -g @playwright/cli@latest
    playwright-cli --help
    npx skills add microsoft/playwright-cli --skill playwright-cli --agent codex

The targeted installer places the repository's browser skill where Codex can discover it. Microsoft's native installer is another supported route:

    playwright-cli install --skills

Use one skill installation route, not both. Check discovery; the help-driven CLI workflow also works without a skill. Sources S24 and S22.

Smoke test after your app runs:

    playwright-cli open http://localhost:3000 --headed

If a browser binary is missing, follow the installed CLI's help; do not assume the agent CLI shares binaries or flags with the test runner.

Alternative MCP, only if the CLI is not meeting your needs:

    codex mcp add playwright -- npx -y @playwright/mcp@latest

Do not run both by default. Microsoft's repository now explicitly distinguishes the CLI-oriented coding workflow from MCP's richer persistent integration. S24-S25.

Browser automation can verify forms and mocked session UI. A real microphone session is still required.

## 4. Add documentation access

    codex mcp add openaiDeveloperDocs --url https://developers.openai.com/mcp
    codex mcp add context7 -- npx -y @upstash/context7-mcp
    codex mcp list

Inside Codex, /mcp shows active connections. OpenAI documents these command forms. Context7 account/key configuration may be needed for your desired rate limits; follow its current provider instructions rather than putting a key in a shared command. S26-S28.

Ask Codex to use these tools for a specific API question and confirm it retrieves a source. Listing a server alone does not prove the connection works.
For ElevenLabs, prefer its own agent skill and documentation; Context7 is supplementary.

## 5. Add one UI review skill

    npx skills add vercel-labs/agent-skills --skill web-design-guidelines --agent codex

Use for keyboard access, focus, labeling, and interface review. It is not a guarantee of attractive design; docs/02-UX.md remains the design direction. S29.

Optional: list other Vercel skills and select a React-specific one only when useful:

    npx skills add vercel-labs/agent-skills --list

Do not install every skill pack.

## 6. App dependencies are separate

Have Codex scaffold a Next.js app with TypeScript, Tailwind, and npm according to current official installation docs. In a new empty app, the expected libraries are:

    npm install @elevenlabs/react openai zod
    npm install -D vitest @playwright/test
    npx playwright install chromium

This last browser installation is for the application's test runner, distinct from the coding-agent CLI.
Use installed package types and a lockfile. Select the Cognito/OIDC and AWS data SDK dependencies with the final AWS path before implementation. Add the server ElevenLabs SDK only if actual implementation needs it; fetch is sufficient for a small credential route.

## 7. Environment and service setup

Application variables, with no actual values in this pack:
- ELEVENLABS_API_KEY: server only.
- ELEVENLABS_AGENT_ID: server configuration.
- OPENAI_API_KEY: server only, for setup/reflection if enabled.
- STRUCTURED_OUTPUT_MODEL: validated supported model ID selected in your account.
- AWS region, Cognito issuer/client identifiers, and database cluster/secret identifiers: define with the selected AWS implementation; do not invent account values.
- APP_ORIGIN: actual app origin.

Codex login/API credits and application API billing are separate.
Configure AWS-hosted PostgreSQL and required account sign-in, implement ownership/RLS, and protect public sign-in/session creation against abuse. Never expose database/admin or provider credentials in NEXT_PUBLIC variables. No-app-save practice still requires a signed-in account.
Commit a placeholder .env.example and ignore .env.local.

## 8. Verification checklist
- Codex reads AGENTS.md and identifies the first build gate.
- ElevenLabs skill is discoverable.
- Documentation MCP returns a real result.
- Playwright opens the running app.
- A real synchronized AI video call completes and End releases microphone/camera and stops all playback; see docs/22-LIVE-VIDEO.md.
- Owner isolation and memory approval tests pass.
- Provider retention settings match the UI's disclosure.

## Time budget
Spend approximately 15-25 minutes on optional tooling, then build. If an optional installation fails, use official docs and shell tools rather than spending the event configuring an elaborate harness.
Record tool versions after setup and avoid updates during final demo preparation.
