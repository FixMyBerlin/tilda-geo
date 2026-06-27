# About

Osmium tag-filter **profiles** are defined in [`topics.tagFilters.const.ts`](../constants/topics.tagFilters.const.ts) and applied per topic via [`tagFilterForProfile`](../steps/filter.ts). Expressions are passed inline to `osmium tags-filter` (no checked-in expression file).

Profiles: `relations` (admin boundaries + bicycle routes), `features` (amenity/shop/place/PT/tourism/leisure), `roadsBikelanes`, `barriers`, `landcover` (weekend), `parking` (bbox-limited).

**Osmium Bbox Filter** are used in [`bboxesFilter`](../steps/filter.ts).
When .env `PROCESS_ONLY_BBOX` is active, a per-topic bbox extract is created on top of the profile PBF.
Parking uses bbox-extract on the original download first, then the parking tag filter (Berlin + BiBi).
Generated bbox filter artifacts are never checked in.
