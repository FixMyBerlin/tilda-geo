/** From this zoom and above we deliver the original geometries (overzoom in sources uses this as maxzoom). */
export const SIMPLIFY_MAX_ZOOM = 14 as const

/** Map disallows zoom below this; geometries are simplified from this zoom onward. */
export const SIMPLIFY_MIN_ZOOM = 4 as const
