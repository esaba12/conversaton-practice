#!/usr/bin/env bash
# Create one task worktree from an agreed, committed baseline. Never starts tools.
set -euo pipefail

usage() {
  printf 'Usage: bash tooling/worktree.sh <task-id> [base-ref] [--dry-run]\n' >&2
}

fail() {
  printf 'worktree: %s\n' "$1" >&2
  exit 1
}

if (( $# < 1 || $# > 3 )); then
  usage
  exit 2
fi

task_id=$1
shift
if [[ ! "$task_id" =~ ^[A-Za-z][A-Za-z0-9-]{0,63}$ ]]; then
  fail 'Task ID must start with a letter and contain only 1-64 letters, digits, or hyphens.'
fi

base_ref=HEAD
dry_run=false
if (( $# > 0 )) && [[ "$1" != --dry-run ]]; then
  base_ref=$1
  shift
fi
if (( $# > 0 )) && [[ "$1" == --dry-run ]]; then
  dry_run=true
  shift
fi
if (( $# != 0 )); then
  usage
  exit 2
fi

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)
[[ -d "$repo_root/.git" && ! -L "$repo_root/.git" ]] ||
  fail 'Run the helper from the original repository, which must have its own .git directory.'

# Prevent read-only checks (including dry runs) from refreshing the Git index.
export GIT_OPTIONAL_LOCKS=0
actual_root=$(git -C "$repo_root" rev-parse --show-toplevel) ||
  fail 'Cannot identify the repository.'
[[ "$actual_root" == "$repo_root" ]] || fail 'Git resolved a different repository root.'
git -C "$repo_root" rev-parse --verify --end-of-options 'HEAD^{commit}' >/dev/null 2>&1 ||
  fail 'Create the reviewed initial commit first; this repository has no committed baseline.'
worktree_root="$repo_root/.worktrees"
worktree_path="$worktree_root/$task_id"
branch_name="agent/$task_id"
[[ ! -L "$worktree_root" ]] || fail '.worktrees must not be a symbolic link.'
[[ ! -e "$worktree_root" || -d "$worktree_root" ]] || fail '.worktrees exists but is not a directory.'
baseline_status=$(git -C "$repo_root" status --porcelain --untracked-files=all) ||
  fail 'Cannot inspect the baseline.'
[[ -z "$baseline_status" ]] ||
  fail 'The original checkout must be clean, including untracked files. Review and commit the intended baseline first.'

base_commit=$(git -C "$repo_root" rev-parse --verify --end-of-options "${base_ref}^{commit}" 2>/dev/null) ||
  fail 'The selected base does not resolve to a commit.'
task_path="docs/tasks/$task_id.md"
task_type=$(git -C "$repo_root" cat-file -t "$base_commit:$task_path" 2>/dev/null) ||
  fail 'The selected base must contain this task record under docs/tasks/.'
[[ "$task_type" == blob ]] || fail 'The task record in the selected base must be a file.'

git -C "$repo_root" check-ignore -q -- .worktrees/ ||
  fail 'Ignore .worktrees/ in the original checkout before creating worktrees.'
[[ ! -e "$worktree_path" && ! -L "$worktree_path" ]] || fail 'The task worktree path already exists.'
if git -C "$repo_root" show-ref --verify --quiet "refs/heads/$branch_name"; then
  fail 'The task branch already exists. Inspect its state instead of recreating it.'
fi

worktree_command=(git -C "$repo_root" worktree add -b "$branch_name" "$worktree_path" "$base_commit")
printf 'Base commit: %s\n' "$base_commit"
printf 'Task record: %s\n' "$task_path"
printf 'Command: '
printf '%q ' "${worktree_command[@]}"
printf '\n'
if [[ "$dry_run" == true ]]; then
  printf 'Dry run only; no worktree or branch was created.\n'
  exit 0
fi

"${worktree_command[@]}"
printf 'Created worktree: %s\n' "$worktree_path"
printf 'Open a separate terminal tab in that directory and follow the task record.\n'
