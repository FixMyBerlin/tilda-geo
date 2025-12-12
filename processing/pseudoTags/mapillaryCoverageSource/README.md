# Mapillary Coverage

We want to be able to highlight ways that have a current mapillary coverage based on our own map data and using our styles.

Our current solution works as follows:

## a. Process the data

https://github.com/vizsim/mapillary_coverage/tree/feature/docker-notebook fetches mapillary tiles for Mapillary sequences in Germany and matches them to OSM roads data.

The result (will be) a datasource of

- `osm_id` (Number)
- `mapillary_coverage` (Enum: `regular | pano`)

The processing is based on a fixed buffer. When 60 % of the way has mapillary coverage, we include it in the data.

## b. Store the data

- We download data from https://github.com/vizsim/mapillary_coverage/tree/feature/docker-notebook/output during initialization.
  - The download URLs are defined in `source.const.ts`.
- The dates of processing (Mapillary and OSM data dates) are stored in the database table `data.mapillary_coverage_metadata`.
  - See `/docs/mapillary-coverage` for display of these dates.
- Change detection:
  - Dates are compared with the database to detect new data
  - CSV file changes are detected via directory hash

## c. Make the data accessible

- In `processing/topics/roads_bikelanes/roads_bikelanes.lua` we initialize the file.
- Inside the way-loop we read the file, transform it into a hash map and cache it.
- We can then lookup the current osm_id and extract the tags from the file.

## d. Use the data

- **Visualization:** We can now use the tag `mapillary_coverage=regular|pano` in our styles.
- **MapRoulette:** We can filter our campaigns base on this tag.
- **Map:** https://www.osm-verkehrswende.org/mapillary/map/ is based on the map from TILDA
- **Routing:** https://vizsim.github.io/missing_mapillary_gh-routing/?map=13.5/52.492/13.312&start=52.5113/13.3013&end=52.4718/13.3281&profile=bike_customizable&mapillary_weight=0.05&missingStreets=1 uses the background map from TILDA and uses the source data as part of the routing graph calculation
