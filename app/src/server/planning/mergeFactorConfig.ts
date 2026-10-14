import { StoredUserDatasetsSchema, type UserDataset } from '@/lib/planningUserGeojson'
import type { Prisma } from '@/prisma/generated/client'

/** Variant assumptions without geometry (stored on PlanningVariant.factorConfig). */
export type VariantFactorConfig = {
  name?: string
  /** Stärke (0–1) je Eigene-Daten-Datensatz, Schlüssel = `UserDataset.id`. Wirkt nur bei den
   * Modi Bonus/Abzug; Name, Modus und Geometrie gehören zum Planungsgebiet. */
  eigendaten_weights?: Record<string, number>
  h3_resolution?: number
  dem_source?: 'srtm' | 'dgm1' | 'mapterhorn'
  weights?: Record<string, number>
  vegetation_direction?: 'positive' | 'negative'
  platz_direction?: 'positive' | 'negative'
  cir_source?: 'auto' | 'bayern' | 'bb' | 'hessen'
  max_cyclepath_dist_m?: number
  exclude_carriageways?: boolean
  intersection_radius_m?: number
  parken_radius_m?: number
  fussgaengerzone_radius_m?: number
  bestand_default_diameter_m?: number
  bewohnerbedarf_radius_m?: number
  bewohnerbedarf_saettigung_ew?: number
  /** Verhältnis der vier Zielort-Kategorien zueinander in Prozent (Summe 100) — wirkt nur
   * innerhalb des Faktors `w_target`, siehe `zielortShares.ts` und `scorer.py`. Fehlt das Feld
   * (Varianten von vor der Kategorie-Gewichtung), gilt Gleichverteilung. */
  zielort_category_shares?: Record<string, number>
  /** Verhältnis von ÖPNV zu Bikesharing zueinander in Prozent (Summe 100) — wirkt nur innerhalb
   * des Faktors `w_transit`, siehe `oepnvShares.ts` und `scorer.py`. Fehlt das Feld (Varianten
   * von vor der Kategorie-Gewichtung), gilt 50/50 — ANDERS als bei `zielort_category_shares`
   * NICHT der Stand von vor der Umstellung (siehe Kommentar in `oepnvCategories.ts`). */
  oepnv_category_shares?: Record<string, number>
  min_score_threshold?: number
  /** Zielgröße der Flächensuche (m²), Client-Filter auf cluster_area_m2 — pro Variante. */
  min_area_m2?: number | null
}

/** Area geometry, use-case, size, and optional user obstacles (stored on PlanningArea). */
export type PlanningAreaInput = {
  studyArea: unknown
  userDatasets?: UserDataset[]
  useCase: string
  areaSizeM2: number | null
  /** Zensus-Vorschlag für `bewohnerbedarf_saettigung_ew`, je Planungsgebiet einmal ermittelt. */
  censusSaettigungEw?: number | null
  censusEwPerHa?: number | null
}

/**
 * Fallback, wenn für das Gebiet kein Zensus-Vorschlag vorliegt (Data-Schema fehlt, unbewohntes
 * Gebiet). Muss `UseCaseConfig.bewohnerbedarf_saettigung_ew` in `flaechenfinder/config.py`
 * und `FALLBACK_SAETTIGUNG_EW` in `planning-worker/merge_factor_config.py` entsprechen — sonst
 * rechnet der Worker mit einem anderen Wert als die UI anzeigt.
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
  user_datasets?: UserDataset[]
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

/** Spiegel von `merge_factor_config` in `planning-worker/merge_factor_config.py` (Fallback 30). */
export const mergeFactorConfig = (area: PlanningAreaInput, variantConfig: VariantFactorConfig) => {
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
  // `variantConfig` kann ein alter Snapshot mit Gebietsfeldern sein — das Gebiet gewinnt immer.
  if (area.userDatasets != null && area.userDatasets.length > 0)
    merged.user_datasets = area.userDatasets
  else delete merged.user_datasets
  return merged
}

/**
 * Hebt einen Lauf-Snapshot aus der Zeit mit nur einem Eigene-Daten-Upload (`user_geojson`,
 * `user_geojson_mode`, `weights.w_eigendaten`) auf die heutige Form (`user_datasets` +
 * `eigendaten_weights`, Datensatz-ID `d1` wie in der Migration). Neue Snapshots bleiben
 * unverändert. Nur die App liest alte Snapshots; der Worker rechnet immer mit der aktuellen Config.
 */
export const normalizeLegacyEigendaten = <T extends MergedFactorConfig | VariantFactorConfig>(
  config: T,
) => {
  const record = config as Record<string, unknown>
  const legacy = record.user_geojson
  const weights = (record.weights ?? {}) as Record<string, number>
  const hasLegacyWeight = 'w_eigendaten' in weights
  if (legacy == null && !hasLegacyWeight) return config

  const { user_geojson: _g, user_geojson_mode: _m, weights: _w, ...rest } = record
  const { w_eigendaten, ...restWeights } = weights
  const next: Record<string, unknown> = { ...rest }
  // Ein leeres `weights` bliebe sonst als `{}` stehen und unterschiede sich von „nicht gesetzt“.
  if (Object.keys(restWeights).length > 0) next.weights = restWeights
  if (legacy != null && next.user_datasets == null) {
    next.user_datasets = [
      {
        id: 'd1',
        name: 'Eigene Daten',
        mode: (record.user_geojson_mode as string | undefined) ?? 'bonus',
        geojson: legacy,
      },
    ]
    if (next.eigendaten_weights == null && w_eigendaten != null)
      next.eigendaten_weights = { d1: w_eigendaten }
  }
  return next as T
}

/**
 * Bereinigt eine vom Client geschickte Varianten-Config vor dem Speichern: die Gebiets-Marker
 * fliegen immer raus, und solange der Client `bewohnerbedarf_saettigung_auto` meldet, auch die
 * Sättigung selbst — nur so bleibt „automatisch" ein Zustand und wird nicht beim ersten Speichern
 * einer beliebigen anderen Änderung zum eingefrorenen Nutzerwert.
 */
export const stripAutoSaettigung = (config: MergedFactorConfig) => {
  const rest = { ...config } as Record<string, unknown>
  const wasAuto = rest.bewohnerbedarf_saettigung_auto === true
  for (const key of AUTO_SAETTIGUNG_KEYS) delete rest[key]
  if (wasAuto) delete rest.bewohnerbedarf_saettigung_ew
  return rest as VariantFactorConfig
}

/** Startstärke eines neuen Eigene-Daten-Datensatzes (10 Punkte), damit er sofort wirkt. */
export const DEFAULT_EIGENDATEN_WEIGHT = 0.1

/**
 * Gleicht `eigendaten_weights` einer Varianten-Config mit den Datensätzen des Gebiets ab:
 * Stärken entfernter Datensätze fliegen raus, neue Datensätze bekommen `DEFAULT_EIGENDATEN_WEIGHT`,
 * vorhandene Werte (auch 0) bleiben. Ohne Datensätze fehlt das Feld ganz.
 */
export const syncEigendatenWeights = <T extends VariantFactorConfig>(
  config: T,
  datasets: Pick<UserDataset, 'id'>[] | undefined,
) => {
  const current = config.eigendaten_weights ?? {}
  const next = Object.fromEntries(
    (datasets ?? []).map(({ id }) => [id, current[id] ?? DEFAULT_EIGENDATEN_WEIGHT]),
  )
  return { ...config, eigendaten_weights: Object.keys(next).length > 0 ? next : undefined }
}

export const areaInputFromRow = (row: {
  studyArea: Prisma.JsonValue
  /** Prisma-JSON oder schon mit `StoredUserDatasetsSchema` gelesen. */
  userDatasets: unknown
  useCase: string
  areaSizeM2: number | null
  censusSaettigungEw?: number | null
  censusEwPerHa?: number | null
}) => ({
  studyArea: row.studyArea,
  userDatasets: StoredUserDatasetsSchema.parse(row.userDatasets),
  useCase: row.useCase,
  areaSizeM2: row.areaSizeM2,
  censusSaettigungEw: row.censusSaettigungEw ?? null,
  censusEwPerHa: row.censusEwPerHa ?? null,
})
