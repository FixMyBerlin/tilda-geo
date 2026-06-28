# About

Osmium tag-filter **profiles** are defined in [`topics.tagFilters.const.ts`](../constants/topics.tagFilters.const.ts) and applied per topic via [`tagFilterForProfile`](../steps/filter.ts). Expressions are passed inline to `osmium tags-filter` (no checked-in expression file).

Profiles: `relations`, `features`, `roadsBikelanes`, `barriers`, `landcover` (weekend), `parking` (documented minimum), `monolithicUnion` (all profiles — used by the parking topic for graph-complete inputs). Parking uses tag-filter on the full download first, then bbox extract (Berlin + BiBi).
Generated bbox filter artifacts are never checked in.
