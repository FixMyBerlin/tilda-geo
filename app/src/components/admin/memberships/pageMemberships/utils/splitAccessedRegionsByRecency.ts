import type { AccessedRegionType } from '@/server/users/schema'

/**
 * Splits a user's accessed regions into "recent" (accessed on or after `cutoffAt`) and
 * "older" entries, both sorted most-recently-accessed first.
 *
 * `cutoffAt` must be a stable value computed once (e.g. on the server, in the loader) rather
 * than `Date.now()` during render — otherwise the split would differ between the SSR render
 * and the client hydration render, causing a hydration mismatch.
 */
export function splitAccessedRegionsByRecency(
  accessedRegions: AccessedRegionType[],
  cutoffAt: Date | number,
) {
  const cutoffTime = cutoffAt instanceof Date ? cutoffAt.getTime() : cutoffAt

  const sorted = [...accessedRegions].sort(
    (a, b) => b.lastAccessedDay.getTime() - a.lastAccessedDay.getTime(),
  )

  return {
    recent: sorted.filter((region) => region.lastAccessedDay.getTime() >= cutoffTime),
    older: sorted.filter((region) => region.lastAccessedDay.getTime() < cutoffTime),
  }
}
