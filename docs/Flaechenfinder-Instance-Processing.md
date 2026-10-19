# Flächenfinder instance: deploy & trigger reprocessing

The Flächenfinder instance (`flaechenfinder.tilda-geo.de`, SSH alias `flaechenfinder`,
setup in `infra-code/tilda-flaechenfinder.vars.yml`) **deploys itself automatically**:
a systemd timer polls the `flaechenfinder-module` branch on GitHub every 2 minutes and
rebuilds/restarts on a new commit (`/usr/local/bin/tilda-autodeploy.sh`,
`infra-code/playbooks/tilda-autodeploy.yml`). A push to `flaechenfinder-module` is
enough for a code deploy.

**Data reprocessing does NOT run along with it** – autodeploy only rebuilds/restarts
the containers, it does not trigger a new processing run. Do that manually on the instance:

```bash
ssh flaechenfinder
cd /srv/tilda-geo
docker compose -f docker-compose.yml -f docker-compose.network.yml -f docker-compose.instance.yml \
  run --rm -e PROCESS_ONLY_BBOX="" -e SKIP_DOWNLOAD=1 -e PROCESS_ONLY_TOPICS=<topic> processing
```

- `PROCESS_ONLY_TOPICS=<topic>` limits the run to the affected topic (e.g. `parking`),
  otherwise the full nightly set runs.
- `SKIP_DOWNLOAD=1` if the PBF extract on the instance is already current (skips the download).
- Leave `PROCESS_ONLY_BBOX` empty if `process_only_bbox` in the instance vars is empty too
  (Germany-wide extract); otherwise set it to the same value as in the vars.

Full procedure incl. initial setup: `infra-code/playbooks/process-tilda-instance.yml`.

## Pitfall: `parking` is limited to bboxes in code

`parking` is the only topic with `bboxes` set
(`processing/constants/topics.const.ts`: Berlin, BiBi, Lörrach, Friedberg, München).
`resolveTopicInputFile` (`processing/steps/filter.ts`) cuts a `parking_extracted.osm.pbf`
from them before osm2pgsql – **even with an empty `PROCESS_ONLY_BBOX` and a Germany extract**.
For Germany-wide parking, set `bboxes: null` there; otherwise just add another bbox.
Env vars alone are not enough.

Test Germany-wide locally (default stack, repo root):

```bash
docker compose up -d db
PROCESS_GEOFABRIK_DOWNLOAD_URL=https://osm-internal.download.geofabrik.de/europe/germany-latest-internal.osm.pbf \
PROCESS_ONLY_TOPICS=parking PROCESS_ONLY_BBOX= \
SKIP_DOWNLOAD=0 WAIT_FOR_FRESH_DATA=0 SKIP_UNCHANGED=0 SKIP_WARM_CACHE=1 PROCESSING_DIFFING_MODE=off \
docker compose up processing
```

`SKIP_DOWNLOAD=0` because otherwise the old regional extract sits in the `osmfiles` volume.
`bun run processing` does not work here (the CLI requires a preset/`--only-bbox`).
Expect several hours, and raise `mem_limit`/`cpus` of the `processing` container in
`docker-compose.override.yml` (default 4 GB) if needed.

## Rebuild buildings (`_buildings`)

The same applies to `public._building_entrances` (building entrances, `entrance=*`): also built
from `landcover`, so it only exists after an explicit run. Until then
`PostgisLoader.load_building_entrances()` returns an empty GeoDataFrame.

`public._buildings` is not a topic of its own but part of **`landcover`**
(`schedule: 'weekend'`). This instance has **no cron job for processing** –
the only timer is `tilda-autodeploy.timer` (deploy only). So the weekend schedule never
kicks in here; `landcover` only runs when triggered explicitly.

```bash
ssh flaechenfinder
cd /srv/tilda-geo
# Remove the stale weekend PBF (see pitfall below), then:
docker compose -f docker-compose.yml -f docker-compose.network.yml -f docker-compose.instance.yml \
  run --rm -T \
  -e PROCESS_ONLY_BBOX= -e SKIP_DOWNLOAD=1 -e SKIP_UNCHANGED=0 \
  -e SKIP_WARM_CACHE=1 -e PROCESSING_DIFFING_MODE=off \
  -e PROCESS_ONLY_TOPICS=landcover processing
```

**Pitfall: the weekend PBF is silently reused.** `landcover` does not read the nightly PBF
but `filtered/weekend_filtered.osm.pbf` (its own tag filter, built from the download). It is
only regenerated when the download or filter expressions changed or the file is missing –
with `SKIP_DOWNLOAD=1`, `sourceFileChanged=false`, so an old file from an earlier regional
extract is reused and the buildings stay on the old extent. Check and delete if needed:

```bash
docker run --rm -v tilda-geo_osmfiles:/d alpine ls -la /d/filtered /d/downloads
docker run --rm -v tilda-geo_osmfiles:/d alpine rm -f /d/filtered/weekend_filtered.osm.pbf
```

Verify afterwards (the extent must cover Germany, not just one bbox):

```sql
SELECT count(*), round(min(ST_XMin(ST_Transform(geom,4326)))::numeric,2) AS minx,
       round(max(ST_XMax(ST_Transform(geom,4326)))::numeric,2) AS maxx
FROM public._buildings;
```

More notes: `processing/topics/landcover/README.md`, `planning-worker/ALKIS.md`.

## Enable the Flächenfinder per region

`spaceFinderEnabled` defaults to `false` for new regions (admin: "Flächenfinder aktiv"). The migration `region_space_finder_default_off` switches off all regions without a Planungsgebiet on deploy. If such a region on the instance should use the Flächenfinder, switch it back on in the admin afterwards.
