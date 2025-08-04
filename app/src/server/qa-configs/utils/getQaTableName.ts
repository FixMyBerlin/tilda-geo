/**
 * Get and validate QA table name from config
 * @param mapTable The mapTable from QA config (e.g., "public.qa_parkings_euvm" or "qa_parkings_euvm")
 * @returns The validated table name
 * @throws Error if table name is invalid
 */
export function getQaTableName(mapTable: string): string {
  // Get the map table name and validate it's a safe table name
  const tableName = mapTable.startsWith('public.') ? mapTable : `public.${mapTable}`

  // Validate table name to prevent SQL injection
  if (!/^public\.[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`)
  }

  return tableName
}
