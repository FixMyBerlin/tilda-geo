/** Internal / atlas notes and other frequently changing note data. */
export const STALE_TIME_NOTES_MS = 60 * 1000

/** QA configs, uploads list, processing metadata, region index — rarely change. */
export const STALE_TIME_LONG_CACHE_MS = 60 * 60 * 1000

/**
 * Unused-cache retention for the QA map payload (~1.5 MB). Must be ≥ staleTime; the v5 default
 * (5 min) would drop still-fresh data after leaving the mode. Infinity = rest of the tab session.
 */
export const GC_TIME_QA_MAP_MS = Infinity
