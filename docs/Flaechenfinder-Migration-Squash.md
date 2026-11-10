# Flächenfinder instance: move to the squashed migration

One-time runbook for **flaechenfinder.tilda-geo.de only**. The instance applied the 14
development migrations of `flaechenfinder-module` (`20260609104415_planning_module` …
`20261013090000_planning_user_datasets`). The code now has one migration
`20261103125637_space_finder` with the final names (`SpaceFinder*` tables, `space_finder`
result schema). This runbook brings the instance's database to that state without losing
study areas, variants, runs or result geometries.

Staging and production are not affected: they never had the old migrations and get the
squashed one through the usual `prisma migrate deploy` on app start.

## Why by hand

The instance deploys itself every 2 minutes from `flaechenfinder-module`
([Flaechenfinder-Instance-Processing.md](Flaechenfinder-Instance-Processing.md)), and the app
runs `prisma migrate deploy` on start. With the old database that would fail
(`spaceFinderEnabled` already exists) and the app would not start. So the database has to be
moved **before** the new code reaches the instance.

## What changes

[`Flaechenfinder-Migration-Squash.sql`](Flaechenfinder-Migration-Squash.sql), one transaction:

- Checks that all 14 old migrations are applied, otherwise aborts.
- Drops `PlanningArea.userGeojson` / `userGeojsonMode` (already copied into `userDatasets`
  as dataset `d1` by `20261013090000_planning_user_datasets`).
- Renames tables, enums, sequences, primary keys, foreign keys and indexes from
  `Planning*` to `SpaceFinder*`.
- Renames the `AuditLog.model` values, so the history of existing areas and variants stays
  attached to them.
- Renames the result schema `planning` → `space_finder` and drops the old tile functions
  `planning_*` (app and worker create `space_finder.space_finder_*` on start). Aborts if
  `space_finder` already exists, i.e. the new code started too early.
- Replaces the 14 rows in `prisma._prisma_migrations` with one row for
  `20261103125637_space_finder` (same as `prisma migrate resolve --applied`).

Tested locally on a copy built from develop + the 14 old migrations + sample rows:
afterwards `prisma migrate deploy` has nothing to apply, `prisma migrate status` is clean,
`prisma migrate diff` against `schema.prisma` is empty, and all rows and result geometries
are still there. The rollback SQL brings that copy back to a state the old code accepts
(no schema difference against the old `schema.prisma`), also with rows created in between.

Rehearsed on 2026-11-04 on a dump of the instance (29 areas, 45 variants, 113 runs,
5.5 million hexagons; no area had data only in `userGeojson`): the SQL and the rollback ran
without errors, row counts and a checksum over every row of areas, variants, runs and
hexagons were the same before, after the move and after the rollback, `prisma migrate status`
was up to date and `prisma migrate diff` against `schema.prisma` was empty.

## Steps

Run on the Flächenfinder server, in the deploy directory (where `docker-compose.yml` lives).

1. **Stop the autodeploy** so no new commit is deployed in between, and check that no
   processing run is due (Saturday 01:00 timer):

   ```bash
   sudo systemctl stop tilda-autodeploy.timer
   systemctl status tilda-autodeploy.service   # must not be "active (running)"; wait if it is
   systemctl list-timers tilda-processing
   ```

2. **Rename the worker in the build override.** The instance builds its images from
   `docker-compose.instance.yml` (next to `docker-compose.yml`, copied there by
   `infra-code/playbooks/deploy-tilda-instance.yml`; autodeploy does not touch it). It still
   names the old service. Without this change `docker compose build` fails on the missing
   `planning-worker.Dockerfile`, and `space-finder-worker` would be pulled from ECR instead
   of built:

   ```bash
   sed -i 's/planning-worker/space-finder-worker/g' docker-compose.instance.yml
   grep -n -A3 'space-finder-worker:' docker-compose.instance.yml   # dockerfile: ./space-finder-worker.Dockerfile
   ```

   Make the same change in `infra-code/files/docker-compose.instance.yml` (and the service
   list in `playbooks/pull-tilda-db.yml`), otherwise the next run of that playbook brings the
   old name back. `tilda-autodeploy.sh.j2` needs no change: it reads the services from the
   compose files. The volumes are now `space_finder_dem` and `space_finder_cir` (see
   "Old Docker volumes").

3. **Stop app and old worker** (the old worker would fail on the renamed tables):

   ```bash
   docker stop app planning-worker
   docker rm planning-worker
   ```

4. **Backup and counts.** A full dump of the app schema and the result schema, as a last
   resort (the normal way back is the rollback SQL below), and the counts to compare in step 6:

   ```bash
   docker exec db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -n prisma -n planning' \
     > ~/flaechenfinder-before-squash-$(date +%F).dump
   docker exec -i db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
   SELECT count(*) AS areas FROM prisma."PlanningArea";
   SELECT count(*) AS hexagons FROM planning.scenario_hexagons;
   SQL
   ```

5. **Run the SQL** (from a checkout of the PR branch, or copy the file to the server):

   ```bash
   docker exec -i db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1' \
     < docs/Flaechenfinder-Migration-Squash.sql
   ```

   NOTICEs about missing legacy functions are expected. Any ERROR rolls back everything;
   the database is then unchanged.

6. **Check**:

   ```bash
   docker exec -i db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
   SELECT migration_name FROM prisma._prisma_migrations ORDER BY migration_name DESC LIMIT 3;
   SELECT count(*) AS areas FROM prisma."SpaceFinderArea";
   SELECT count(*) AS hexagons FROM space_finder.scenario_hexagons;
   SQL
   ```

   The top row is `20261103125637_space_finder`; the counts match the ones from step 4.

7. **Deploy the new code**: merge/push the PR branch to `flaechenfinder-module`, then start
   the timer again. It builds the images and starts `app` and `space-finder-worker`:

   ```bash
   sudo systemctl start tilda-autodeploy.timer
   ```

8. **Smoke test**: open a region with the Flächenfinder, check that the Planungsgebiete
   are there and the hexagons of an existing variant show.
   `docker logs space-finder-worker` shows `space_finder schema + Martin functions ensured`.

9. **Run processing once.** The same code adds the nightly topic `entrances` and the column
   `_buildings.category`. The instance only processes by its Saturday timer, so start a run
   by hand. Until it is done, existing results show, but new runs fail because the worker
   reads these tables for the ÖPNV score:

   ```bash
   systemctl start --no-block tilda-processing
   journalctl -u tilda-processing -f   # follow until it finishes
   ```

   Then run a variant once and check that it completes.

## Old Docker volumes

The worker volumes were renamed from `planning_dem` / `planning_cir` to `space_finder_dem` /
`space_finder_cir`. The deploy creates the new ones empty. Nothing is lost if they stay empty:

- `space_finder_cir` is a download cache of the CIR aerial tiles. Empty, the worker downloads
  the tiles again on the next run of an area; only that first vegetation run takes longer.
- `space_finder_dem` is read only for `dem_source: "dgm1"` with hand-placed DGM1 GeoTIFFs. The
  app always uses `mapterhorn`, so it is normally unused.

Optional, before step 7: copy the CIR cache over. Compose puts the project name in front of the
volume names, so look them up first:

```bash
docker volume ls | grep -E 'planning_(dem|cir)'
docker volume create <project>_space_finder_cir
docker run --rm -v <project>_planning_cir:/from -v <project>_space_finder_cir:/to alpine cp -a /from/. /to/
```

Compose then warns that the volume "already exists but was not created by Docker Compose";
that is harmless.

After the smoke test, check that `planning_dem` holds no files you want to keep, then remove the
old volumes:

```bash
docker run --rm -v <project>_planning_dem:/dem alpine ls -la /dem
docker volume rm <project>_planning_dem <project>_planning_cir
```

A rollback with the old code uses the old volumes again, so remove them only once the new code
runs well.

## Rollback

[`Flaechenfinder-Migration-Squash-Rollback.sql`](Flaechenfinder-Migration-Squash-Rollback.sql)
reverses every rename, restores the 14 rows in `_prisma_migrations` and keeps all rows, also
those created after the move. The two dropped columns come back empty (the old code does not
read them).

1. Stop the autodeploy timer and `app` / `space-finder-worker` (as in steps 1 and 3).
2. Run the rollback SQL like step 5.
3. Deploy the old commit of `flaechenfinder-module` (revert the merge, push, start the timer).

The dump from step 4 is only for the case that the database itself is damaged.

## Checksum

The SQL inserts the checksum of `app/prisma/migrations/20261103125637_space_finder/migration.sql`
(`shasum -a 256`). If that file changes before the deploy, update the checksum in the SQL,
otherwise Prisma reports the migration as modified.
