#!/usr/bin/env bash
# Run from your normal terminal. The Codex sandbox cannot write these settings.
set -euo pipefail
project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
dry_run=false
install_editor=true
for argument in "$@"; do
  case "$argument" in
    --dry-run) dry_run=true ;;
    --skip-editor) install_editor=false ;;
    *) printf 'Unknown option: %s\n' "$argument" >&2; exit 2 ;;
  esac
done
run() {
  if "$dry_run"; then printf 'Would run:'; printf ' %q' "$@"; printf '\n'; else "$@"; fi
}
for required_command in codex node npm; do
  command -v "$required_command" >/dev/null || { printf 'Missing command: %s\n' "$required_command" >&2; exit 1; }
done

for skill in elevenlabs-agents web-design-guidelines; do
  source_dir="$project_root/tooling/skills/$skill"
  destination_dir="$project_root/.agents/skills/$skill"
  if [[ -e "$destination_dir" ]]; then
    diff -qr "$source_dir" "$destination_dir" >/dev/null || {
      printf 'Existing skill differs; leaving it untouched: %s\n' "$destination_dir" >&2
      exit 1
    }
  fi
done
run mkdir -p "$project_root/.agents/skills"
for skill in elevenlabs-agents web-design-guidelines; do
  if [[ ! -e "$project_root/.agents/skills/$skill" ]]; then
    run cp -R "$project_root/tooling/skills/$skill" "$project_root/.agents/skills/$skill"
  fi
done
if [[ ! -f "$project_root/tooling/codex/node_modules/@upstash/context7-mcp/dist/index.js" ]]; then
  run npm ci --prefix "$project_root/tooling/codex"
fi

add_server() {
  local server_name="$1"
  shift
  if codex mcp get "$server_name" >/dev/null 2>&1; then
    printf 'Keeping existing MCP configuration: %s\n' "$server_name"
  else
    run codex mcp add "$server_name" "$@"
  fi
}
add_server openaiDeveloperDocs --url https://developers.openai.com/mcp
add_server context7 -- "$(command -v node)" "$project_root/tooling/codex/node_modules/@upstash/context7-mcp/dist/index.js"
add_server awsKnowledge --url https://knowledge-mcp.global.api.aws

if "$install_editor"; then
  if command -v code >/dev/null; then
    run code --install-extension dbaeumer.vscode-eslint --install-extension bradlc.vscode-tailwindcss
  else
    printf 'VS Code CLI unavailable; editor extensions skipped.\n'
  fi
fi
run node "$project_root/tooling/codex/check-context7.mjs"
if "$dry_run"; then
  printf 'Dry run only; no settings changed.\n'
else
  printf 'Setup completed. Start a new Codex turn and verify the MCP connections.\n'
fi
