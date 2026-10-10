import type { AtlasLayerEntry } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/sortLayers/getAllAtlasLayerEntries'
import type { LayerPosition } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/beforeId'
import type { AtlasAppAnchorId } from '@/components/regionen/pageRegionSlug/mapData/types'
import { AtlasAppAnchorIdSchema } from '@/server/map-layer-order/schemas'

type StackItem =
  | { slot: LayerPosition; title: string; hint?: string }
  | { basemap: string }
  | { fixed: string }

/**
 * The map from top to bottom: the positions our layers can have (`slot`), the basemap layers
 * between them (`basemap`) and what else TILDA draws there but cannot be sorted (`fixed`).
 * The positions are `LAYER_POSITIONS`, top first.
 */
export const STACK: StackItem[] = [
  { fixed: 'Maske, Hinweise, Prüflisten, Messen, Suchergebnis' },
  { slot: 'atlas-app-beforeid-top', title: 'Ganz oben' },
  { slot: 'atlas-app-beforeid-group1', title: 'Gruppe 1' },
  { fixed: 'Statische Daten ohne eigene Position' },
  { slot: 'atlas-app-beforeid-fallback', title: 'Gruppe der statischen Daten' },
  { slot: 'atlas-app-beforeid-group2', title: 'Gruppe 2' },
  { basemap: 'Hausnummern' },
  {
    slot: 'housenumber',
    title: 'Unter den Hausnummern',
    hint: 'Standard für Punkte, Symbole und Beschriftungen.',
  },
  { basemap: 'Straßennamen' },
  { fixed: 'Straßenfotos' },
  { slot: 'atlas-app-beforeid-below-roadname', title: 'Unter den Straßennamen' },
  {
    basemap:
      'Luftbild oder anderer Hintergrund, wenn gewählt. Verdeckt die Hintergrundkarte darunter; die Layer der Positionen darunter liegen dann direkt über dem Luftbild, in derselben Reihenfolge.',
  },
  { basemap: 'Ortsnamen, Landesgrenze' },
  { slot: 'boundary_country', title: 'Unter den Ortsnamen', hint: 'Standard für Linien.' },
  { basemap: 'Umriss der Landesgrenze' },
  { slot: 'boundary_country_outline', title: 'Über den Gebäuden' },
  { basemap: 'Gebäude' },
  { slot: 'building', title: 'Unter den Gebäuden' },
  { basemap: 'Straßen, Schienen, Brücken' },
  { fixed: 'QA-Flächen' },
  { slot: 'atlas-app-beforeid-below-road', title: 'Unter den Straßen' },
  { basemap: 'Gewässer' },
  { slot: 'atlas-app-beforeid-above-landuse', title: 'Über der Landnutzung' },
  { basemap: 'Landnutzung' },
  { slot: 'landuse', title: 'Unter der Landnutzung', hint: 'Standard für Flächen.' },
  { basemap: 'Wald, Grünflächen, Wohngebiete' },
]

export const STACK_SLOT_IDS = STACK.flatMap((item) => ('slot' in item ? [item.slot] : []))

/**
 * All layers with their position, lower layers first. The map sorts by position first, so the
 * order of this list only counts among the layers of one position.
 */
export type LayerOrder = { layerKey: string; slot: LayerPosition }[]

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
export function layersAt(order: LayerOrder, slot: LayerPosition) {
  return order
    .filter((entry) => entry.slot === slot)
    .map((entry) => entry.layerKey)
    .reverse()
}

/** Sorts the layers of one position (top layer first); all other layers keep their place in the list. */
export function reorderSlot(order: LayerOrder, slot: LayerPosition, layerKeys: string[]) {
  const bottomFirst = [...layerKeys].reverse()
  let next = 0
  return order.map((entry) =>
    entry.slot === slot ? { layerKey: bottomFirst[next++] ?? entry.layerKey, slot } : entry,
  )
}

/** Moves a layer to another position, on top of the layers that are already there. */
export function moveToSlot(order: LayerOrder, layerKey: string, slot: LayerPosition) {
  return [...order.filter((entry) => entry.layerKey !== layerKey), { layerKey, slot }]
}
