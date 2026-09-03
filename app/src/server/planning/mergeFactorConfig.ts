import type { Prisma } from '@/prisma/generated/client'

/** Variant assumptions without geometry (stored on PlanningVariant.factorConfig). */
export type VariantFactorConfig = {
  name?: string
  h3_resolution?: number
  dem_source?: 'srtm' | 'dgm1' | 'mapterhorn'
  weights?: Record<string, number>
  vegetation_direction?: 'positive' | 'negative'
  cir_source?: 'auto' | 'bayern' | 'bb' | 'hessen'
  max_cyclepath_dist_m?: number
  exclude_carriageways?: boolean
  intersection_radius_m?: number
  parken_radius_m?: number
  fussgaengerzone_radius_m?: number
  bestand_default_diameter_m?: number
  bewohnerbedarf_radius_m?: number
  bewohnerbedarf_saettigung_ew?: number
  min_score_threshold?: number
  /** Zielgröße der Flächensuche (m²), Client-Filter auf cluster_area_m2 — pro Variante. */
  min_area_m2?: number | null
}

/** Area geometry, use-case, size, and optional user obstacles (stored on PlanningArea). */
export type PlanningAreaInput = {
  studyArea: unknown
  userGeojson?: unknown
  userGeojsonMode?: string | null
  useCase: string
  areaSizeM2: number | null
  /** Zensus-Vorschlag für `bewohnerbedarf_saettigung_ew`, je Planungsgebiet einmal ermittelt. */
  censusSaettigungEw?: number | null
  censusEwPerHa?: number | null
}

/**
 * Fallback, wenn für das Gebiet kein Zensus-Vorschlag vorliegt (Data-Schema fehlt, unbewohntes
 * Gebiet). Muss `UseCaseConfig.bewohnerbedarf_saettigung_ew` in `flaechenfinder/config.py`
 * entsprechen — sonst rechnet der Worker mit einem anderen Wert als die UI anzeigt.
 */
export const FALLBACK_SAETTIGUNG_EW = 30

/**
 * Marker rund um `bewohnerbedarf_saettigung_ew`, die nur in der zusammengeführten Config leben:
 * Sie kommen aus dem Planungsgebiet, nicht aus der Variante, und dürfen deshalb nie in
 * `PlanningVariant.factorConfig` landen (sonst friert der Vorschlag als Nutzerwert ein).
 */
const AUTO_SAETTIGUNG_KEYS = [
  'bewohnerbedarf_saettigung_auto',
  'bewohnerbedarf_saettigung_auto_ew',
  'bewohnerbedarf_ew_pro_ha',
] as const

/** Flat dict consumed by the Python worker and planning UI (area + variant merged). */
export type MergedFactorConfig = VariantFactorConfig & {
  study_area?: object
  user_geojson?: object
  user_geojson_mode?: string
  use_case?: string
  area_size_m2?: number | null
  /** true, solange die Sättigung aus dem Zensus-Vorschlag stammt und nicht von Hand gesetzt wurde. */
  bewohnerbedarf_saettigung_auto?: boolean
  /** Der Vorschlag selbst — bleibt auch nach dem Überschreiben erhalten, damit die UI ihn nennen
   * und „zurück zum automatischen Wert" anbieten kann. */
  bewohnerbedarf_saettigung_auto_ew?: number | null
  /** Bruttodichte des Gebiets, rein erklärender Text im Hinweis. */
  bewohnerbedarf_ew_pro_ha?: number | null
}

export const mergeFactorConfig = (
  area: PlanningAreaInput,
  variantConfig: VariantFactorConfig,
): MergedFactorConfig => {
  // Die Sättigung steht nur dann in der Varianten-Config, wenn sie von Hand gesetzt wurde. Fehlt
  // sie, gilt der Zensus-Vorschlag des Planungsgebiets — so starten alle Varianten eines Gebiets
  // auf demselben Wert, und der Wert bleibt trotzdem als feste Zahl im Lauf-Snapshot stehen.
  const suggestion = area.censusSaettigungEw ?? null
  const isAuto = variantConfig.bewohnerbedarf_saettigung_ew == null && suggestion != null
  const merged: MergedFactorConfig = {
    ...variantConfig,
    bewohnerbedarf_saettigung_ew:
      variantConfig.bewohnerbedarf_saettigung_ew ?? suggestion ?? FALLBACK_SAETTIGUNG_EW,
    bewohnerbedarf_saettigung_auto: isAuto,
    bewohnerbedarf_saettigung_auto_ew: suggestion,
    bewohnerbedarf_ew_pro_ha: area.censusEwPerHa ?? null,
    study_area: area.studyArea as object,
    use_case: area.useCase,
    area_size_m2: area.areaSizeM2,
  }
  if (area.userGeojson != null) merged.user_geojson = area.userGeojson as object
  if (area.userGeojsonMode != null) merged.user_geojson_mode = area.userGeojsonMode
  return merged
}

/**
 * Bereinigt eine vom Client geschickte Varianten-Config vor dem Speichern: die Gebiets-Marker
 * fliegen immer raus, und solange der Client `bewohnerbedarf_saettigung_auto` meldet, auch die
 * Sättigung selbst — nur so bleibt „automatisch" ein Zustand und wird nicht beim ersten Speichern
 * einer beliebigen anderen Änderung zum eingefrorenen Nutzerwert.
 */
export const stripAutoSaettigung = (config: MergedFactorConfig): VariantFactorConfig => {
  const rest = { ...config } as Record<string, unknown>
  const wasAuto = rest.bewohnerbedarf_saettigung_auto === true
  for (const key of AUTO_SAETTIGUNG_KEYS) delete rest[key]
  if (wasAuto) delete rest.bewohnerbedarf_saettigung_ew
  return rest as VariantFactorConfig
}

export const areaInputFromRow = (row: {
  studyArea: Prisma.JsonValue
  userGeojson: Prisma.JsonValue | null
  userGeojsonMode: string | null
  useCase: string
  areaSizeM2: number | null
  censusSaettigungEw?: number | null
  censusEwPerHa?: number | null
}): PlanningAreaInput => ({
  studyArea: row.studyArea,
  userGeojson: row.userGeojson ?? undefined,
  userGeojsonMode: row.userGeojsonMode,
  useCase: row.useCase,
  areaSizeM2: row.areaSizeM2,
  censusSaettigungEw: row.censusSaettigungEw ?? null,
  censusEwPerHa: row.censusEwPerHa ?? null,
})
