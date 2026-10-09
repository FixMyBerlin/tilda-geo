import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { AdminAsideActions } from '@/components/admin/aside/AdminAsideActions'
import { AdminAsideLayout } from '@/components/admin/aside/AdminAsideLayout'
import { useAdminAsideVariant } from '@/components/admin/aside/adminAsideSection'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import {
  type AtlasLayerEntry,
  getAllAtlasLayerEntries,
} from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/sortLayers/getAllAtlasLayerEntries'
import { ATLAS_APP_ANCHOR_IDS } from '@/components/regionen/pageRegionSlug/mapData/types'
import { buttonStyles } from '@/components/shared/links/styles'
import { SortableList } from '@/components/shared/sortable/SortableList'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { updateMapLayerOrderFn } from '@/server/map-layer-order/map-layer-order.functions'
import { mapLayerOrderQueryOptions } from '@/server/map-layer-order/mapLayerOrderQueryOptions'
import type { MapLayerOrderEntry } from '@/server/map-layer-order/queries/getMapLayerOrder.server'
import {
  type LayerOrder,
  layersAt,
  moveToSlot,
  reorderSlot,
  STACK,
  STACK_SLOT_IDS,
  toLayerOrder,
  toSavedOrder,
} from './layerStack'

const ATLAS_LAYERS = getAllAtlasLayerEntries()
const ATLAS_LAYER_BY_KEY = new Map(ATLAS_LAYERS.map((layer) => [layer.layerKey, layer]))

type SlotId = (typeof STACK_SLOT_IDS)[number]

const slotTitles = new Map(
  STACK.flatMap((item) => ('slot' in item ? [[item.slot, item.title]] : [])),
)
const slotTitle = (slot: SlotId) => slotTitles.get(slot) ?? slot

const layerTypeLabels: Record<string, string> = {
  fill: 'Fläche',
  line: 'Linie',
  circle: 'Punkt',
  symbol: 'Symbol',
  heatmap: 'Heatmap',
}

const DEFAULT_POSITION = 'default'

type LayerRowProps = {
  layer: AtlasLayerEntry
  slot: SlotId
  dragHandle?: React.ReactNode
  onMove: (layerKey: string, to: SlotId) => void
}

function LayerRow({ layer, slot, dragHandle, onMove }: LayerRowProps) {
  const isMoved = slot !== layer.defaultBeforeId
  // A layer at its default position can move to every anchor of the basemap, and back.
  const anchors = ATLAS_APP_ANCHOR_IDS.filter((anchor) => anchor !== layer.defaultBeforeId)

  return (
    <div className="flex items-center gap-2 rounded border border-gray-200 bg-white px-2 py-1.5">
      {dragHandle}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-900">
          {layer.subcategoryName} · {layer.styleName}
          <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
            {layerTypeLabels[layer.layerType] ?? layer.layerType}
          </span>
          {isMoved ? (
            <span className="ml-2 rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-900">
              verschoben
            </span>
          ) : null}
        </p>
        <p className="truncate text-xs text-gray-500" title={layer.layerKey}>
          <code>{layer.layerId}</code> · {layer.categoryNames.join(', ')}
        </p>
      </div>
      <select
        aria-label={`Position von ${layer.subcategoryName} · ${layer.styleName} · ${layer.layerId}`}
        className="w-72 shrink-0 rounded-md border-gray-300 py-1 text-sm"
        value={isMoved ? slot : DEFAULT_POSITION}
        onChange={(event) => {
          const to = STACK_SLOT_IDS.find((slotId) => slotId === event.currentTarget.value)
          onMove(layer.layerKey, to ?? layer.defaultBeforeId)
        }}
      >
        <option value={DEFAULT_POSITION}>Standard: {slotTitle(layer.defaultBeforeId)}</option>
        {anchors.map((anchor) => (
          <option key={anchor} value={anchor}>
            {slotTitle(anchor)}
          </option>
        ))}
      </select>
    </div>
  )
}

type SaveButtonProps = { isDirty: boolean; isSaving: boolean; onSave: () => void }

function SaveButton({ isDirty, isSaving, onSave }: SaveButtonProps) {
  const variant = useAdminAsideVariant()
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={isSaving || !isDirty}
      className={twMerge(buttonStyles, 'gap-x-2 px-3', variant === 'desktop' && 'w-full')}
    >
      {isSaving ? <SmallSpinner /> : null}
      Speichern
    </button>
  )
}

type LayerOrderEditorProps = { savedOrder: MapLayerOrderEntry[] }

function LayerOrderEditor({ savedOrder }: LayerOrderEditorProps) {
  const queryClient = useQueryClient()
  const [order, setOrder] = useState(() => toLayerOrder(savedOrder, ATLAS_LAYERS))
  const [isDirty, setIsDirty] = useState(false)
  const [search, setSearch] = useState('')

  const changeOrder = (change: (order: LayerOrder) => LayerOrder) => {
    setOrder(change)
    setIsDirty(true)
  }

  const save = useMutation({
    mutationFn: () =>
      updateMapLayerOrderFn({ data: { entries: toSavedOrder(order, ATLAS_LAYERS) } }),
    onSuccess: () => {
      setIsDirty(false)
      // The refetch gives the editor a new `key`, so it starts again from the saved order.
      return queryClient.invalidateQueries(mapLayerOrderQueryOptions())
    },
  })

  // Positions that only the config uses are listed when they hold a layer; anchors always.
  const slots = STACK_SLOT_IDS.filter(
    (slot) =>
      ATLAS_APP_ANCHOR_IDS.some((anchor) => anchor === slot) ||
      order.some((entry) => entry.slot === slot),
  )
  const searchTerm = search.trim().toLowerCase()
  const matches = (layer: AtlasLayerEntry) =>
    [layer.subcategoryName, layer.styleName, layer.layerKey, ...layer.categoryNames].some((text) =>
      text.toLowerCase().includes(searchTerm),
    )
  const removedCount = savedOrder.filter((entry) => !ATLAS_LAYER_BY_KEY.has(entry.layerKey)).length

  return (
    <AdminAsideLayout
      sections={slots.map((slot) => ({ id: slot, label: slotTitle(slot) }))}
      actions={
        <AdminAsideActions
          primary={
            <SaveButton isDirty={isDirty} isSaving={save.isPending} onSave={() => save.mutate()} />
          }
          status={
            save.error ? (
              <p className="text-sm text-red-700">{save.error.message}</p>
            ) : isDirty ? (
              <p className="text-sm text-gray-600">Ungespeicherte Änderungen</p>
            ) : null
          }
        />
      }
    >
      {savedOrder.length === 0 ? (
        <p className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-gray-800">
          Noch nichts gespeichert. Die Karten zeigen die Layer in der Reihenfolge der Kategorien
          ihrer Region. Mit dem ersten Speichern gilt diese Liste für alle Regionen.
        </p>
      ) : null}
      {removedCount > 0 ? (
        <p className="text-sm text-gray-600">
          {removedCount} gespeicherte Layer gibt es im Code nicht mehr. Sie werden mit dem nächsten
          Speichern entfernt.
        </p>
      ) : null}
      <div>
        <label htmlFor="layer-order-search" className="sr-only">
          Layer suchen
        </label>
        <input
          id="layer-order-search"
          type="search"
          placeholder="Layer suchen"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          className="w-full rounded-md border-gray-300 text-sm"
        />
        {searchTerm ? (
          <p className="mt-1 text-xs text-gray-500">
            Während der Suche lässt sich die Position ändern, aber nicht die Reihenfolge.
          </p>
        ) : null}
      </div>
      {/* No changes while a save runs: the editor starts again from the saved order afterwards. */}
      <fieldset disabled={save.isPending} className="contents">
        {STACK.map((item) => {
          if ('basemap' in item) {
            return (
              <p
                key={item.basemap}
                className="flex items-center gap-3 text-xs font-medium tracking-wide text-gray-500 uppercase before:h-px before:flex-1 before:bg-gray-300 after:h-px after:flex-1 after:bg-gray-300"
              >
                Hintergrundkarte: {item.basemap}
              </p>
            )
          }
          const { slot } = item
          if (!slots.includes(slot)) return null
          const layerKeys = layersAt(order, slot)
          const renderRow = (layerKey: string, dragHandle?: React.ReactNode) => {
            const layer = ATLAS_LAYER_BY_KEY.get(layerKey)
            if (!layer) return null
            return (
              <LayerRow
                layer={layer}
                slot={slot}
                dragHandle={dragHandle}
                onMove={(key, to) => changeOrder((current) => moveToSlot(current, key, to))}
              />
            )
          }

          return (
            <AdminFormSection
              key={slot}
              id={slot}
              title={`${item.title} (${layerKeys.length})`}
              description={item.hint}
            >
              {layerKeys.length === 0 ? (
                <p className="text-sm text-gray-500">Keine Layer an dieser Position.</p>
              ) : searchTerm ? (
                <ul className="space-y-2">
                  {layerKeys
                    .filter((layerKey) => {
                      const layer = ATLAS_LAYER_BY_KEY.get(layerKey)
                      return layer && matches(layer)
                    })
                    .map((layerKey) => (
                      <li key={layerKey}>{renderRow(layerKey)}</li>
                    ))}
                </ul>
              ) : (
                <SortableList
                  items={layerKeys}
                  getItemKey={(layerKey) => layerKey}
                  onReorder={(next) => changeOrder((current) => reorderSlot(current, slot, next))}
                  renderItem={(layerKey, { dragHandle }) => renderRow(layerKey, dragHandle)}
                />
              )}
            </AdminFormSection>
          )
        })}
      </fieldset>
    </AdminAsideLayout>
  )
}

export function AdminLayerOrder() {
  const { data: savedOrder, dataUpdatedAt } = useQuery(mapLayerOrderQueryOptions())
  if (!savedOrder) return <p className="text-sm text-gray-500">Lade…</p>

  return <LayerOrderEditor key={dataUpdatedAt} savedOrder={savedOrder} />
}
