/** Parse comma/whitespace-separated OSM relation IDs; reject invalid tokens; dedupe. */
export function parseOsmRelationIds(raw: string) {
  const tokens = raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  const ids: number[] = []
  for (const token of tokens) {
    const n = Number(token)
    if (Number.isNaN(n) || !Number.isInteger(n) || n <= 0) {
      throw new Error(`Ungültige OSM Relation ID: "${token}"`)
    }
    ids.push(n)
  }

  return [...new Set(ids)]
}
