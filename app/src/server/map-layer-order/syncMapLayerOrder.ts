type Row = { layerKey: string; position: number }

/**
 * What it takes to give every Atlas-Geo layer of the code exactly one row: rows to add for new
 * layers and rows to remove for layers that left the code. Existing rows stay as they are.
 *
 * A new layer goes after all others. The map sorts by position first, so that is the top of the
 * position from its config.
 */
export function planMapLayerOrderSync(rows: Row[], layerKeys: string[]) {
  const known = new Set(rows.map((row) => row.layerKey))
  const inCode = new Set(layerKeys)
  const nextPosition = Math.max(-1, ...rows.map((row) => row.position)) + 1

  return {
    add: layerKeys
      .filter((layerKey) => !known.has(layerKey))
      .map((layerKey, index) => ({ layerKey, position: nextPosition + index, beforeId: null })),
    remove: rows.filter((row) => !inCode.has(row.layerKey)).map((row) => row.layerKey),
  }
}
