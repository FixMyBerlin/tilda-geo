#!/usr/bin/env bash
# Bootstrap Claude Code orchestration (.claude/skills + CLAUDE.md snippet).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

SKILL_DIR="$(agent_orchestration_skill_dir)"
REPO_ROOT="$(cd "${TARGET_REPO:-$(agent_orchestration_repo_root "$SKILL_DIR")}" && pwd)"
ASSETS="$SKILL_DIR/assets/claude"

SKIP_DOCS=false
for arg in "$@"; do
  case "$arg" in
    --no-docs) SKIP_DOCS=true ;;
    -h | --help)
      echo "Usage: bash scripts/init-claude.sh [--no-docs]"
      echo "Copies Claude Code skills into .claude/skills/ (and docs/claude-orchestration-snippet.md)."
      echo "Set TARGET_REPO=/path/to/repo to override destination."
      exit 0
      ;;
  esac
done

mkdir -p "$REPO_ROOT/.claude/skills/cursor-worker-implement" \
  "$REPO_ROOT/.claude/skills/cursor-worker-review"

cp "$ASSETS/skills/cursor-worker-implement/SKILL.md" \
  "$REPO_ROOT/.claude/skills/cursor-worker-implement/SKILL.md"
cp "$ASSETS/skills/cursor-worker-review/SKILL.md" \
  "$REPO_ROOT/.claude/skills/cursor-worker-review/SKILL.md"

SNIPPET="$REPO_ROOT/docs/claude-orchestration-snippet.md"
if [[ "$SKIP_DOCS" == false ]]; then
  mkdir -p "$(dirname "$SNIPPET")"
  cp "$ASSETS/claude-md-orchestration.md" "$SNIPPET"
fi

echo "Claude Code orchestration setup complete in: $REPO_ROOT"
echo "  $REPO_ROOT/.claude/skills/cursor-worker-implement/SKILL.md"
echo "  $REPO_ROOT/.claude/skills/cursor-worker-review/SKILL.md"
[[ "$SKIP_DOCS" == false ]] && echo "  $SNIPPET"
echo ""
echo "Next: merge docs/claude-orchestration-snippet.md into CLAUDE.md; ensure cursor-agent on PATH"
