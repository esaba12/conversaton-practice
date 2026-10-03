# Start the build after resetting context

Latest access check: all five local environment values are present, and read-only Tavus, ElevenLabs, OpenAI, and Supabase requests passed on October 3 at 13:45 America/Detroit. Git main/remote match `4dc34a1`. Do not repeat key creation. Supabase CLI is still blocked by protected telemetry in this session, so migration access remains unverified. See [PREP-03](tasks/PREP-03-access-check.md). The user requested access checks/documentation only before clearing context; no build or call was started.

Later update: the user completed baseline commit `ec919a5` (main tracking origin/main), and the two project skills are now active. Skip completed activation/initial-commit steps after checking actual state. A public static website is now live at https://conversation-practice-site.vercel.app; preserve its uncommitted source/handoff changes before starting G1. See STATUS.md for the latest state.

Checked October 3, 2026. Codex CLI, Node/npm, GitHub CLI, and Homebrew are installed. GitHub access works and G1 issues #1-#5 exist. The application has not been scaffolded. No additional MCP is required to begin coding.

## 1. Confirm existing setup

The user completed baseline commit `ec919a5` and the two project skills are active. Check current Git/MCP state rather than repeating initialization. Preserve the local website and revised backend docs before creating worktrees.

If documentation tools still need activation, run in a normal terminal:

```bash
cd /Users/ethansaba/code/therapist
bash tooling/finish-setup.sh --skip-editor
```

The script now registers OpenAI Docs and Context7. AWS tooling is no longer a prerequisite. Existing named configurations are preserved.

## 2. Connect the fresh Supabase project

Completed: the user supplied fresh project `rcktybngebovyopregnt`. Its Project URL and publishable key are saved in the ignored root `.env.local`, and the Auth health endpoint returned HTTP 200. Keep the actual values locally; the configuration format is:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

These are the public client configuration values used by the official [Supabase Next.js SSR setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs). A publishable key does not replace Auth/RLS. Do not put a secret/service-role key into a public variable. Foundation will add validated configuration, cookie refresh, sign-in, migrations, and owner policies; no live integration exists yet.

Keep any database password/admin credential private. It is needed only for an explicitly chosen migration/admin path, not ordinary user requests. The Supabase CLI is present, but this Codex session could not run its version command because its telemetry file is protected; use the normal terminal if account login/migration commands require it. That failure did not test project access.

## 3. Set up Tavus, ElevenLabs speech, and OpenAI

The user confirms credits for both Tavus and ElevenLabs. Use Tavus CVI with explicitly selected ElevenLabs TTS for the first integration attempt. This means Tavus orchestrates the conversation; ElevenLabs supplies speech. A separate ElevenLabs Agent or LiveAvatar account is not required for this route. Credits are user-confirmed; API access and billing behavior have not been tested. Earlier LiveAvatar-specific account instructions are superseded for current setup.

1. Tavus: open [PAL Maker](https://maker.tavus.io), select API Key in the sidebar, create a named project key, and save it locally as `TAVUS_API_KEY`. See [official authentication instructions](https://docs.tavus.io/api-reference/authentication). Leave PAL/stock-face creation to the coordinator so it matches our context/privacy contracts.
2. ElevenLabs: open personal API-key settings and create a project key. Restrict it to text-to-speech and voice-read operations needed by the integration; leave unrelated write/admin capabilities off. Save it as `ELEVENLABS_API_KEY`. A stock voice is enough; choosing a voice is optional and the coordinator can inspect available IDs. See [key management](https://elevenlabs.io/docs/overview/administration/workspaces/api-keys). Tavus accepts an explicit ElevenLabs TTS engine; if we supply a private voice key, Tavus receives that restricted key server-to-server. Verify actual provider charging with a small test; do not assume one provider's credits cover another.
3. OpenAI: create an API project/key with API billing available for setup generation and reflection. Save as `OPENAI_API_KEY`. See [official quickstart](https://developers.openai.com/api/docs/quickstart).

Open the existing ignored file from the project directory, for example `open -e .env.local` on macOS, and add these entries while preserving the Supabase values:

```dotenv
TAVUS_API_KEY=your-tavus-key
ELEVENLABS_API_KEY=your-elevenlabs-key
OPENAI_API_KEY=your-openai-key
```

These are server-only values: no `NEXT_PUBLIC_` prefix. Keep secrets out of chat and GitHub. The latest local check found all five values present. Authenticated read-only provider access passed; paid generation, TTS capability, and live video remain untested.

Supabase dashboard setup for the first local build: keep Email sign-in enabled and anonymous sign-in disabled. Set Authentication > URL Configuration > Site URL to `http://localhost:3000`, and allow `http://localhost:3000/**` for local development. The wildcard is local only; exact production URLs are added after the app is deployed. See [redirect URL guidance](https://supabase.com/docs/guides/auth/redirect-urls). The current public static preview is not the Auth callback application.

For migration access, run `supabase login` in a normal terminal and keep the fresh project's database password in a password manager. Login authenticates the CLI; it does not apply migrations or itself prove database connectivity. The coordinator will initialize/link the repository and prepare/apply reviewed migrations against the selected project; do not manually create tables now.

The coordinator owns the stock-face/PAL setup, explicit ElevenLabs engine configuration, private call credentials, camera/privacy defaults, disabled automatic provider memory/recording, and a bounded real-call test. That test verifies persona configuration, synchronization, interruption, and complete teardown. Before dispatch, revise the remaining provider-specific worker contracts from the earlier LiveAvatar route; full integration is not established by account setup.

Vercel and GitHub already have working connections from preparation. Add production environment variables and Auth callback URLs when the Next.js app is ready; the existing static preview is a separate deployment. Additional MCPs, AWS, Docker, and video cloning are not prerequisites.

## 4. Start a fresh coordinator

Open this same project after clearing context. For a Warp CLI session, the installed CLI supports:

```bash
codex -C /Users/ethansaba/code/therapist --sandbox workspace-write --ask-for-approval on-request -c approvals_reviewer=auto_review
```

This keeps workspace sandboxing and routes eligible approval requests through automatic review. It does not override managed policy. The current session rejects Git/settings write escalations, so clearing context alone is not a permission change. The next session must verify actual Git/worktree capability. See [official approval guidance](https://learn.chatgpt.com/docs/agent-approvals-security). No disabled-sandbox mode is required for this workflow.

Paste:

> Start building now. Read STATUS.md, AGENTS.md, and docs/21-START-BUILD.md, then follow the coordinator handoff in docs/15-HANDOFF.md. Recheck setup and Git state; do not assume the prepared commands ran. Begin GitHub issue #1 / docs/tasks/G1-00-foundation.md, including the video feasibility checks in docs/22-LIVE-VIDEO.md. Use GitHub heavily, keep docs current, and dispatch auth/session, media, and UI agents in separate worktrees once shared contracts are ready. Continue useful work while account dependencies are pending. Do not repeat product planning.

Normal Warp tabs are enough; the optional two-pane template can wait. No Docker, additional agent framework, or new MCP is needed to scaffold. The fresh Supabase project is required for live authentication and database acceptance. The foundation task selects a supported Node/Next.js runtime and installs app dependencies once.
