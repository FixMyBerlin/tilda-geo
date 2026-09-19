import {
  mergeFactorConfig,
  type MergedFactorConfig,
  type PlanningAreaInput,
  stripAutoSaettigung,
  type VariantFactorConfig,
} from './mergeFactorConfig'

type FactorLike = MergedFactorConfig | VariantFactorConfig | null | undefined

/** Gebietsfelder — eigener Fingerprint, weil `stale` sowohl Gebiet- als auch Faktor-Writes setzt. */
const AREA_KEYS = [
  'study_area',
  'user_geojson',
  'user_geojson_mode',
  'use_case',
  'area_size_m2',
] as const

/**
 * Felder, die für „müssen die Faktoren neu berechnet werden?" nicht zählen:
 * - Planungsgebiet — siehe `areaInputsDiffer`
 * - `min_area_m2` — reiner Client-Filter der Flächensuche, geht in keinen Lauf ein
 * - die Marker rund um die Zensus-Sättigung — sie beschreiben, WOHER der Wert kommt; berechnet
 *   wird mit `bewohnerbedarf_saettigung_ew`, und das zählt weiterhin mit
 */
const IGNORED_FACTOR_KEYS = new Set<string>([
  ...AREA_KEYS,
  'min_area_m2',
  'bewohnerbedarf_saettigung_auto',
  'bewohnerbedarf_saettigung_auto_ew',
  'bewohnerbedarf_ew_pro_ha',
])

const sortedJson = (value: unknown, omitKey?: (key: string) => boolean) =>
  JSON.stringify(value ?? null, (key, nested) => {
    if (omitKey?.(key)) return undefined
    if (nested === null || typeof nested !== 'object' || Array.isArray(nested)) return nested
    return Object.fromEntries(Object.entries(nested).sort(([a], [b]) => a.localeCompare(b)))
  })

/**
 * Stabiler Vergleichswert der berechnungsrelevanten Faktoren einer Variante: gleicher Fingerprint
 * = gleicher Lauf. Der Replacer sortiert die Schlüssel jedes Objekts, weil Postgres `jsonb` eine
 * andere Reihenfolge zurückgibt als der Entwurf im Formular.
 */
export const factorFingerprint = (config: FactorLike) =>
  sortedJson(config, (key) => IGNORED_FACTOR_KEYS.has(key))

export const factorsDiffer = (a: FactorLike, b: FactorLike) =>
  factorFingerprint(a) !== factorFingerprint(b)

/** Roh-Snapshot gegen aktuelle Config — nicht den re-gemergten Snapshot, der das heutige Gebiet trägt. */
export const areaInputsDiffer = (current: FactorLike, snapshot: FactorLike) => {
  const pick = (config: FactorLike) => {
    if (config == null) return null
    const record = config as Record<string, unknown>
    return Object.fromEntries(AREA_KEYS.map((key) => [key, record[key] ?? null]))
  }
  return sortedJson(pick(current)) !== sortedJson(pick(snapshot))
}

/** Banner-Text der Ursachen; leer wenn nichts veraltet ist. */
export const outdatedBannerReason = (factorsChanged: boolean, areaChanged: boolean) => {
  const parts = [
    factorsChanged && 'Faktoren geändert',
    areaChanged && 'Planungsgebiet geändert',
  ].filter((part) => typeof part === 'string')
  return parts.length > 0 ? parts.join(' und ') : null
}

/**
 * Bringt einen Lauf-Snapshot auf dieselbe Form wie die gemergte Varianten-Config:
 * `stripAutoSaettigung` reduziert auf Variantenfelder (Auto-Marker und eingefrorene Auto-Zahl
 * raus), danach derselbe Gebiets-Merge wie in der UI. Alte Snapshots ohne Schwellen-Key und
 * neue mit gemergter Zahl vergleichen so beide fair — `min_area_m2` und Gebietsfelder bleiben
 * über `factorsDiffer` ignoriert.
 */
export const comparableRunSnapshot = (
  snapshot: MergedFactorConfig | null | undefined,
  area: PlanningAreaInput,
) => {
  if (snapshot == null) return null
  return mergeFactorConfig(area, stripAutoSaettigung(snapshot))
}
