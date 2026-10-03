# Local development tools

Prepared October 3, 2026. These are development tools, not application dependencies.

## Actual state

- Context7 MCP 4.1.1 installed in `codex/node_modules`, with exact dependency version and `package-lock.json`.
- Its local MCP handshake and tool discovery passed; remote Context7 retrieval has not been tested. OpenAI Docs and AWS Knowledge each returned tool lists and real documentation search results via direct HTTP. The latest setup dry run found existing OpenAI Docs and Context7 Codex configurations; queries through those configured connections were not retested.
- ElevenLabs agents and Vercel web-design-guidelines are staged under `skills/` and now active under the project's `.agents/skills` after the user's setup.
- Earlier automated activation was blocked by protected settings/skill directories; the user subsequently activated the skills and documentation MCP configurations. The VS Code extension attempt encountered a marketplace DNS failure, and extension installation remains unverified.
- No AWS account connection or cloud provisioning has occurred.

## Finish activation

Run in your normal terminal:

```sh
bash /Users/ethansaba/code/therapist/tooling/finish-setup.sh
```

Use `--dry-run` to preview the operations or `--skip-editor` to omit VS Code extensions. The script installs the staged skills into project `.agents/skills`, registers OpenAI Docs and local Context7, and installs ESLint and Tailwind CSS IntelliSense. Existing named MCP configurations are preserved; differing existing skills cause a stop rather than overwrite. AWS Knowledge was removed from the default setup after the user returned to Supabase; an already registered copy can remain optional.

These MCPs provide documentation access, not account administration. Context7 may require authentication for higher limits. No credentials are embedded in the script. No AWS CLI/account setup is required for this build.

Start a new turn after activation so Codex can discover the skills. Test an actual documentation query before treating a configured MCP as a working remote integration.

Verification completed: package install (npm reported zero vulnerabilities), Context7 local startup/discovery, shell syntax, finish-script dry run, and direct HTTP searches on both documentation services. No app typecheck or production build exists at this stage.

## Worktrees and Warp

The development-agent framework is [documented here](../docs/19-AGENT-WORKFLOW.md). G1 task briefs are prepared; no application task has started. Once the coordinator has committed a reviewed clean baseline and the relevant task record:

```sh
bash tooling/worktree.sh G1-02-voice --dry-run
bash tooling/worktree.sh G1-02-voice
```

The helper accepts `<task-id> [base-ref] [--dry-run]`, resolves a commit, and creates `agent/<task-id>` under ignored `.worktrees/<task-id>`. It refuses an unborn or dirty original checkout, missing task record, unsafe path, existing branch/path, or a linked-worktree invocation. It does not install dependencies, copy secrets, or launch agents. Install app dependencies with `npm ci` inside each worktree once the app lockfile exists.

For Warp, ordinary tabs work immediately. An optional [two-pane tab configuration](warp/task-codex.toml) is staged for Codex plus a checks terminal. It uses an existing worktree path as a parameter and starts no app server. To install from the normal terminal without overwriting an existing config:

```sh
mkdir -p ~/.warp/tab_configs
cp -n tooling/warp/task-codex.toml ~/.warp/tab_configs/task_codex.toml
```

Open Warp's Tab Configs picker and choose **Task: Codex + checks**, then enter the absolute path of the created worktree. Review any existing same-named file before using it; `cp -n` preserves it. The TOML is based on [official Warp documentation](https://docs.warp.dev/terminal/windows/tab-configs); it has not been installed or exercised in Warp here. A separate editor/agent writer must use another worktree.

The user completed baseline commit `ec919a5`; preserve subsequent local changes before creating task worktrees. Shell syntax and isolated Git-fixture checks passed for creation, no-mutation dry-run, dirty/invalid/duplicate/path guard cases, and linked-checkout refusal. TOML parsing and structure checks passed; Warp UI was not tested. See [STATUS.md](../STATUS.md) for current verification and repository state.

## Provenance

| Item | Source | Pinned revision |
| --- | --- | --- |
| ElevenLabs agents | https://github.com/elevenlabs/skills/tree/81f1eafc65c9219ab4aa305d81ffc552a6f43f9d/agents | `81f1eafc65c9219ab4aa305d81ffc552a6f43f9d` |
| Vercel UI review | https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/web-design-guidelines | `063bee94c3f4df8453406c830b0a7df0f2860278` |
| Context7 | https://github.com/upstash/context7 | npm `@upstash/context7-mcp@4.1.1` |
| AWS Knowledge | https://awslabs.github.io/mcp/servers/aws-knowledge-mcp-server | Hosted service; not version-pinned |
| OpenAI Docs | https://developers.openai.com/learn/docs-mcp | Hosted service; not version-pinned |

The skill installer initially failed to download through its Python network path. The pinned upstream archives were subsequently downloaded using the available curl tool and the selected skill files were staged without executing upstream scripts. Project instructions take precedence over examples in vendor skills (especially transcript logging and additional voice-agent tools).
