# Processing generate-command (diff test runs)

[`processing-generate-command`](../../package.json) prints **one copy-paste shell command** that runs `docker compose up … processing` from the **git repo root** with per-run env overrides (same idea as the **test-processing-diff** Cursor skill and [`processing/README.md`](../../../processing/README.md) § diffing).

- Skill: `.cursor/skills/test-processing-diff/SKILL.md`.
- The Bun script **does not** run Docker. Paste the printed line from **`app/` or any cwd**: it cds to the absolute repo root inside a subshell, runs compose there, then returns—your shell’s directory does not change.
- Ensure Postgres is up first, e.g. `docker compose up -d db` from the repo root; `processing` waits on a healthy `db`.

## Workflow

1. From **`app/`**: `bun run processing-generate-command` (interactive) **or** pass a full non-interactive flag set (see `--help`).
2. Copy the **highlighted one-liner** (green/bold in a TTY; plain text if `NO_COLOR` is set or stdout is not a TTY).
3. Paste into your shell and press Enter.
4. For **reference → fixed**, reuse shell history: the line ends with `PROCESSING_DIFFING_MODE=…` last so you can change only `reference` / `fixed` (or edit the flag block at the end).

```bash
bun run processing-generate-command -- --help
```

**Defaults:** `bun run processing-generate-command` injects `--skip-download 1 --skip-warm-cache 1 --skip-unchanged 0` so interactive skip prompts are skipped unless you override on the command line.

**Partial flags (interactive):** skip/wait/download-url/osm2pgsql-log-level merge from argv; everything else still comes from prompts unless you pass a **full** non-interactive set.

**Non-interactive (CI, agents, no TTY):** pass every required flag in one invocation. Example:

```bash
bun run processing-generate-command -- \
  --preset xhain \
  --diff-mode fixed \
  --all-topics \
  --skip-download 1 \
  --skip-unchanged 0 \
  --skip-warm-cache 1 \
  --wait-fresh-data 0 \
  --foreground
```

Use `--topics csv` instead of `--all-topics` when limiting topics. Pass exactly one of `--dry-run`, `--detach` (`-d`), or `--foreground` (`--dry-run` and `--foreground` both yield `docker compose up processing` in the printed line; `--detach` yields `up -d`).

Geofabrik OAuth, default extract URL, and other secrets stay in the root `.env` (Berlin/Brandenburg is the usual extract). To override the download URL for one run, pass `--download-url` on the command line only—there is no interactive prompt for it.

**Reference → fixed:** generate once (or twice) with the same bbox/topics/skips; only change **`PROCESSING_DIFFING_MODE`** at the end of the printed command between reference and fixed. Do not change other diff-related env between those two runs.

**Reminder:** inside the subshell, `docker compose` runs from the **absolute** repo root and loads the **root** `.env`—the same file the Node app uses from `app/` via `bun --env-file=../.env`.
