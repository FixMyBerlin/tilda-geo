import type { AtlasLayerEntry } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/sortLayers/getAllAtlasLayerEntries'
import type { LayerPosition } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/beforeId'
import { LayerPositionSchema } from '@/server/map-layer-order/schemas'

type StackItem =
  | { slot: LayerPosition; title: string; hint?: string }
  /**
   * A position with nothing between it and the position above. It is the bottom of that position
   * and not listed on its own: its layers are shown there, below the others.
   */
  | { slot: LayerPosition; bottomOf: LayerPosition }
  | { basemap: string; hint?: string }
  | { fixed: string; hint?: string }

/**
 * The map from top to bottom: the positions our layers can have (`slot`), the basemap layers
 * between them (`basemap`) and what else TILDA draws there but cannot be sorted (`fixed`).
 * The positions are `LAYER_POSITIONS`, top first.
 */
export const STACK: StackItem[] = [
  { fixed: 'Immer zuoberst', hint: 'Maske, Hinweise, Prüflisten, Messen, Suchergebnis' },
  {
    slot: 'atlas-app-beforeid-top',
    title: 'Oberste Gruppe',
    hint: 'Über der ganzen Hintergrundkarte und den statischen Daten.',
  },
  { slot: 'atlas-app-beforeid-group1', bottomOf: 'atlas-app-beforeid-top' },
  {
    fixed: 'Statische Daten',
    hint: 'Alle, die in ihrer Konfiguration keine andere Gruppe haben.',
  },
  { slot: 'atlas-app-beforeid-fallback', title: 'Unter den statischen Daten' },
  { slot: 'atlas-app-beforeid-group2', bottomOf: 'atlas-app-beforeid-fallback' },
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
    basemap: 'Luftbild oder anderer Hintergrund, wenn gewählt',
    hint: 'Verdeckt die Hintergrundkarte darunter. Die Layer der Gruppen darunter liegen dann direkt über dem Luftbild, in derselben Reihenfolge.',
  },
  { basemap: 'Ortsnamen' },
  { slot: 'boundary_country', title: 'Unter den Ortsnamen', hint: 'Standard für Linien.' },
  { basemap: 'Landesgrenze' },
  { slot: 'boundary_country_outline', title: 'Unter der Landesgrenze' },
  { basemap: 'Gebäude' },
  { slot: 'building', title: 'Unter den Gebäuden' },
  { basemap: 'Straßen, Schienen, Brücken' },
  { fixed: 'QA-Flächen', hint: 'Ihre Umrandung liegt immer zuoberst.' },
  { slot: 'atlas-app-beforeid-below-road', title: 'Unter den Straßen' },
  { basemap: 'Gewässer' },
  { slot: 'atlas-app-beforeid-above-landuse', title: 'Unter den Gewässern' },
  { basemap: 'Landnutzung' },
  {
    slot: 'landuse',
    title: 'Unterste Gruppe',
    hint: 'Unter der Landnutzung. Standard für Flächen.',
  },
  { basemap: 'Wald, Grünflächen, Wohngebiete' },
]

export const STACK_SLOT_IDS = STACK.flatMap((item) => ('slot' in item ? [item.slot] : []))

/** The positions a layer can be moved to, top first: every position the list shows. */
export const TARGET_SLOT_IDS = STACK.flatMap((item) => ('title' in item ? [item.slot] : []))

const bottomOf = new Map(
  STACK.flatMap((item) => ('bottomOf' in item ? [[item.slot, item.bottomOf] as const] : [])),
)
/** The position a layer is listed at. */
export const listedSlot = (slot: LayerPosition) => bottomOf.get(slot) ?? slot

/** The layers of each position, the top layer first. */
export type LayerStack = Partial<Record<LayerPosition, string[]>>

type SavedEntry = { layerKey: string; beforeId: string | null }

/**
 * `savedOrder` are the rows of the MapLayerOrder table, the bottom layer first. They hold exactly
 * the layers of the code, see `getMapLayerOrder`.
 */
export function toLayerStack(savedOrder: SavedEntry[], atlasLayers: AtlasLayerEntry[]) {
  const defaultSlots = new Map(atlasLayers.map((layer) => [layer.layerKey, layer.defaultBeforeId]))

  const stack: LayerStack = {}
  const bottoms: LayerStack = {}
  for (const { layerKey, beforeId } of savedOrder) {
    const defaultSlot = defaultSlots.get(layerKey)
    if (!defaultSlot) throw new Error(`Map layer order: "${layerKey}" is not a layer of the code`)
    const saved = LayerPositionSchema.safeParse(beforeId)
    const slot = saved.success ? saved.data : defaultSlot
    const list = listedSlot(slot) === slot ? stack : bottoms
    list[listedSlot(slot)] = [layerKey, ...(list[listedSlot(slot)] ?? [])]
  }
  for (const slot of STACK_SLOT_IDS) {
    if (bottoms[slot]) stack[slot] = [...(stack[slot] ?? []), ...bottoms[slot]]
  }
  return stack
}

/**
 * The MapLayerOrder rows, the bottom layer of the map first. `beforeId` is null for a layer at
 * the position from the config.
 */
export function toSavedOrder(stack: LayerStack, atlasLayers: AtlasLayerEntry[]) {
  const defaultSlots = new Map(atlasLayers.map((layer) => [layer.layerKey, layer.defaultBeforeId]))
  return [...STACK_SLOT_IDS].reverse().flatMap((slot) =>
    [...(stack[slot] ?? [])].reverse().map((layerKey) => ({
      layerKey,
      beforeId: defaultSlots.get(layerKey) !== slot ? slot : null,
    })),
  )
}

/**
 * Moves layers to another position, on top of the layers that are already there. Among each
 * other they keep the order they have on the map.
 */
export function moveToSlot(stack: LayerStack, layerKeys: string[], to: LayerPosition) {
  const moving = new Set(layerKeys)
  const moved = STACK_SLOT_IDS.flatMap((slot) => (stack[slot] ?? []).filter((k) => moving.has(k)))
  const rest = Object.fromEntries(
    STACK_SLOT_IDS.map((slot) => [slot, (stack[slot] ?? []).filter((key) => !moving.has(key))]),
  )
  return { ...rest, [to]: [...moved, ...(rest[to] ?? [])] } satisfies LayerStack
}
