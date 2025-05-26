# Mapillary Coverage

We want to be able to highlight ways that have a current mapillary coverage based on our data source and styles.

Our current solution works as follows:

## a. Process the data

https://github.com/vizsim/mapillary_coverage/ fetches mapillary tiles for Mapillary sequences in Germany and matches them to OSM roads data.

The result (will be) a datasource of

- `osm_id` (Number)
- `mapillary_coverage` (Enum: `regular | pano`)

The processing is based on a fixed buffer. When 60 % of the way has mapillary coverage, we include it in the data.

## b. Store the data

- We download data from https://github.com/vizsim/mapillary_coverage/tree/main/output during .
- The date of processing is stored in `app/src/data/mapillaryCoverage.const.ts`.

## c. Make the data accessible

`processing/custom_functions/copy_mapillary_coverage_tags.sql` copies the data from `data.mapillary_coverage`. See `PERFORM copy_mapillary_coverage_tags` in `processing/topics/roads_bikelanes/roads_bikelanes.sql` for example.

## d. Use the data

- **Visualization:** We can now use the tag `mapillary_coverage=regular|pano` in our styles.
- **Campaigns:** However, we can not use the data easily in our campaigns because all decisions are done in LUA which does not have access to this data.
