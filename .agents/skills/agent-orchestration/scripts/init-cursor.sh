#!/usr/bin/env bash
# Bootstrap Cursor IDE orchestration (.cursor/agents + rule).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

SKILL_DIR="$(agent_orchestration_skill_dir)"
REPO_ROOT="$(cd "${TARGET_REPO:-$(agent_orchestration_repo_root "$SKILL_DIR")}" && pwd)"
ASSETS="$SKILL_DIR/assets/cursor"

for arg in "$@"; do
  case "$arg" in
    -h | --help)
      echo "Usage: bash scripts/init-cursor.sh"
      echo "Copies Cursor IDE templates into .cursor/agents/ and .cursor/rules/."
      echo "Set TARGET_REPO=/path/to/repo to override destination."
      exit 0
      ;;
  esac
done

mkdir -p "$REPO_ROOT/.cursor/agents" "$REPO_ROOT/.cursor/rules"

cp "$ASSETS/implementer.md" "$REPO_ROOT/.cursor/agents/implementer.md"
cp "$ASSETS/verifier.md" "$REPO_ROOT/.cursor/agents/verifier.md"
cp "$ASSETS/orchestrator-worker.md" "$REPO_ROOT/.cursor/rules/orchestrator-worker.md"

echo "Cursor IDE orchestration setup complete in: $REPO_ROOT"
echo "  $REPO_ROOT/.cursor/agents/implementer.md"
echo "  $REPO_ROOT/.cursor/agents/verifier.md"
echo "  $REPO_ROOT/.cursor/rules/orchestrator-worker.md"
echo ""
echo "Next: commit .cursor/; pick an orchestrator (Fable 5, Sonnet 5, or GPT-5.6 Sol); use @orchestrator-worker on large tasks"
