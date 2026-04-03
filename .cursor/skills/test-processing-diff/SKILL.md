---
name: test-processing-diff
description: Run local Docker processing in reference then fixed diffing mode to validate Lua/SQL topic changes via public.*_diff tables. From app/, use `processing-generate-command` to print a copy-paste shell line (interactive Clack on a TTY); agents/CI pass the full non-interactive flag set (see --help). Triggers on processing verification, bbox/topic-limited runs, or diff regression after editing processing/topics.
---

# Test processing with diffing (local Docker)

Use after changing Lua/SQL under `processing/` (especially `processing/topics/`). With diffing enabled, the pipeline writes row-level diffs to `public."<table>_diff"`. Compare **reference** (baseline commit) vs **fixed** (your code) to see what your changes did.

## For agents: use the CLI (do not hand-craft `docker compose` env)

**Always** use `bun run processing-generate-command` from **`app/`**. It prints **one line** that cds to the repo root in a subshell, sets env, and runs docker compose—your cwd is unchanged. **Paste that line** in a shell to run Docker; the Bun script does **not** execute compose.

**Defaults and flag checklist:** run `bun run processing-generate-command -- --help` from `app/` for the full contract, injected skip defaults, and a copy-paste example.

**Default behavior:** with a TTY and **without** a complete non-interactive flag set, the script opens **interactive** prompts (Clack). `bun run processing-generate-command` injects default skip flags; command-line skip/wait/download-url/osm2pgsql-log-level flags are applied without prompts. **Other** partial flags still require a full non-interactive set (you get a warning).

**Non-interactive (required for agents without a TTY, e.g. CI):** pass **every** required flag in one invocation. Required pieces:

- **Bbox:** `--preset <slug>` **or** both `--only-bbox` and `--diff-bbox` (optional: `--distinct-diff-bbox`, `--diff-bbox` with `--preset`).
- **`--diff-mode`** `off` | `previous` | `fixed` | `reference`.
- **Topics:** `--all-topics` **or** `--topics <csv>` (do not pass both).
- **Skips:** `--skip-download`, `--skip-unchanged`, `--skip-warm-cache` each with `0` or `1`. With `--skip-download 1`, also pass `--wait-fresh-data` `0` or `1`; with `--skip-download 0`, wait is forced off (flag optional).
- **Exactly one** of `--dry-run`, `--detach` (`-d`), or `--foreground` (controls the printed `docker compose` line; `--dry-run` and `--foreground` both use attached `up processing`).

**Learn the tool in this order:**

1. From **`app/`**: `bun run processing-generate-command -- --help`.
2. **Agents / no TTY:** full flag set → capture stdout (the one-liner) → run that line in an environment with Docker (or instruct the user to paste it).
3. **Humans:** interactive generate → copy highlighted line → paste → Enter; reuse history and edit **`PROCESSING_DIFFING_MODE`** at the **end** of the env list for reference vs fixed.

**What you need to know (not how the script is implemented):**

- The printed command runs **docker compose** at the repository root (via subshell `cd`) so the **root `.env`** applies (not only `app/.env` from dev copy).
- Overrides are **per pasted command** — no need to `export` vars in the user’s shell.
- Ensure **`db` is healthy** before running the pasted line (`docker compose up -d db` from repo root if needed). The generate script does not start containers.

Implementation: [`app/scripts/processing-generate-command/index.ts`](../../../app/scripts/processing-generate-command/index.ts). README: [`app/scripts/processing-generate-command/README.md`](../../../app/scripts/processing-generate-command/README.md). Script entry: [`app/package.json`](../../../app/package.json) (`processing-generate-command`).

## Full batch examples (reference → fixed)

Use the **same** bbox, topics, and skip flags for reference and fixed; only change `--diff-mode` in the **generate** invocation (the printed line ends with `PROCESSING_DIFFING_MODE=…` last for easy edits).

**Generate reference line (inspect stdout):**

```bash
bun run processing-generate-command -- \
  --preset xhain \
  --diff-mode reference \
  --all-topics \
  --skip-download 1 \
  --skip-unchanged 0 \
  --skip-warm-cache 1 \
  --wait-fresh-data 0 \
  --foreground
```

**Generate fixed line:** same as above with `--diff-mode fixed`.

Paste each printed line to run the container. **Limited topics:** replace `--all-topics` with e.g. `--topics trafficSigns,parking`.

**Common presets (`--preset <slug>`):** same bbox on **both** `PROCESS_ONLY_BBOX` and `PROCESSING_DIFFING_BBOX` unless you use `--distinct-diff-bbox` or separate `--only-bbox` / `--diff-bbox`. See `--help` for the full slug list.

| Slug | Coordinates | Notes |
|------|-------------|-------|
| `xhain` | `13.380,52.488,13.418,52.503` | Small |
| `berlin` / `berlin-full` | `13.0883,52.3382,13.7611,52.6755` | Large |
| `bussonderstreifen` | `13.38486,52.43778,13.38956,52.43959` | Interactive default for processing bbox |

`PROCESSING_DIFFING_BBOX` is **required** whenever diffing mode is not `off` (`processing/diffing/diffing.ts`). Effective diff area is the intersection of the two bboxes when both are set (`processing/diffing/diffing.ts`).

## Env: do not churn root `.env` for this loop

Keep Geofabrik OAuth, default extract URL (e.g. Berlin/Brandenburg), DB, and other secrets in **root** `.env`. For diff tests, **prefer generated env on the command line** instead of editing `.env`. To override the extract URL once, use **`--download-url`** on the CLI (not prompted interactively). See [`.env.example`](../../../.env.example).

## Git workflow (baseline → new code)

1. **Save work:** clean tree, temp commit, or stash.
2. **Baseline:** `git checkout <commit-before-changes>`.
3. **Reference run:** generate with `--diff-mode reference`, paste and run the printed line.
4. Fix failures if needed; re-run the same pasted command after fixes.
5. **Your branch:** `git checkout <branch-with-changes>`.
6. **Fixed run** — same flags except **`--diff-mode fixed`** (or edit only `PROCESSING_DIFFING_MODE` on a reused line).

Do **not** change other diff-related flags between reference and fixed unless you mean to invalidate the comparison.

Detached: use `--detach` in the generate invocation; the printed line uses `docker compose up -d processing`; then `docker logs -f processing`.

## Review `*_diff` tables

After the **fixed** run, inspect **`public`** only:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%\_diff' ESCAPE '\'
ORDER BY table_name;
```

Map topics → table names via topic Lua/SQL or `processing/utils/TableNames.lua`.

**MCP / DB:** Use the user’s Postgres MCP or `psql` with `.env` (`DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`).

**Interpretation:**

- Diffs compare **`tags` JSON** vs the reference snapshot (`processing/README.md`).
- Large diff ⇒ possible regression or broad tag changes; tiny/empty ⇒ often in-bounds or out of bbox/topic scope.
- **Noise:** rerun reference + fixed with `--skip-unchanged 0` and stable bbox/topics if unsure.

```sql
SELECT COUNT(*) FROM public.mytable_diff;
SELECT * FROM public.mytable_diff LIMIT 50;
```

## Quick sanity: Lua unit tests

`./processing/run-tests.sh`

## Related docs

- `processing/README.md` — diffing modes, `PROCESS_ONLY_*`, `SKIP_UNCHANGED`
- `processing/utils/parameters.ts` — env names the container reads
- `app/scripts/processing-generate-command/README.md` — copy-paste workflow, compose from repo root, `app/.env` vs root `.env`
