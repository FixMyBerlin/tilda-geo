import type { LngLatBounds } from 'maplibre-gl'
import type { FactorConfig } from '@/server/planning/planning.functions'

// Default factor template (mirrors flaechenfinder/config.py USE_CASE_FAHRRADBOX).
// `study_area` is filled in at creation time from the current map view.
export const FAHRRADBOX_TEMPLATE: Omit<FactorConfig, 'study_area'> = {
  name: 'Fahrradbox',
  h3_resolution: 13,
  dem_source: 'srtm',
  weights: {
    w_cyclepath: 0.2,
    w_surface: 0.2,
    w_target: 0.15,
    w_slope: 0.2,
    w_clearance: 0.1,
    w_transit: 0.15,
    w_vegetation: 0,
    w_intersection: 0.1,
    w_parken: 0.1,
  },
  vegetation_direction: 'negative',
  cir_source: 'auto' as const,
  max_cyclepath_dist_m: 150,
  min_clearance_m: 2.0,
  min_surface_score: 30,
  intersection_radius_m: 20,
  parken_radius_m: 15,
  targets: [],
}

export const WEIGHT_LABELS: Record<string, string> = {
  w_cyclepath: 'Radwegnähe',
  w_surface: 'Untergrund',
  w_target: 'Zielorte',
  w_slope: 'Hangneigung',
  w_clearance: 'Hindernisfreiheit',
  w_transit: 'ÖPNV',
  w_vegetation: 'Vegetation',
  w_intersection: 'Kreuzungen',
  w_parken: 'Parken (Umwidmung)',
}

// Factor → probability grouping (Issue #3415). The weight sliders and the
// per-hexagon sidebar breakdown are grouped by these two categories. Must stay in
// sync with the backend split in flaechenfinder/scorer.py (_group_score):
//   Bedarf   → ÖPNV, Zielorte
//   Bebauung → Radwegnähe, Untergrund, Hangneigung, Hindernisfreiheit + Modifier
//              (Vegetation, Kreuzungen, Parken)
export const WEIGHT_GROUPS: { key: 'bedarf' | 'bebauung'; label: string; weights: string[] }[] = [
  { key: 'bedarf', label: 'Bedarf', weights: ['w_transit', 'w_target'] },
  {
    key: 'bebauung',
    label: 'Bebauung',
    weights: [
      'w_cyclepath',
      'w_surface',
      'w_slope',
      'w_clearance',
      'w_vegetation',
      'w_intersection',
      'w_parken',
    ],
  },
]

// Build a GeoJSON Polygon (EPSG:4326) from current map bounds, used as study_area.
export function boundsToPolygon(bounds: LngLatBounds) {
  const w = bounds.getWest()
  const s = bounds.getSouth()
  const e = bounds.getEast()
  const n = bounds.getNorth()
  return {
    type: 'Polygon' as const,
    coordinates: [
      [
        [w, s],
        [e, s],
        [e, n],
        [w, n],
        [w, s],
      ],
    ],
  }
}
