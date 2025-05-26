# Mapillary Coverage

We want to be able to highlight ways that have a current mapillary coverage based on our own map data and using our styles.

Our current solution works as follows:

## a. Process the data

https://github.com/vizsim/mapillary_coverage/ fetches mapillary tiles for Mapillary sequences in Germany and matches them to OSM roads data.

The result (will be) a datasource of

- `osm_id` (Number)
- `mapillary_coverage` (Enum: `regular | pano`)

The processing is based on a fixed buffer. When 60 % of the way has mapillary coverage, we include it in the data.

## b. Store the data

- We download data from https://github.com/vizsim/mapillary_coverage/tree/main/output during initialization.
  - The download URL is defined in `processing/pseudoTags/mapillaryCoverageSource/source.const.ts`.
- The date of processing is stored in `app/src/data/mapillaryCoverage.const.ts`.

## c. Make the data accessible

- In `processing/topics/roads_bikelanes/roads_bikelanes.lua` we initialize the file.
- Inside the way-loop we read the file, transform it into a hash map and cache it.
- We can then lookup the current osm_id and extract the tags from the file.

## d. Use the data

- **Visualization:** We can now use the tag `mapillary_coverage=regular|pano` in our styles.
- **Campaigns:** We can filter our campaigns base on this tag.
