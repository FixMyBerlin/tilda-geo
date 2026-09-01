import type { FactorConfig } from '@/server/planning/planning.functions'

/**
 * Felder, die für „muss neu berechnet werden?" nicht zählen:
 * - Planungsgebiet (Geometrie, eigene Daten, Nutzung, Größe) — dafür gibt es `PlanningRun.stale`,
 *   das der Server pflegt, sobald das Gebiet bearbeitet wird.
 * - `min_area_m2` — reiner Client-Filter der Flächensuche, geht in keinen Lauf ein.
 */
const IGNORED_KEYS = new Set([
  'study_area',
  'user_geojson',
  'user_geojson_mode',
  'use_case',
  'area_size_m2',
  'min_area_m2',
])

/**
 * Stabiler Vergleichswert der berechnungsrelevanten Faktoren einer Variante: gleicher Fingerprint
 * = gleicher Lauf. Der Replacer sortiert die Schlüssel jedes Objekts, weil Postgres `jsonb` eine
 * andere Reihenfolge zurückgibt als der Entwurf im Formular.
 */
export const factorFingerprint = (config: FactorConfig | null | undefined): string =>
  JSON.stringify(config ?? null, (key, value) => {
    if (IGNORED_KEYS.has(key)) return undefined
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return value
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)))
  })

export const factorsDiffer = (
  a: FactorConfig | null | undefined,
  b: FactorConfig | null | undefined,
) => factorFingerprint(a) !== factorFingerprint(b)
