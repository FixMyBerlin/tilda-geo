import { z } from 'zod'
import { ATLAS_APP_ANCHOR_IDS } from '@/components/regionen/pageRegionSlug/mapData/types'
import { AtlasAppAnchorIdSchema } from '@/server/map-layer-order/schemas'

// Layers without an explicit anchor keep their config/type-based default placement.
export const DEFAULT_GROUP = 'default' as const
export const GROUPS = [DEFAULT_GROUP, ...ATLAS_APP_ANCHOR_IDS] as const
export type GroupKey = (typeof GROUPS)[number]
export const GroupKeySchema = z.enum(GROUPS)

export const GROUP_LABELS: Record<GroupKey, string> = {
  default: 'Standard (Position aus der Layer-Konfiguration)',
  'atlas-app-beforeid-above-landuse': 'Über Landnutzung (ganz unten)',
  'atlas-app-beforeid-below-road': 'Unter Straßen',
  'atlas-app-beforeid-below-roadname': 'Unter Straßennamen',
  'atlas-app-beforeid-group2': 'Gruppe 2',
  'atlas-app-beforeid-fallback': 'Fallback-Gruppe',
  'atlas-app-beforeid-group1': 'Gruppe 1',
  'atlas-app-beforeid-top': 'Ganz oben',
}

export type GroupedState = Record<GroupKey, string[]>

export const EMPTY_GROUPED_STATE = {
  default: [],
  'atlas-app-beforeid-above-landuse': [],
  'atlas-app-beforeid-below-road': [],
  'atlas-app-beforeid-below-roadname': [],
  'atlas-app-beforeid-group2': [],
  'atlas-app-beforeid-fallback': [],
  'atlas-app-beforeid-group1': [],
  'atlas-app-beforeid-top': [],
} satisfies GroupedState

type LayerOrderDbEntry = {
  layerKey: string
  beforeId: string | null
}

export function initGroups(dbEntries: LayerOrderDbEntry[], codeKeys: string[]) {
  const groups: GroupedState = structuredClone(EMPTY_GROUPED_STATE)
  const dbKeys = new Set<string>()
  for (const entry of dbEntries) {
    dbKeys.add(entry.layerKey)
    // Stale DB keys (no longer in code) are kept visible so the admin sees the drift;
    // they are dropped on save.
    const anchor = AtlasAppAnchorIdSchema.safeParse(entry.beforeId)
    const group: GroupKey = anchor.success ? anchor.data : DEFAULT_GROUP
    groups[group].push(entry.layerKey)
  }
  for (const key of codeKeys) {
    if (!dbKeys.has(key)) groups[DEFAULT_GROUP].push(key)
  }
  return groups
}

export function flattenGroups(groups: GroupedState, codeKeySet: Set<string>) {
  // Flatten bottom-first: group order is irrelevant for splicing (beforeId decides),
  // but keeping a deterministic full-list order keeps positions stable and readable.
  return GROUPS.flatMap((group) =>
    groups[group]
      .filter((layerKey) => codeKeySet.has(layerKey)) // drop stale keys
      .map((layerKey) => ({
        layerKey,
        beforeId: group === DEFAULT_GROUP ? null : group,
      })),
  )
}
