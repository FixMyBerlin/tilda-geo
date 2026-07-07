/** Row label for `composit_parent_highway` always comes from this topic-doc key. */
export const COMPOSIT_PARENT_HIGHWAY_ROW_TAG_KEY = '_parent_highway' as const

/**
 * Bikelanes expose parent-road type on up to three properties. The inspector shows one
 * composite row (`composit_parent_highway`) and picks the first available value in this
 * order. Each property has its own topic-doc value enum, so translations must use the
 * winning property name as `valueTagKey` (not always `highway`).
 *
 * - `_parent_highway`: OSM `highway=*` of the parent road when a sidepath was split off
 * - `road`: classified Straßentyp (`roads.road`, e.g. `footway_sidewalk`)
 * - `highway`: OSM `highway=*` on the bikelane geometry itself
 */
export const COMPOSIT_PARENT_HIGHWAY_VALUE_SOURCE_KEYS = [
  '_parent_highway',
  'road',
  'highway',
] as const

export type CompositParentHighwayValueSourceKey =
  (typeof COMPOSIT_PARENT_HIGHWAY_VALUE_SOURCE_KEYS)[number]

export type CompositParentHighwayDisplay = {
  rowTagKey: typeof COMPOSIT_PARENT_HIGHWAY_ROW_TAG_KEY
  valueTagKey: CompositParentHighwayValueSourceKey
  tagValue: string
}

export const resolveCompositParentHighwayDisplay = (
  properties: Partial<Record<CompositParentHighwayValueSourceKey, string | undefined>>,
) => {
  const valueTagKey = COMPOSIT_PARENT_HIGHWAY_VALUE_SOURCE_KEYS.find((key) => properties[key])
  if (!valueTagKey) return null

  const tagValue = properties[valueTagKey]
  if (!tagValue) return null

  return {
    rowTagKey: COMPOSIT_PARENT_HIGHWAY_ROW_TAG_KEY,
    valueTagKey,
    tagValue,
  } satisfies CompositParentHighwayDisplay
}
