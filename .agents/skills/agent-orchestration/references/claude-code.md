# Agent orchestration — Claude Code

**Fable 5** orchestrates in Claude Code (desktop or CLI). **Composer 2.5** runs bulk work via **`cursor-agent` CLI** (Cursor subscription). Claude Code cannot pin Composer on subagent `model:` — shell out instead.

---

## What goes where

| Piece                 | Location                          | How it gets there                                       |
| --------------------- | --------------------------------- | ------------------------------------------------------- |
| Procedure + templates | fixmyskills `agent-orchestration` | Skills CLI → `.agents/skills/`                          |
| Worker skills         | `.claude/skills/cursor-worker-*`  | `init-claude.sh`                                        |
| Orchestration rules   | `CLAUDE.md`                       | Merge `docs/claude-orchestration-snippet.md` after init |
| Parent model          | Claude Code model picker          | You pick Fable 5 each session                           |
| Composer execution    | `cursor-agent` on PATH            | Cursor subscription auth                                |

```mermaid
flowchart LR
  Fable["Fable 5"]
  CMd["CLAUDE.md"]
  Skills["cursor-worker-* skills"]
  CLI["cursor-agent composer-2.5"]
  Fable --> CMd --> Skills --> CLI
```

---

## Bootstrap (one-time per repo)

```bash
bunx skills add FixMyBerlin/fixmyskills --skill agent-orchestration -a cursor -y
bash .agents/skills/agent-orchestration/scripts/init-claude.sh
# Merge docs/claude-orchestration-snippet.md into CLAUDE.md
git add .claude/skills docs/claude-orchestration-snippet.md skills-lock.json CLAUDE.md
git commit -m "Add Claude Code Fable orchestration setup"
```

`--no-docs` skips copying the snippet file. `TARGET_REPO=/path` overrides destination.

Reset templates: re-run `init-claude.sh` (overwrites copied skills and snippet).

---

## Prerequisites

```bash
which cursor-agent
cursor-agent --list-models   # must list composer-2.5
```

Auth uses your **Cursor** subscription — not a separate OpenAI/Codex stack.

---

## Daily usage

Pick **Fable 5** (effort Low–High), then:

```
Orchestrate only. cursor-worker-implement for edits, cursor-worker-review before done.
Do not bulk-edit inline unless trivial (<10 lines).
```

Delegation: bulk edits → `cursor-worker-implement`; review → `cursor-worker-review`; discovery → Claude subagents or `cursor-agent --mode plan`; user-facing design → Fable/Opus.

`cursor-agent` command syntax, the workflow wrapper pattern, and the model table live in the copied `CLAUDE.md` snippet and the `cursor-worker-*` skills — not duplicated here.

---

## Cost traps

- Bulk edits on Fable when `cursor-agent` was available.
- `composer-2.5-fast` unless intentional.
- Parallel `cursor-agent` runs = parallel Cursor usage.
- Wrapper stages still cost Claude tokens — keep wrapper on Sonnet low.

---

## Customize & verify

- Edit `.claude/skills/cursor-worker-*` after init (project check commands, etc.); global copies go in `~/.claude/skills/` (project wins on name).
- Verify: `which cursor-agent`; Claude Code lists both `cursor-worker-*` skills; Fable delegates to Bash `cursor-agent` instead of editing inline.
