import type { RegionGeoJsonBBox } from '@/server/regions/regionGeoJson'

const BBOX_KEYS = ['minlon', 'minlat', 'maxlon', 'maxlat'] as const

type ExportBbox = {
  minlon: number
  minlat: number
  maxlon: number
  maxlat: number
}

export type ResolveExportBboxResult =
  | { ok: true; bbox: ExportBbox; source: 'query' | 'region' }
  | { ok: false; error: string }

/**
 * Resolve export extent from optional query params or the region's configured bbox.
 *
 * Custom bbox query params (`minlon`/`minlat`/`maxlon`/`maxlat`) are a deprecated public API
 * and will eventually be restricted to admins only. Prefer region-slug URLs without bbox params;
 * the server loads the extent from region config.
 *
 * Do not use z.coerce.number().optional() for these params — empty string / null coerce to 0.
 */
export const resolveExportBbox = (
  searchParams: URLSearchParams,
  regionBbox: RegionGeoJsonBBox | null,
): ResolveExportBboxResult => {
  const raw = Object.fromEntries(
    BBOX_KEYS.map((key) => [key, searchParams.get(key)] as const),
  ) as Record<(typeof BBOX_KEYS)[number], string | null>

  const present = BBOX_KEYS.filter((key) => {
    const value = raw[key]
    return value != null && value !== ''
  })

  if (present.length === BBOX_KEYS.length) {
    const parsed = Object.fromEntries(
      BBOX_KEYS.map((key) => [key, Number(raw[key])] as const),
    ) as ExportBbox

    if (BBOX_KEYS.some((key) => !Number.isFinite(parsed[key]))) {
      return { ok: false, error: 'Bbox query params must be finite numbers' }
    }

    return { ok: true, bbox: parsed, source: 'query' }
  }

  if (present.length > 0) {
    return {
      ok: false,
      error: 'Provide all of minlon, minlat, maxlon, maxlat, or omit them to use the region bbox',
    }
  }

  if (regionBbox == null) {
    return { ok: false, error: 'Region has no bbox configured for export' }
  }

  const [minlon, minlat, maxlon, maxlat] = regionBbox
  return {
    ok: true,
    bbox: { minlon, minlat, maxlon, maxlat },
    source: 'region',
  }
}
