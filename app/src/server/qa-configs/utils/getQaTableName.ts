/**
 * Validate `QaConfig.mapTable` for use in raw SQL. The form schema already requires
 * `public.<name>` (schemas.ts), so this only guards direct/legacy callers against SQL injection.
 * @throws Error if table name is invalid
 */
export function getQaTableName(mapTable: string) {
  if (!/^public\.[a-zA-Z_][a-zA-Z0-9_]*$/.test(mapTable)) {
    throw new Error(`Invalid table name: ${mapTable}`)
  }

  return mapTable
}

/**
 * Per-indicator companion table written by processing:
 * `area_id, indicator_key, reference, current, difference, deviation, breakdown`.
 */
export function getQaIndicatorsTableName(mapTable: string) {
  return `${getQaTableName(mapTable)}_indicators`
}

/**
 * Per-cell last OSM editors written by processing:
 * `area_id, last_editors JSONB` — `[{ osmUser, amount, updatedAt }]`, one row per cell.
 */
export function getQaLastEditorsTableName(mapTable: string) {
  return `${getQaTableName(mapTable)}_last_editors`
}
