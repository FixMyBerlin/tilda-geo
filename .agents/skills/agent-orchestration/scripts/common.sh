#!/usr/bin/env bash
# Shared helpers for init-cursor.sh and init-claude.sh
set -euo pipefail

agent_orchestration_skill_dir() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"
  cd "$script_dir/.." && pwd
}

agent_orchestration_repo_root() {
  local skill_dir="$1"
  local dir="$skill_dir"
  while [[ "$dir" != "/" ]]; do
    if [[ -d "$dir/.git" ]] || [[ -f "$dir/skills-lock.json" ]]; then
      echo "$dir"
      return 0
    fi
    dir="$(cd "$dir/.." && pwd)"
  done
  echo "$(cd "$skill_dir/../.." && pwd)"
}
