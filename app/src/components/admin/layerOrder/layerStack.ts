import type { AtlasLayerEntry } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/sortLayers/getAllAtlasLayerEntries'
import type {
  AtlasAppAnchorId,
  TBeforeIds,
} from '@/components/regionen/pageRegionSlug/mapData/types'
import { AtlasAppAnchorIdSchema } from '@/server/map-layer-order/schemas'

type StackSlotId = NonNullable<TBeforeIds>
type StackItem = { slot: StackSlotId; title: string; hint?: string } | { basemap: string }

/**
 * The map from top to bottom: the positions (`beforeId`s) our layers can have, and the basemap
 * layers between them. The positions have to follow the layer order of the Maptiler style;
 * tests/smoke/map-layer-order.spec.ts checks them against the live style.
 */
export const STACK: StackItem[] = [
  { slot: 'atlas-app-beforeid-top', title: 'Ganz oben' },
  { slot: 'atlas-app-beforeid-group1', title: 'Gruppe 1' },
  {
    slot: 'atlas-app-beforeid-fallback',
    title: 'Gruppe der statischen Daten',
    hint: 'Statische Daten ohne eigene Position liegen hier, über den TILDA-Layern dieser Gruppe.',
  },
  { slot: 'atlas-app-beforeid-group2', title: 'Gruppe 2' },
  { basemap: 'Hausnummern' },
  {
    slot: 'housenumber',
    title: 'Unter den Hausnummern',
    hint: 'Standard für Punkte, Symbole und Beschriftungen.',
  },
  { basemap: 'Straßennamen' },
  { slot: 'atlas-app-beforeid-below-roadname', title: 'Unter den Straßennamen' },
  {
    basemap:
      'Luftbild oder anderer Hintergrund, wenn gewählt – verdeckt die Hintergrundkarte darunter',
  },
  { basemap: 'Ortsnamen, Landesgrenze' },
  { slot: 'boundary_country', title: 'Unter den Ortsnamen', hint: 'Standard für Linien.' },
  { basemap: 'Umriss der Landesgrenze' },
  { slot: 'boundary_country_outline', title: 'Über den Gebäuden' },
  { basemap: 'Gebäude' },
  { slot: 'building', title: 'Unter den Gebäuden' },
  { basemap: 'Straßen, Schienen, Brücken' },
  { slot: 'atlas-app-beforeid-below-road', title: 'Unter den Straßen' },
  { basemap: 'Gewässer' },
  { slot: 'atlas-app-beforeid-above-landuse', title: 'Über der Landnutzung' },
  { basemap: 'Landnutzung' },
  { slot: 'landuse', title: 'Unter der Landnutzung', hint: 'Standard für Flächen.' },
  { basemap: 'Wald, Grünflächen, Wohngebiete' },
]

export const STACK_SLOT_IDS = STACK.flatMap((item) => ('slot' in item ? [item.slot] : []))

/**
 * All layers from the bottom of the map to the top, each with its position. Positions only exist
 * on the default background; on a raster background this list alone is the order.
 */
export type LayerOrder = { layerKey: string; slot: StackSlotId }[]

type SavedEntry = { layerKey: string; beforeId: string | null }

/** `savedOrder` are the rows of the MapLayerOrder table, the bottom layer first. */
export function toLayerOrder(savedOrder: SavedEntry[], atlasLayers: AtlasLayerEntry[]) {
  const defaultSlots = new Map(atlasLayers.map((layer) => [layer.layerKey, layer.defaultBeforeId]))
  const savedKeys = new Set(savedOrder.map((entry) => entry.layerKey))
  // Like on the map, a layer that is not part of the saved order is on top of the others.
  const entries: SavedEntry[] = [
    ...savedOrder,
    ...atlasLayers
      .filter((layer) => !savedKeys.has(layer.layerKey))
      .map((layer) => ({ layerKey: layer.layerKey, beforeId: null })),
  ]

  return entries.flatMap(({ layerKey, beforeId }) => {
    const defaultSlot = defaultSlots.get(layerKey)
    // A saved layer that is no longer part of the code is left out and with that removed on save.
    if (!defaultSlot) return []
    const anchor = AtlasAppAnchorIdSchema.safeParse(beforeId)
    return [{ layerKey, slot: anchor.success ? anchor.data : defaultSlot }]
  }) satisfies LayerOrder
}

/** The MapLayerOrder rows: `beforeId` is null for a layer at the position from the config. */
export function toSavedOrder(order: LayerOrder, atlasLayers: AtlasLayerEntry[]) {
  const defaultSlots = new Map(atlasLayers.map((layer) => [layer.layerKey, layer.defaultBeforeId]))
  return order.map(({ layerKey, slot }) => {
    const anchor = AtlasAppAnchorIdSchema.safeParse(slot)
    const beforeId: AtlasAppAnchorId | null =
      anchor.success && defaultSlots.get(layerKey) !== slot ? anchor.data : null
    return { layerKey, beforeId }
  })
}

/** The layers at a position, the top layer first. */
export function layersAt(order: LayerOrder, slot: StackSlotId) {
  return order
    .filter((entry) => entry.slot === slot)
    .map((entry) => entry.layerKey)
    .reverse()
}

/** Sorts the layers of one position (top layer first); all other layers keep their place in the list. */
export function reorderSlot(order: LayerOrder, slot: StackSlotId, layerKeys: string[]) {
  const bottomFirst = [...layerKeys].reverse()
  let next = 0
  return order.map((entry) =>
    entry.slot === slot ? { layerKey: bottomFirst[next++] ?? entry.layerKey, slot } : entry,
  )
}

/** Moves a layer to another position, on top of the layers that are already there. */
export function moveToSlot(order: LayerOrder, layerKey: string, slot: StackSlotId) {
  const others = order.filter((entry) => entry.layerKey !== layerKey)
  const topOfSlot = others.map((entry) => entry.slot).lastIndexOf(slot)
  // An empty position has no neighbour to sit on, so the layer keeps its place in the list.
  const index =
    topOfSlot === -1 ? order.findIndex((entry) => entry.layerKey === layerKey) : topOfSlot + 1
  return [...others.slice(0, index), { layerKey, slot }, ...others.slice(index)]
}
