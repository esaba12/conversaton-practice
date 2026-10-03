# Tool research and selection

Research date: October 3, 2026.
Scope: official documentation, maintained upstream GitHub repositories, and developer newsletters. Recommendations are project-specific judgments, not benchmark results.
Installation commands were source-checked, not executed on the user's machine.

Later same-day audit/install results are in [tooling/README.md](../tooling/README.md). The Codex app already supplies browser tooling; an additional browser MCP is unnecessary for now. AWS Knowledge MCP was added to the proposed activation script after the user selected AWS infrastructure. This page otherwise preserves the earlier research rationale.

## What GitHub research changed

### ElevenLabs
The official skills repository includes a focused agents skill and terminal setup guidance. A separate official plugin supports account-connected management.
Choice: use the agents skill first; add CLI management only if it saves dashboard work. Full plugin is an alternative if the installed Codex version supports it.
Why: our hard integration is voice sessions and persona configuration. This is more relevant than a generic agent framework.
Sources S21, S23.

### Playwright
Microsoft maintains both playwright-cli and playwright-mcp. Their READMEs explicitly recommend considering CLI plus skills for coding agents and reserve MCP for workflows needing richer persistent interaction.
Choice: CLI plus one discoverable skill. Keep MCP as an alternative.
Why: we need to inspect the app, exercise forms, and review screenshots. We also need a separate real audio check.
Sources S24-S25.

### Context7
Upstash's repository and official OpenAI MCP docs establish a supported documentation lookup path.
Choice: useful, after core voice tooling.
Why: version drift in Next.js and SDK signatures is a concrete risk.
Limit: source retrieval is not execution validation, and availability/quotas depend on account setup.
Sources S26-S28.

### Vercel agent skills
Official repository provides web-design-guidelines and React-focused guidance.
Choice: one UI review skill.
Why: keyboard navigation and clear session controls matter. The skill does not supply product taste or replace the UX spec.
Source S29.

### Matt Pocock's skills
Repository focuses on requirements, domain terminology, implementation feedback loops, and handoffs.
Choice: optional later, not another required installer today.
Why: this pack already supplies the spec, glossary, task sequence, and handoff. Adding a planning workflow that restarts discovery would consume the event.
Source S30.

## Newsletter research

### The AI Engineer: The 7 skills I actually use every day with AI coding agents
The article argues for a small set of useful skills and places specification work early in the workflow.
Application here: install only tools that remove concrete integration or verification problems.
This is an author's workflow opinion, not experimental evidence that our selected stack is optimal.
Source S31.

### The Pragmatic Engineer: AI Skills with Matt Pocock
The interview discusses reusable skills, engineering fundamentals, context management, planning, and course correction.
Application here: use small verified increments and a durable project vocabulary. Avoid asking Codex to build the entire product from one giant prompt.
The linked repository was inspected separately for actual available workflows.
Sources S30 and S32.

### A practical guide to Skills, Subagents, and MCP
The guide distinguishes reusable workflow guidance from external tool access and discusses common integrations such as Context7 and Playwright.
Application here: distinguish skills, MCP servers, command-line tools, and runtime dependencies instead of installing all of them as if they were equivalent.
Source S33.

Newsletter claims were used for workflow context only. Technical commands and APIs were checked against official docs and upstream repositories.

## Deliberately not in the default installation
- Multiple overlapping browser servers.
- General application-runtime multi-agent orchestration frameworks. Development subagents and worktrees are explicitly requested; use the lightweight workflow in [agent workflow](19-AGENT-WORKFLOW.md).
- Unreviewed mega skill packs.
- A vector-memory service for a handful of profile fields.
- Database administration MCP with broad permissions when migrations suffice.
- GitHub MCP solely for basic repository operations that git already handles.
- A second voice stack alongside ElevenLabs.
- Automatic deployment tools before there is a tested app.

These tools may be useful elsewhere; they do not solve the current critical path.

## Project-specific best configuration
1. Written project contracts and AGENTS.md.
2. ElevenLabs agents skill.
3. Browser inspection through Playwright CLI.
4. OpenAI Docs MCP and optionally Context7.
5. A focused UI review skill.
6. App-level tests and actual human voice testing.

The first live conversation remains more important than completing the optional tool list.

## Limitations
No repository code audit, local Mac install, performance benchmark, or hands-on competitor trial was performed. GitHub star counts were not used as a quality ranking. Documentation and package contents can change; verify command help and keep installed versions pinned after setup.
