# `processing` README

## Monorepo

Please read the [README](../README.md) first.

## About

The processing downloads the OpenStreetMap (OSM) data, filters and processes it into a PostgreSQL/PostGIS database, which is then made available as vector tiles with [`martin`](https://github.com/maplibre/martin).

The data is selected and optimized to make planning of bicycle infrastructure easier.

## Orchestration

We use Bun and [Bun Shell](https://bun.sh/docs/runtime/shell) to orchestrate the commands needed to fetch, filter, process and post-process the data and trigger post-processing hooks.
See [`index.ts`](./index.ts) for more.

## Freshness

### Freshness of source data

We use the [public Germany export from Geofabrik](https://download.geofabrik.de/europe/germany.html) which includes OSM Data up until ~20:00 h of the previous day. All processing is done on this dataset.

### Freshness of processed data

- Data is processed every day ([cron job definition](/.github/workflows/generate-tiles.yml#L3-L6))
- Data is processed on every deploy/release

## Preview

### Martin catalogue and preview

See https://github.com/FixMyBerlin/tilda-geo/blob/develop/processing/utils/logging.ts#L31-L40 for a list URLs to see the data that Martin provides.

## Development

### Preparation

- [Install bun](https://bun.sh/docs/installation)
- Run `bun install` in `./processing`

### Run the whole system

The workflow is…

1. Edit the files locally

2. Rebuild and restart everything

   Frist, make sure you are in the root folder of this repo.

   ```sh
   docker compose build && docker compose up
   ```

3. Inspect the new results, see "Inspect changes"

> **Note**
> Our [development docker compose](../docker-compose.override.yml) add two `volumens` which means in most cases, we don't need to run `docker compose build`.

> **Note**
> Learn more about the file/folder-structure and coding patterns in [`processing/topics/README.md`](/processing/topics/README.md)

### Processing: Run changes only

With `SKIP_UNCHANGED=1` we compare the hashes of all `.lua` and `.sql` files to the last run per topic.
During [`run-5-process.sh`](processing/run-5-process.sh) we only run code if the respective hash has changed.
If any helper in (`topics/helper`)[processing/topics/helper] or the OSM file has changed, we rerun everything.

Whenever we talk about `hash`es in this code, this feature is referenced.

### Processing: Inspect changes

With `PROCESSING_DIFFING_MODE=previous` or `PROCESSING_DIFFING_MODE=fixed` the system will create `public.<tablename>_diff` tables that contain only changed entries.

It will compare the `tags` column to the previous run.

Whenever we talk about `diff`s in this code, this feature is referenced.

The `PROCESSING_DIFFING_BBOX` bbox (required when diffing is on) specifies which area is used for the diff. This allows to reduce the data size of the diff.

#### Reference

- With `PROCESSING_DIFFING_MODE=previous` you see the changes to the last run on every run
- With `PROCESSING_DIFFING_MODE=fixed` you see the changes to the last reference-run, allowing you to compare your changes to a certain version of your data.
  The reference will be the last time you ran with `PROCESSING_DIFFING_MODE=previous`.
  With `fixed` the system will **not** update the `diffing_reference.<tablename>` tables.

To run everything without code caching and diffing set `SKIP_UNCHANGED=0` and `PROCESSING_DIFFING_MODE=off`.

### Process only a single object

For the development process it's often useful to run the processing on a single object.
For that you can specify an id (list) as `ID_FILTER` in the [`processing/run-3-filter.sh`](/processing/run-3-filter.sh).
See the [osmium-docs](https://docs.osmcode.org/osmium/latest/osmium-getid.html) for more information.

### Process only certain topics and certain bbox

- Use `PROCESS_ONLY_TOPICS=parking` to only run the "parking" topic.
  Format: "topic1,topic2".
  This can be used during development to speed up the process.

- Use `PROCESS_ONLY_BBOX=13.4178,52.4681,13.4550,52.4817` to only process data withing this bbox.
  Format: MINLON,MINLAT,MAXLON,MAXLAT.
  This can be used during development to speed up the process.
  Best to use this with `PROCESS_ONLY_TOPICS` because it will create a filtered source for each topic.

## Tests

We use the luarocks package [busted](https://lunarmodules.github.io/busted/) as our testing framework.

To run the tests manually:

```
./processing/run-tests.sh // from the root of the project
```

Additionally all tests are being run in the [husky](https://typicode.github.io/husky/) [pre-push](../app/.husky/pre-push) hook.

**Conventions:**

- Create one test file per helper
- Filename has to be `\*.test.lua`
- Place it in a `__tests__` folder next to the file

**Good to know:**

- To use the `Log` helper (`require("Log")`) to inspect and print data ([Docs](https://github.com/kikito/inspect.lua?tab=readme-ov-file#installation))

## Deployment

1. First https://github.com/FixMyBerlin/tilda-geo/actions runs.
2. Server (IONOS) runs the processing one table at a time.
   The whole processing takes about 1.5 h.
   See [`index.ts`](./index.ts) for details.

# 💛 Thanks to

- Thank you [osm2pgsql](https://osm2pgsql.org/)
- Thank you [Geofabrik](https://download.geofabrik.de/)

The first iteration of the processing pipeline was inspired by [gislars/osm-parking-processing](https://github.com/gislars/osm-parking-processing)
