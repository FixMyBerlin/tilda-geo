import type { LngLatBounds } from 'maplibre-gl'
import type { FactorConfig } from '@/server/planning/planning.functions'

// Default factor template (mirrors flaechenfinder/config.py USE_CASE_FAHRRADBOX). Used as the
// starting point for all Planungsmodus-Anwendungsfälle (PLANNING_USE_CASES) — der Worker
// unterscheidet fachlich noch nicht zwischen ihnen, die Gewichte sind bewusst identisch.
// `study_area` is filled in at creation time from the current map view.
export const DEFAULT_FACTOR_TEMPLATE: Omit<FactorConfig, 'study_area'> = {
  name: 'Fahrradbox',
  h3_resolution: 13,
  dem_source: 'srtm',
  weights: {
    w_cyclepath: 0.2,
    w_surface: 0.2,
    w_target: 0.15,
    w_slope: 0.2,
    w_transit: 0.15,
    w_vegetation: 0,
    w_intersection: 0.1,
    w_parken: 0.1,
    w_fussgaengerzone: 0.2,
    w_bestand: 0,
  },
  vegetation_direction: 'negative',
  cir_source: 'auto' as const,
  max_cyclepath_dist_m: 50,
  min_surface_score: 30,
  intersection_radius_m: 20,
  parken_radius_m: 15,
  fussgaengerzone_radius_m: 20,
  bestand_default_diameter_m: 20,
  targets: [],
}

// Anwendungsfälle für Schritt 2 des Planungsassistenten ("Art & Größe der gesuchten Fläche").
// `defaultAreaM2` ist die vorbelegte Flächengröße; bei „Sonstiges“ gibt es keinen Default, die
// Größe wird frei eingegeben. Die Fläche wird aktuell nur im factorConfig mitgespeichert
// (passthrough) und noch nicht vom Worker ausgewertet — Vorbereitung für die künftige
// automatische Flächensuche.
export type PlanningUseCase =
  | 'fahrradbox'
  | 'fahrradabstellanlage'
  | 'mobilitaetsstation'
  | 'sonstiges'

export const PLANNING_USE_CASES: {
  key: PlanningUseCase
  label: string
  defaultAreaM2: number | null
}[] = [
  { key: 'fahrradbox', label: 'Fahrradboxen', defaultAreaM2: 2 },
  { key: 'fahrradabstellanlage', label: 'Fahrradabstellanlage', defaultAreaM2: 20 },
  { key: 'mobilitaetsstation', label: 'Mobilitätsstationen', defaultAreaM2: 50 },
  { key: 'sonstiges', label: 'Sonstiges', defaultAreaM2: null },
]

export const WEIGHT_LABELS: Record<string, string> = {
  w_cyclepath: 'Radwegnähe',
  w_surface: 'Untergrund',
  w_target: 'Zielorte',
  w_slope: 'Hangneigung',
  w_transit: 'ÖPNV',
  w_vegetation: 'Vegetation',
  w_intersection: 'Kreuzungen',
  w_parken: 'Parken (Umwidmung)',
  w_fussgaengerzone: 'Fußgängerzonen',
  w_bestand: 'Bestandsanlagen',
}

// Factor → probability grouping (Issue #3415). The weight sliders and the
// per-hexagon sidebar breakdown are grouped by these two categories. Must stay in
// sync with the backend split in flaechenfinder/scorer.py (_group_score):
//   Bedarf   → Radwegnähe, ÖPNV, Zielorte + Modifier Fußgängerzonen (Zuschlag)
//              und Bestandsanlagen (Abzug)
//   Bebauung → Untergrund, Hangneigung + Modifier
//              (Vegetation, Kreuzungen, Parken)
export const WEIGHT_GROUPS: { key: 'bedarf' | 'bebauung'; label: string; weights: string[] }[] = [
  {
    key: 'bedarf',
    label: 'Bedarf',
    weights: ['w_cyclepath', 'w_transit', 'w_target', 'w_fussgaengerzone', 'w_bestand'],
  },
  {
    key: 'bebauung',
    label: 'Bebauung',
    weights: ['w_surface', 'w_slope', 'w_vegetation', 'w_intersection', 'w_parken'],
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
