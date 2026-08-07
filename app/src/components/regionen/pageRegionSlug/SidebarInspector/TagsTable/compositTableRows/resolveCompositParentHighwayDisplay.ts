/** Row label for `composit_parent_highway` always comes from this topic-doc key. */
export const COMPOSIT_PARENT_HIGHWAY_ROW_TAG_KEY = 'parent_road' as const

/**
 * Bikelanes expose the parent street class on `parent_road` (TILDA `roads.road`).
 * The inspector shows one composite row and picks the first available value.
 * Both keys share the `roads.road` value enum.
 *
 * - `parent_road`: classified class of the parent centerline when infra was split off
 * - `road`: classified class of this feature when there is no parent
 */
export const COMPOSIT_PARENT_HIGHWAY_VALUE_SOURCE_KEYS = ['parent_road', 'road'] as const

export type CompositParentHighwayValueSourceKey =
  (typeof COMPOSIT_PARENT_HIGHWAY_VALUE_SOURCE_KEYS)[number]

type CompositParentHighwayDisplay = {
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
