# QA map status: payload and caching

How QA mode colors ~23.5k polygons without putting private judgements into public vector tiles.

## Contents

- [The constraint](#the-constraint)
- [How it works today](#how-it-works-today)
- [Decision](#decision)
- [Details panel](#details-panel)
- [Optimistic cache splice](#optimistic-cache-splice)

Numbers below were measured on the local dev database against the production import, config `euvm-parkraum-2025-aussen` (`public.qa_parkings_euvm`), on 2026-09-03.

## The constraint

Two datasets meet on one map:

| Data                                                                         | Where it lives                                             | Who may see it      |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------- |
| Voronoi geometry + reference/current counts                                  | Public vector tiles                                        | Everyone            |
| System decision (`GOOD` / `NEEDS_REVIEW` / `PROBLEMATIC`) and user decisions | `prisma."QaEvaluation"`, via an authorized server function | Region members only |

Counts are public aggregates of OSM data. The judgement is not. Putting `systemStatus` on the map table so it rides in the tile is the cheapest paint path, but tile endpoints are public and unauthenticated, so it is rejected. Geometry stays in tiles; status is fetched separately and applied with `setFeatureState`.

## How it works today

The payload is `qaDataForMapQueryOptions` in [`regionQueryOptions.ts`](../app/src/server/regions/regionQueryOptions.ts), re-exported as `qaMapDataQueryOptions` from [`useQaMapData.ts`](../app/src/components/regionen/pageRegionSlug/hooks/mapState/useQaMapData.ts):

```text
queryKey: ['qa-configs', 'getQaDataForMap', { configSlug, regionSlug, userIds, search }]
staleTime: STALE_TIME_LONG_CACHE_MS // 1 hour
gcTime: GC_TIME_QA_MAP_MS // Infinity — keep after leaving QA
```

[`qa.tsx`](../app/src/routes/regionen/$regionSlug/qa.tsx) primes the same key on navigation (without free-text `search`, so typing does not re-run the loader). The client query includes `search` from the URL.

[`getQaDataForMap.server.ts`](../app/src/server/qa-configs/queries/getQaDataForMap.server.ts) returns the latest evaluation per area as `{ areaId, systemStatus, userStatus }` (enums collapsed to letters). `GOOD` with no user decision is omitted on the unfiltered payload — that is the map default. Search or a user filter returns matches in full, including Gut, so absence there means “not in this result”, not Gut.

| Measurement                                | Full latest-per-area | Sent (exceptions only) |
| ------------------------------------------ | -------------------- | ---------------------- |
| Rows                                       | 23,575               | 2,159                  |
| Uncompressed JSON                          | 1,491 kB             | ~137 kB                |
| Rows carrying a user decision              | 1,053 (4.5%)         | included               |
| Rows that are `GOOD` with no user decision | 21,416 (90.8%)       | omitted                |

The `status` filter is **not** in the query key; `qaMapRowMatchesStatus` applies it on the render path. `users` and `search` **are** in the key, so those changes refetch (and with `gcTime: Infinity`, unused variants stay until the tab closes).

`useQaMapData` builds an `areaId → row` `Map` once per payload. [`useQaMapState`](../app/src/components/regionen/pageRegionSlug/hooks/mapState/useQaMapState.ts) `syncQaFeatureStates` does a hash lookup per rendered polygon (`O(rendered)`), including the re-sync `RegionMap` triggers from `<Map onSourceData>` when `qa-source` tiles finish loading in QA mode.

Notes and review-list queries keep the v5 default `gcTime` (5 minutes) and `STALE_TIME_NOTES_MS` (1 minute). OSM notes load through [`osmNotesQueryOptions.ts`](../app/src/components/regionen/pageRegionSlug/modes/notes/osmNotesQueryOptions.ts) / [`useOsmNotesQuery.ts`](../app/src/components/regionen/pageRegionSlug/modes/notes/useOsmNotesQuery.ts) (bbox in the query key), not a dedicated notes Zustand merge store.

## Decision

Keep the dual setup. Index the payload (`areaId → row`) and send only exceptions.

1. Lookup is `O(rendered)`.
2. `gcTime: Infinity` so leaving the mode does not drop the payload.
3. Optimistic splice writes the unfiltered cache (see below).
4. Omit `GOOD` + no user decision. Named default is `QA_MAP_DEFAULT_STATUS` (`G`, no user letter). `useQaMapState` writes that when the area is missing **and** the payload is complete (no user/search subset). Paint still falls back to gray for filtered-out / not-yet-synced areas — putting Gut in the paint fallback would flash every polygon green under the default »Zu prüfen« filter before feature state lands.

On the map, unevaluated and Gut look the same until the details panel. Nightly processing evaluates every area, so this is brief only for a newly added area.

**Rejected alternatives (not building):** fetching status by viewport (a cache key per bbox, which is what OSM notes do, refetches overlap on every pan; or an accumulating client store with coverage bookkeeping — nothing in this codebase merges that way, and first paint would pop). An authenticated tile proxy would collapse the dual setup but needs per-user tile cache, processing writing user decisions into the map table, and loses the shared public tile cache.

## Details panel

The details panel does **not** use the map payload. [`QaDetail.tsx`](../app/src/components/regionen/pageRegionSlug/modes/qa/detail/QaDetail.tsx) loads `getQaEvaluationsForArea` and `getQaDecisionDataForArea` per selected area.

| State         | What you see                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| Evaluated Gut | »Aktuelle Bewertung« with the green **Gut** pill (`QaEvaluationCard`)                                    |
| Unevaluated   | No evaluation card; counts may still show from the map table; primary action is **Bewertung hinzufügen** |

Omitting Gut from the map payload does not change that.

## Optimistic cache splice

`QaDetail` snapshots the current row and feature-state in `onMutate`, then splices with `upsertQaMapDataRow` / `restoreQaMapDataRow` (`useQaMapData.ts`). That cache entry is the **unfiltered** payload; `useQaMapState` applies `qaMapRowMatchesStatus` per rendered feature. Writing a status-filtered subset would shrink the cache under the default `pending-needs-review` filter, and switching to »Alle Status« would leave most areas uncolored until stale.
