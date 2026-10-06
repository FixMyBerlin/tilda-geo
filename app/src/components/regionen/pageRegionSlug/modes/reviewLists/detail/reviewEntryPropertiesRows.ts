import { newClientListKey } from '@/shared/orderedList/clientListKey'
import { TILDA_RESERVED_KEY_PREFIX } from '@/shared/reviewLists/reviewEntryImport'

export type PropertyRow = {
  _key: string
  key: string
  value: string
}

type ListFeatureLike = {
  properties?: { data?: unknown } | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const isEmptyPropertyValue = (value: unknown) => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true
  return false
}

export const coercePropertyValue = (value: unknown) => {
  if (typeof value === 'object' && value !== null) return JSON.stringify(value)
  return String(value)
}

export const collectUnionKeys = (features: readonly ListFeatureLike[]) => {
  const keys: string[] = []
  const seen = new Set<string>()
  for (const feature of features) {
    const data = feature.properties?.data
    if (!isRecord(data)) continue
    for (const key of Object.keys(data)) {
      if (seen.has(key) || key.startsWith(TILDA_RESERVED_KEY_PREFIX)) continue
      seen.add(key)
      keys.push(key)
    }
  }
  return keys
}

const emptyRow = () => ({ _key: newClientListKey(), key: '', value: '' })

const isBlankPropertyRow = (row: PropertyRow) => row.key.trim() === '' && row.value.trim() === ''

/** Append one blank add-row when the last row already has a key or value. */
export const ensureTrailingEmpty = (rows: PropertyRow[]) => {
  const last = rows.at(-1)
  if (!last || !isBlankPropertyRow(last)) return [...rows, emptyRow()]
  return rows
}

/**
 * Order is fixed at open time: this entry's non-empty keys, then remaining list-union
 * keys as empty inputs, then one blank add-row.
 */
export const buildInitialRows = (entryProperties: unknown, unionKeys: readonly string[]) => {
  const rows: PropertyRow[] = []
  const seen = new Set<string>()
  const props = isRecord(entryProperties) ? entryProperties : {}

  for (const [key, value] of Object.entries(props)) {
    if (isEmptyPropertyValue(value) || key.startsWith(TILDA_RESERVED_KEY_PREFIX)) continue
    rows.push({ _key: newClientListKey(), key, value: coercePropertyValue(value) })
    seen.add(key)
  }

  for (const key of unionKeys) {
    if (seen.has(key) || key.startsWith(TILDA_RESERVED_KEY_PREFIX)) continue
    rows.push({ _key: newClientListKey(), key, value: '' })
    seen.add(key)
  }

  return ensureTrailingEmpty(rows)
}

export const validatePropertyRows = (rows: readonly PropertyRow[]) => {
  const errors = new Map<string, string>()
  const firstByKey = new Map<string, string>()

  for (const row of rows) {
    const trimmed = row.key.trim()
    if (trimmed === '') continue
    if (trimmed.startsWith(TILDA_RESERVED_KEY_PREFIX)) {
      errors.set(row._key, 'Schlüssel mit dem Präfix „tilda_“ sind reserviert.')
      continue
    }
    const firstKey = firstByKey.get(trimmed)
    if (firstKey !== undefined) {
      errors.set(row._key, 'Schlüssel ist bereits vergeben.')
      if (!errors.has(firstKey)) errors.set(firstKey, 'Schlüssel ist bereits vergeben.')
    } else {
      firstByKey.set(trimmed, row._key)
    }
  }

  return errors
}

/** Coerce, trim, drop empty values so the last cleared key becomes `{}`. */
export const serializePropertyRows = (rows: readonly { key: string; value: unknown }[]) => {
  const properties: Record<string, string> = {}
  for (const row of rows) {
    const key = row.key.trim()
    if (!key || isEmptyPropertyValue(row.value)) continue
    const coerced = coercePropertyValue(row.value).trim()
    if (coerced === '') continue
    properties[key] = coerced
  }
  return properties
}
