# Tile Cache

## Setup

We use Nginx as a reverse proxy to cache tiles produced by the Martin Tile Server.
Code: [`configs/nginx.conf`](/configs/nginx.conf)

- We rely on our daily processing and cache warming to refresh the cache once a day
- Nginx caches tiles for 12 hours and does **not** revalidate during that time
- After 1 hour, the user's browser checks for fresh data using `ETag` (via `must-revalidate`)
  - If the content hasn't changed, the server returns `304 Not Modified`
  - If the content has changed (after the daily cache flush), the new tile is returned

## Cache Warming

In [`processing/steps/cache.ts`](/processing/steps/cache.ts), we remove the tile cache once fresh data has been processed. Since the tile server produces tiles on-the-fly from a PostgreSQL database, this could lead to high load on first access.

To avoid this, the script executes [`warmCache.ts`](/app/src/app/api/private/warm-cache/warmCache.ts), which pre-generates the most frequently used tiles — particularly those at low zoom levels that are more computationally expensive.

The `cacheWarming` config in [`regions.const.ts`](/app/src/data/regions.const.ts) defines which layers and geographic bounds to pre-warm.
