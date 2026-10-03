# Start the build after resetting context

Checked October 3, 2026. Codex CLI, Node/npm, GitHub CLI, and Homebrew are installed. GitHub access works and G1 issues #1-#5 exist. The application has not been scaffolded. No additional MCP is required to begin coding.

## 1. Activate the prepared tools in Warp

Run in a normal terminal; this Codex session cannot write the protected settings/skills directories:

```bash
cd /Users/ethansaba/code/therapist
bash tooling/finish-setup.sh --skip-editor
```

This activates the staged ElevenLabs and UI-review skills and registers OpenAI Docs, Context7, and AWS Knowledge. `--skip-editor` skips optional VS Code extensions. The script was syntax/dry-run checked again; actual activation remains pending. If it fails, keep the error for the next session; do not treat a failed step as completed. AWS Knowledge provides documentation, not account access.

## 2. Commit and push the prepared baseline

After successful activation, include the two installed skill copies so linked worktrees receive them and the original checkout is clean:

```bash
git add -- .gitignore .github AGENTS.md README.md STATUS.md docs tooling
git add -- .agents/skills/elevenlabs-agents .agents/skills/web-design-guidelines
git diff --cached --stat
git diff --cached --check
```

Review the staged files, then:

```bash
git commit -m "docs: prepare conversation practice build"
git push -u origin main
git status --short
```

These commands are prepared, not executed. The repository currently has no first commit. The origin is already configured; no init/remote-add is needed. If the push fails, preserve the local commit and report the error without force-pushing. GitHub API access does not establish that SSH transport has been tested.

## 3. Make accounts ready while scaffolding proceeds

AWS CLI is the remaining account-management tool to install. Homebrew is available:

```bash
brew install awscli
aws login --profile conversation-practice
aws sts get-caller-identity --profile conversation-practice
```

Use your development IAM identity for the AWS account with credits. Browser login requires CLI 2.32.0+ and the appropriate `SignInLocalDevelopmentAccess` permission. Select the region where you intend to build; service compatibility will be verified before provisioning. The identity command confirms authentication, not resource-creation permissions. Sources: [Homebrew formula](https://formulae.brew.sh/formula/awscli), [AWS browser login](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sign-in.html).

If the account uses IAM Identity Center, use `aws configure sso --profile conversation-practice` and `aws sso login --profile conversation-practice` instead. See [AWS SSO setup](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html). Record only the profile name/region and whether login worked; do not paste credentials or identity output into public issues.

Have ElevenLabs API access and credits available for G1, and an OpenAI API key with API billing for G2 setup generation. Put provider keys in the ignored project `.env.local` under `ELEVENLABS_API_KEY` and `OPENAI_API_KEY`, or use the established secure environment. These are intended server-only configuration names; no application currently reads them. Do not use `NEXT_PUBLIC_` prefixes or paste keys into chat/GitHub. Leave account/resource identifiers and model/voice selections to verified setup; do not invent them.

AWS/Cognito/database/ElevenLabs access is required before G1 can pass, but missing credentials do not prevent independent foundation/UI/adapter work. OpenAI access becomes necessary for real G2 generation. You do not need to manually create all cloud resources before the first coding task.

## 4. Start a fresh coordinator

Open this same project after clearing context. For a Warp CLI session, the installed CLI supports:

```bash
codex -C /Users/ethansaba/code/therapist --sandbox workspace-write --ask-for-approval on-request -c approvals_reviewer=auto_review
```

This keeps workspace sandboxing and routes eligible approval requests through automatic review. It does not override managed policy. The current session rejects Git/settings write escalations, so clearing context alone is not a permission change. The next session must verify actual Git/worktree capability. See [official approval guidance](https://learn.chatgpt.com/docs/agent-approvals-security). No disabled-sandbox mode is required for this workflow.

Paste:

> Start building now. Read STATUS.md, AGENTS.md, and docs/21-START-BUILD.md, then follow the coordinator handoff in docs/15-HANDOFF.md. Recheck setup and Git state; do not assume the prepared commands ran. Begin GitHub issue #1 / docs/tasks/G1-00-foundation.md. Use GitHub heavily, keep docs current, and dispatch auth/session, voice, and UI agents in separate worktrees once shared contracts are ready. Continue useful work while account dependencies are pending. Do not repeat product planning.

Normal Warp tabs are enough; the optional two-pane template can wait. No Docker, Supabase account, additional agent framework, or new MCP is a startup prerequisite. The foundation task selects a supported Node/Next.js runtime and installs app dependencies once.
