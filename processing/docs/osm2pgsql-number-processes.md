# OSM2PGSQL_NUMBER_PROCESSES

Controls osm2pgsql `--number-processes` (parallel thread pool for import stages). Set via env `OSM2PGSQL_NUMBER_PROCESSES`; parsed in [`../utils/parameters.ts`](../utils/parameters.ts); passed to osm2pgsql in [`../steps/processTopics.ts`](../steps/processTopics.ts).

## Decision (2026-06-26)

**Staging and production: leave unset → effective value 4.**

Not in [`.github/env/deploy.manifest.json`](../../.github/env/deploy.manifest.json). Nightly/deploy runs use [`processing-compose-up.sh`](../../processing-compose-up.sh), which clears per-run vars; the code default applies.

## Server inventory (staging + production)

Same VPS class on both environments (benchmark run on staging, 2026-06-26).

|                   | Host                                             | Processing container                 |
| ----------------- | ------------------------------------------------ | ------------------------------------ |
| **CPU**           | 8 vCPU (`nproc`), AMD EPYC-Milan                 | 8 (`os.cpus().length`)               |
| **RAM**           | 15 GiB total (~9–12 GiB available during runs)   | ~17 GiB reported (`os.totalmem`)     |
| **Docker limits** | —                                                | None (`cpus=0`, `mem=0` → full host) |
| **Disk**          | 464 GiB (staging) / 310 GiB (prod), ~30–50% used | OSM PBF on `osmfiles` volume         |

**Postgres (shared host):** 17.5, `max_connections=100`, `shared_buffers=1GB`, `maintenance_work_mem=2GB`.

**Processing toolchain:** osm2pgsql 2.3.0, Bun 1.3.14, PostGIS 3.5.

Processing and Postgres run on the same machine — thread count competes with DB I/O and parallel query workers.

## Staging benchmark

**Workload:** `roads_bikelanes` only, full Germany PBF, `SKIP_DOWNLOAD=1`, `SKIP_UNCHANGED=0`, `PROCESSING_DIFFING_MODE=off`, `OSM2PGSQL_NUMBER_PROCESSES` = 4 / 6 / 8 per run. **`OSM2PGSQL_LOG_LEVEL` unset** (code default `info`) — see [log level for test runs](#log-level-for-test-runs) below.

| N   | `Topics: roads_bikelanes finished` | Lua phase (`meta.topics`)      | Notes                              |
| --- | ---------------------------------- | ------------------------------ | ---------------------------------- |
| 4   | 02:26:18                           | 06:05:08 → 08:30:29 (~2:25:22) | Current default                    |
| 6   | 02:29:25                           | ~2:28:24                       | Slowest — likely CPU/DB contention |
| 8   | 02:25:05                           | ~2:24:09                       | ~1m 13s faster lua than 4 (~0.8%)  |

No `FATAL`, connection-slot, or OOM errors at any N. SQL post-processing (~1 min) is unaffected.

**Why keep 4:** gain at N=8 is under 1% on the heaviest nightly topic; N=6 is worse than 4; processing and Postgres share the same 8 vCPUs, so higher thread counts add contention risk on full pipeline runs (all topics + afterthoughts) beyond this single-topic test.

## When to re-benchmark

- VPS CPU/RAM class changes
- osm2pgsql major upgrade
- Sustained full-pipeline timing regression on nightly runs
- Before adding `OSM2PGSQL_NUMBER_PROCESSES` to the deploy manifest

## Override for experiments

Per-run only — **not** in `.env` on `/srv`.

**Local:** `bun run processing-generate-command` or prefix the printed `docker compose` one-liner:

```bash
OSM2PGSQL_NUMBER_PROCESSES=8 docker compose up processing
```

**Staging SSH:** do not use `processing-compose-up.sh` for benchmarks (it unsets this var). Prefix `docker compose` directly, same as the benchmark loop above.

After experiments, rely on the code default again (no manifest entry).

## Log level for test runs

**Performance benchmarks (comparing `OSM2PGSQL_NUMBER_PROCESSES`, topic timings, etc.): leave `OSM2PGSQL_LOG_LEVEL` unset** — effective value is `info` ([`parameters.ts`](../utils/parameters.ts)). Do **not** use `debug` for timing runs: extra log I/O skews wall-clock and lua-phase comparisons.

Use `OSM2PGSQL_LOG_LEVEL=debug` only when diagnosing a failed or incorrect osm2pgsql import (tag handling, SQL errors, flex Lua), not when measuring throughput.

```bash
# Timing benchmark — no log override
OSM2PGSQL_NUMBER_PROCESSES=8 docker compose up processing

# Troubleshooting import — debug is fine, ignore timings
OSM2PGSQL_LOG_LEVEL=debug OSM2PGSQL_NUMBER_PROCESSES=4 docker compose up processing
```

Local dev: `bun run processing-generate-command -- --osm2pgsql-log-level debug` (or interactive prompt) for the same troubleshooting use case.
