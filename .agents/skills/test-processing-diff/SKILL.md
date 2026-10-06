---
name: test-processing-diff
description: Run local Docker processing in reference then fixed diffing mode to validate Lua/SQL topic changes via public.*_diff tables. From app/, use `processing` (interactive Clack on a TTY: show or run the compose line; agents/CI pass the full non-interactive flag set and capture stdout). Triggers on processing verification, bbox/topic-limited runs, diff regression after editing processing/topics, or noisy diffs from pseudo-tag CSVs (sidepath, settlement, Mapillary) that must be pinned between runs.
---

# Test processing with diffing (local Docker)

Use after changing Lua/SQL under `processing/` (especially `processing/topics/`). With diffing enabled, the pipeline writes row-level diffs to `public."<table>_diff"`. Compare **reference** (baseline commit) vs **fixed** (your code) to see what your changes did.

## For agents: use the CLI (do not hand-craft `docker compose` env)

**Always** use `bun run processing` from **`app/`**. It builds **one line** that cds to the repo root in a subshell, sets env, and runs docker compose—your cwd is unchanged. **Interactive:** choose **Run command** to execute in this terminal, or **Show command** and paste the line. **Non-interactive / agents:** capture stdout and run that line in an environment with Docker.

**Defaults and flag checklist:** run `bun run processing -- --help` from `app/` for the full contract, injected skip defaults, and a copy-paste example.

**Default behavior:** with a TTY and **without** a complete non-interactive flag set, the script opens **interactive** prompts (Clack). `bun run processing` injects default skip flags; command-line skip/wait/download-url/osm2pgsql-log-level flags are applied without prompts. **Other** partial flags still require a full non-interactive set (you get a warning).

**Non-interactive (required for agents without a TTY, e.g. CI):** pass **every** required flag in one invocation. Required pieces:

- **Bbox:** `--preset <slug>` **or** both `--only-bbox` and `--diff-bbox` (optional: `--distinct-diff-bbox`, `--diff-bbox` with `--preset`).
- **`--diff-mode`** `off` | `previous` | `fixed` | `reference`.
- **Topics:** exactly one of `--all-daily-topics` (nightly only; usual for diff tests) **or** `--all-topics` (incl. weekly) **or** `--topics <csv>`.
- **Skips:** `--skip-download`, `--skip-unchanged`, `--skip-warm-cache` each with `0` or `1`. With `--skip-download 1`, also pass `--wait-fresh-data` `0` or `1`; with `--skip-download 0`, wait is forced off (flag optional).
- **Exactly one** of `--dry-run`, `--detach` (`-d`), or `--foreground` (controls the printed `docker compose` line; `--dry-run` and `--foreground` both use attached `up processing`).

**Learn the tool in this order:**

1. From **`app/`**: `bun run processing -- --help`.
2. **Agents / no TTY:** full flag set → capture stdout (the one-liner) → run that line in an environment with Docker (or instruct the user to paste it).
3. **Humans:** interactive generate → **Run command** or copy highlighted line → paste → Enter; reuse history and edit **`PROCESSING_DIFFING_MODE`** at the **end** of the env list for reference vs fixed.

**What you need to know (not how the script is implemented):**

- The printed command runs **docker compose** at the repository root (via subshell `cd`) so the **root `.env`** applies—the same file the app uses via `bun --env-file=../.env` from `app/`.
- Overrides are **per pasted command** — no need to `export` vars in the user’s shell.
- Ensure **`db` is healthy** before running the pasted line (`docker compose up -d db` from repo root if needed). The generate script does not start containers.
- On isolated worktree stacks, follow [tilda-geo-agent-workflow](../tilda-geo-agent-workflow/SKILL.md) for `.env.local` / `DEV_STACK_ID` rules; prefer the env from the printed `bun run processing` line over manual env.

Implementation: [`app/scripts/processing-generate-command/index.ts`](../../../app/scripts/processing-generate-command/index.ts). README: [`app/scripts/processing-generate-command/README.md`](../../../app/scripts/processing-generate-command/README.md). Script entry: [`app/package.json`](../../../app/package.json) (`processing`).

## Full batch examples (reference → fixed)

Use the **same** bbox, topics, and skip flags for reference and fixed; only change `--diff-mode` in the **generate** invocation (the printed line ends with `PROCESSING_DIFFING_MODE=…` last for easy edits).

**Generate reference line (inspect stdout):**

```bash
bun run processing -- \
  --preset xhain-kreuzberg \
  --diff-mode reference \
  --all-daily-topics \
  --skip-download 1 \
  --skip-unchanged 0 \
  --skip-warm-cache 1 \
  --wait-fresh-data 0 \
  --foreground
```

**Generate fixed line:** same as above with `--diff-mode fixed`.

Paste each printed line to run the container. **Limited topics:** `--topics trafficSigns,parking`. **Include weekly (`landcover`):** `--all-topics` or list `landcover` in `--topics`.

**Common presets (`--preset <slug>`):** same bbox on **both** `PROCESS_ONLY_BBOX` and `PROCESSING_DIFFING_BBOX` unless you use `--distinct-diff-bbox` or separate `--only-bbox` / `--diff-bbox`. See `--help` for the full slug list.

| Slug                  | Coordinates                                   | Notes                                   |
| --------------------- | --------------------------------------------- | --------------------------------------- |
| `xhain-kreuzberg`     | `13.380,52.488,13.418,52.503`                 | Small                                   |
| `berlin-full`         | `13.0883,52.3382,13.7611,52.6755`             | Large                                   |
| `bussonderstreifen`   | `13.38486,52.43778,13.38956,52.43959`         | Interactive default for processing bbox |
| `seed-herrfurthplatz` | `13.4209256,52.4763157,13.4272212,52.4779464` | `bun run seed` geo-bootstrap            |
| `bibi`                | `9.0671,48.9229,9.1753,48.9838`               | Bietigheim-Bissingen (OSM 1613510)      |

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

**Mapillary pseudo-tags:** With `reference`, processing always re-downloads `mapillary_coverage.csv`. With `fixed`, it reuses that file (no re-download) so `mapillary_coverage` diffs reflect Lua changes only. Run reference before fixed on the same Docker volume.

### Pseudo-tag CSVs: pin them, or the diff is noisy

Afterthoughts write `is_sidepath_estimation.csv` (and `settlement_area_estimation.csv` when landcover runs) into `/data/pseudoTagsData` **for the next run**; `roads_bikelanes` reads them at the start. So reference and fixed read different inputs unless you pin them. Symptom: `_is_sidepath` / `in_settlement_area` / `adjoining_*` diffs your code did not cause.

Clean sequence (same generated line, only `PROCESSING_DIFFING_MODE` changes):

1. Baseline checkout → **warm-up** run with `off` (inputs now come from baseline code on this bbox).
2. **Pin:** copy the CSVs out of the volume.
3. **Reference** run → save its output CSVs.
4. **Restore** the pinned CSVs into the volume.
5. Branch checkout → **fixed** run → save its output CSVs.

The volume is `<compose project>_osmfiles` (`tilda-geo_osmfiles` for the default stack). Copy with the local processing image (no pull). Use a shell **function**, not a command stored in a string (zsh does not word-split `$VAR`):

```bash
OUT=../tilda-geo--diff-runs/$(date +%F)   # from repo root; persistent (/tmp is wiped on reboot)
mkdir -p "$OUT"
vol() { docker run --rm --entrypoint sh -v tilda-geo_osmfiles:/data -v "$(cd "$OUT" && pwd)":/out processing:latest -c "$1"; }
# step 2 (same pattern with /out/<step-name> to save each run's output)
vol 'mkdir -p /out/1-pinned-input && cp /data/pseudoTagsData/is_sidepath_estimation.csv /data/pseudoTagsData/settlement_area_estimation.csv /out/1-pinned-input/ 2>/dev/null; ls /out/1-pinned-input'
# step 4
vol 'cp /out/1-pinned-input/*.csv /data/pseudoTagsData/'
```

Compare the saved outputs (`md5 -q …/*.csv` on macOS, `md5sum` on Linux): identical reference and fixed outputs mean your change does not affect the estimation. A `fixed` rerun (e.g. after a code fix) must restore the pinned input first; the reference snapshot stays valid.

**Worktrees:** the post-checkout hook removes `.env.local` when you switch between baseline and branch. Re-add `DEV_ATTACH_STACK=default` afterwards if you attached to the develop stack.

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
- **Noise:** first rule out unpinned pseudo-tag CSVs (above); then rerun reference + fixed with `--skip-unchanged 0` and stable bbox/topics.
- **Reference is bbox-clipped:** `diffing_reference.*` only holds rows matched by the diff bbox, while `public.*` keeps everything processing wrote (including lines that cross the bbox edge, even with identical bboxes). Compare totals inside the bbox only (`geom && ST_Transform(ST_MakeEnvelope(…, 4326), 3857)`).
- **Tables new on the branch:** the baseline does not write them, so the reference snapshot copies whatever stale `public` table an earlier run left. Its `_diff` is not baseline-vs-branch; ignore it, or drop the table before the reference run.

```sql
SELECT COUNT(*) FROM public.mytable_diff;
SELECT * FROM public.mytable_diff LIMIT 50;

-- What changed, grouped by tag key (`tags.CHANGE` = added | removed | modified)
SELECT d.tags->>'CHANGE' AS change, k AS key, count(*)
FROM public.mytable_diff d
LEFT JOIN LATERAL jsonb_object_keys(
  CASE WHEN d.tags->>'CHANGE' = 'modified' THEN d.tags - 'CHANGE' ELSE '{}'::jsonb END
) k ON true
GROUP BY 1, 2 ORDER BY 3 DESC;
```

## Quick sanity: Lua unit tests

Run from `processing/`:

`bun run test`

Notes:

- This wrapper runs Docker+busted for the whole suite.
- Lua modules are loaded via dotted requires (for example `topics.parking.roads.helper.result_tags`).

## Lua heap profiling (performance / memory investigations)

Use when tuning osm2pgsql Lua (CSV cache size, per-way growth) — not for routine diff tests.

1. **Helper:** [`processing/topics/helper/memory_reporter.lua`](../../../processing/topics/helper/memory_reporter.lua) — copy the usage example at the bottom into the topic under investigation (e.g. `prepare_pseudo_tags_roads_bikelanes.lua`, `load_merged_pseudo_tags.lua`). Remove the wiring after the run.
2. **Enable for one run:** add to repo root **`.env`** (not `docker-compose.yml`):
   - `PT_MEMORY_REPORT=1`
   - optional `PT_MEMORY_REPORT_EVERY=100000`
3. Run processing as usual (`bun run processing` → paste line). Logs show `MEMORY: …` on stdout / `docker logs processing`.
4. **Context:** national pseudo-tag performance notes live on branch `processing-performance-csvs-settlements` (`processing/docs/roads-bikelanes-nightly-performance-handoff.md`).

Do not leave `memory_reporter` calls in committed prod topic code.

## Related docs

- `processing/README.md` — diffing modes, `PROCESS_ONLY_*`, `SKIP_UNCHANGED`
- `processing/utils/parameters.ts` — env names the container reads
- `app/scripts/processing-generate-command/README.md` — copy-paste workflow, compose from repo root, single root `.env`
