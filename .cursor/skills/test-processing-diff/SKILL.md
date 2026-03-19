---
name: test-processing-diff
description: Run local Docker processing in reference then fixed diffing mode to validate Lua/SQL topic changes via public.*_diff tables. Use bun run test:processing-diff from app/ — run --help first, then --dry-run before compose. Triggers on processing verification, bbox/topic-limited runs, or diff regression after editing processing/topics.
---

# Test processing with diffing (local Docker)

Use after changing Lua/SQL under `processing/` (especially `processing/topics/`). With diffing enabled, the pipeline writes row-level diffs to `public."<table>_diff"`. Compare **reference** (baseline commit) vs **fixed** (your code) to see what your changes did.

## For agents: use the CLI (do not hand-craft `docker compose` env)

**Always** drive this workflow with `test:processing-diff` unless the user explicitly cannot run Bun (then run `bun run test:processing-diff -- --dry-run` once in a normal environment and use the printed `VAR=value … docker compose…` line from repo root as a last resort).

**Learn the tool in this order:**

1. From **`app/`**: `bun run test:processing-diff -- --help` — flags, bbox presets, defaults.
2. Same directory: `bun run test:processing-diff -- --dry-run -- …same flags as a real run…` — see exact env overrides and compose command **without** starting containers.
3. Drop `--dry-run` to run for real.

**What you need to know (not how the script is implemented):**

- The CLI finds the **repository root** and runs Compose there so the **root `.env`** applies (not only `app/.env` from dev copy).
- Overrides are **per invocation** — no need to `export` vars in the user’s shell.
- A **non-fatal** `docker compose up -d db` runs first; if processing still fails, ensure **`db` is healthy** before retrying.

Implementation and edge cases: [`app/scripts/ProcessingDiffRun/run.ts`](../../../app/scripts/ProcessingDiffRun/run.ts). Short human README: [`app/scripts/ProcessingDiffRun/README.md`](../../../app/scripts/ProcessingDiffRun/README.md). Script entry: [`app/package.json`](../../../app/package.json) (`test:processing-diff`).

## Inputs (flags or sensible defaults)

| Input | How |
|--------|-----|
| Topics | Omit `--topics` or `''` for all. Else e.g. `--topics trafficSigns,parking`. |
| Bbox | `--preset xhain` (small) or `--preset berlin` / `berlin-full` (large), or `--only-bbox` / `--diff-bbox` with `MINLON,MINLAT,MAXLON,MAXLAT`. |

**Common presets (`--preset <slug>`):** same bbox on **both** `PROCESS_ONLY_BBOX` and `PROCESSING_DIFFING_BBOX` unless you use `--distinct-diff-bbox` or separate `--only-bbox` / `--diff-bbox`. See `--help` for the full slug list.

| Slug | Coordinates | Notes |
|------|-------------|--------|
| `xhain` | `13.380,52.488,13.418,52.503` | Small |
| `berlin` / `berlin-full` | `13.0883,52.3382,13.7611,52.6755` | Large |
| `bussonderstreifen` | `13.38486,52.43778,13.38956,52.43959` | Default **only** bbox when no `--preset` |

**Diff mode:** `--diff-mode reference` | `fixed` | `previous` | `off` (defaults to **`fixed`** if omitted).

`PROCESSING_DIFFING_BBOX` is **required** whenever diffing mode is not `off` (`processing/diffing/diffing.ts`). Effective diff area is the intersection of the two bboxes when both are set (`processing/diffing/diffing.ts`).

## Env: do not churn root `.env` for this loop

Keep Geofabrik OAuth, DB, and other secrets in **root** `.env`. For diff tests, **prefer flags** (`--diff-mode`, `--preset`, `--topics`, `--skip-unchanged 0`, etc.) instead of editing `.env`. Optional one-off URL: `--download-url`. See [`.env.example`](../../../.env.example).

## Git workflow (baseline → new code)

1. **Save work:** clean tree, temp commit, or stash.
2. **Baseline:** `git checkout <commit-before-changes>`.
3. **Reference run** (from `app/`):  
   `bun run test:processing-diff -- --preset xhain --diff-mode reference`  
   Reference refreshes `diffing_reference` and clears diff tables — see `processing/README.md` (*Processing: Inspect changes*).
4. Fix failures if needed; re-run the same command after fixes.
5. **Your branch:** `git checkout <branch-with-changes>`.
6. **Fixed run** — **same** preset/topics/bbox flags, only **`--diff-mode fixed`**:  
   `bun run test:processing-diff -- --preset xhain --diff-mode fixed`

Do **not** change other diff-related flags between reference and fixed unless you mean to invalidate the comparison.

Detached logs: add `--detach` if the user wants background; then `docker logs -f processing`.

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
- `app/scripts/ProcessingDiffRun/README.md` — CLI reminders (compose from repo root, `app/.env` vs root `.env`)
