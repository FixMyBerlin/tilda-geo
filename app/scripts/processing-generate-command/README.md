# Processing CLI (diff test runs)

[`processing`](../../package.json) builds **one shell command** that runs `docker compose up … processing` from the **git repo root** with per-run env overrides (same idea as the **test-processing-diff** Cursor skill and [`processing/README.md`](../../../processing/README.md) § diffing).

- Skill: `.cursor/skills/test-processing-diff/SKILL.md`.
- **Interactive (TTY):** after prompts, choose **Show command** (copy-paste) or **Run command** (executes in this terminal with live logs).
- **Non-interactive:** prints one line to stdout only (CI/agents). Paste from **`app/` or any cwd**: it cds to the absolute repo root inside a subshell, runs compose there, then returns—your shell’s directory does not change.
- Ensure Postgres is up first, e.g. `docker compose up -d db` from the repo root; `processing` waits on a healthy `db`.

## Workflow

1. From **`app/`**: `bun run processing` (interactive) **or** pass a full non-interactive flag set (see `--help`).
2. **Interactive:** choose **Show command** or **Run command**. Show prints a note with bbox summary and the compose one-liner. Run executes it in the current terminal.
3. **Non-interactive:** copy the printed line, paste into your shell, and press Enter.
4. For **reference → fixed**, reuse shell history: the line ends with `PROCESSING_DIFFING_MODE=…` last so you can change only `reference` / `fixed` (or edit the flag block at the end).

```bash
bun run processing -- --help
```

**Defaults:** `bun run processing` injects `--skip-download 1 --skip-warm-cache 1 --skip-unchanged 0` so those skip prompts are skipped. In interactive mode, flags already on the command line are shown as auto-answered steps (◇): the question, the chosen label, and the flag that was passed.

**Partial flags (interactive):** skip/wait/download-url/osm2pgsql-log-level merge from argv; everything else still comes from prompts unless you pass a **full** non-interactive set.

**Topics (interactive):** choose **All (incl. weekly)** (default; runs `landcover` etc.), **All daily** (nightly pipeline only), or **Only specific topics** (checkbox list, none selected by default).

**Non-interactive (CI, agents, no TTY):** pass every required flag in one invocation. Example:

```bash
bun run processing -- \
  --preset xhain \
  --diff-mode fixed \
  --all-daily-topics \
  --skip-download 1 \
  --skip-unchanged 0 \
  --skip-warm-cache 1 \
  --wait-fresh-data 0 \
  --foreground
```

Topic flags (exactly one):

- `--all-daily-topics` — nightly topics only; weekend topics skipped unless Saturday (usual diff-test default)
- `--all-topics` — all topic IDs incl. weekly (`landcover`); longer runs
- `--topics csv` — e.g. `trafficSigns,parking`

Pass exactly one of `--dry-run`, `--detach` (`-d`), or `--foreground` (`--dry-run` and `--foreground` both yield `docker compose up processing` in the printed line; `--detach` yields `up -d`).

Geofabrik OAuth, default extract URL, and other secrets stay in the root `.env` (Berlin/Brandenburg is the usual extract). To override the download URL for one run, pass `--download-url` on the command line only—there is no interactive prompt for it.

**Reference → fixed:** generate once (or twice) with the same bbox/topics/skips; only change **`PROCESSING_DIFFING_MODE`** at the end of the printed command between reference and fixed. Do not change other diff-related env between those two runs.

**Reminder:** inside the subshell, `docker compose` runs from the **absolute** repo root and loads the **root** `.env`—the same file the Node app uses from `app/` via `bun --env-file=../.env`.
