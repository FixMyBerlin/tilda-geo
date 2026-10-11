import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/20/solid'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { twJoin, twMerge } from 'tailwind-merge'
import { adminFormSectionScrollMarginClassName } from '@/components/admin/adminClasses'
import { AdminAsideActions } from '@/components/admin/aside/AdminAsideActions'
import { AdminAsideLayout } from '@/components/admin/aside/AdminAsideLayout'
import { useAdminAsideVariant } from '@/components/admin/aside/adminAsideSection'
import {
  type AtlasLayerEntry,
  getAllAtlasLayerEntries,
} from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/sortLayers/getAllAtlasLayerEntries'
import { buttonStyles } from '@/components/shared/links/styles'
import { SortableList } from '@/components/shared/sortable/SortableList'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { updateMapLayerOrderFn } from '@/server/map-layer-order/map-layer-order.functions'
import { mapLayerOrderQueryOptions } from '@/server/map-layer-order/mapLayerOrderQueryOptions'
import type { MapLayerOrderEntry } from '@/server/map-layer-order/queries/getMapLayerOrder.server'
import {
  type LayerStack,
  moveToSlot,
  STACK,
  listedSlot,
  STACK_SLOT_IDS,
  TARGET_SLOT_IDS,
  toLayerStack,
  toSavedOrder,
} from './layerStack'

const ATLAS_LAYERS = getAllAtlasLayerEntries()
const ATLAS_LAYER_BY_KEY = new Map(ATLAS_LAYERS.map((layer) => [layer.layerKey, layer]))

type SlotId = (typeof STACK_SLOT_IDS)[number]

const slotTitles = new Map(
  STACK.flatMap((item) => ('title' in item ? [[item.slot, item.title]] : [])),
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

const selectTitle =
  'Auswählen, um mehrere Layer zusammen zu verschieben. Mit Umschalt-Taste: alle bis hier.'

type PositionSelectProps = {
  label: string
  /** The position from the code, offered as "(Standard)". Without it: "each to its own". */
  defaultSlot?: SlotId
  value: string
  onChange: (to: SlotId | typeof DEFAULT_POSITION) => void
  children: React.ReactNode
  className: string
}

// A native select under its children: small on the page, and the full list of positions on click.
function PositionSelect({
  label,
  defaultSlot,
  value,
  onChange,
  children,
  className,
}: PositionSelectProps) {
  return (
    <span
      className={twJoin(
        'relative inline-flex shrink-0 items-center justify-center rounded-md bg-white text-gray-600 shadow-xs ring-1 ring-gray-300 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-yellow-500 hover:bg-gray-50 hover:text-gray-900',
        className,
      )}
    >
      {children}
      <select
        aria-label={label}
        title="In eine andere Gruppe verschieben"
        className="absolute inset-0 cursor-pointer opacity-0"
        value={value}
        onChange={(event) => {
          const to = STACK_SLOT_IDS.find((slotId) => slotId === event.currentTarget.value)
          onChange(to ?? DEFAULT_POSITION)
        }}
      >
        {value === '' ? <option value="" disabled /> : null}
        <option value={DEFAULT_POSITION}>
          {defaultSlot ? `${slotTitle(defaultSlot)} (Standard)` : 'Jeweils die Standard-Gruppe'}
        </option>
        {TARGET_SLOT_IDS.filter((slot) => slot !== defaultSlot).map((slot) => (
          <option key={slot} value={slot}>
            {slotTitle(slot)}
          </option>
        ))}
      </select>
    </span>
  )
}

type LayerRowProps = {
  layer: AtlasLayerEntry
  slot: SlotId
  isSelected: boolean
  dragHandle?: React.ReactNode
  onSelect: (layerKey: string, isRange: boolean) => void
  onMove: (layerKeys: string[], to: SlotId | typeof DEFAULT_POSITION) => void
}

function LayerRow({ layer, slot, isSelected, dragHandle, onSelect, onMove }: LayerRowProps) {
  const defaultSlot = listedSlot(layer.defaultBeforeId)
  const isMoved = slot !== defaultSlot
  const name = `${layer.subcategoryName} · ${layer.styleName} · ${layer.layerId}`
  // A category that is named like its subcategory would only repeat the first line.
  const categories = layer.categoryNames.filter((category) => category !== layer.subcategoryName)

  return (
    <div className={twJoin('flex items-center gap-2 px-2 py-1.5', isSelected && 'bg-yellow-50')}>
      {dragHandle}
      <input
        type="checkbox"
        aria-label={`${name} auswählen`}
        title={selectTitle}
        checked={isSelected}
        // `onClick` has the modifier key; the checkbox is controlled, so the change itself is a no-op.
        onClick={(event) => onSelect(layer.layerKey, event.shiftKey)}
        onChange={() => {}}
        className="size-4 shrink-0 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
      />
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
          <code>{layer.layerId}</code>
          {categories.length > 0 ? ` · ${categories.join(', ')}` : null}
        </p>
      </div>
      <PositionSelect
        label={`Gruppe von ${name}`}
        defaultSlot={defaultSlot}
        value={isMoved ? slot : DEFAULT_POSITION}
        onChange={(to) => onMove([layer.layerKey], to)}
        className="size-8"
      >
        <ArrowRightEndOnRectangleIcon className="size-5" aria-hidden="true" />
      </PositionSelect>
    </div>
  )
}

type StackGroupProps = {
  /** `layers`: a position with its sortable layers. The others only say what else is there. */
  kind: 'layers' | 'basemap' | 'fixed'
  id?: string
  title: string
  pill: React.ReactNode
  hint?: string
  children?: React.ReactNode
}

const stackGroupStyles = {
  layers: { section: 'bg-white', pill: 'bg-gray-100 text-gray-700' },
  basemap: { section: 'bg-gray-100', pill: 'bg-white text-gray-600' },
  fixed: { section: 'bg-yellow-50', pill: 'bg-yellow-200 text-yellow-900' },
}

function StackGroup({ kind, id, title, pill, hint, children }: StackGroupProps) {
  const styles = stackGroupStyles[kind]
  return (
    <section
      id={id}
      className={twJoin(
        'rounded-lg shadow-sm ring-1 ring-gray-900/5',
        adminFormSectionScrollMarginClassName,
        styles.section,
      )}
    >
      <div className="px-3 py-2">
        <div className="flex items-center gap-x-2">
          <h2 className="flex-1 text-sm font-semibold text-gray-900">{title}</h2>
          <span className={twJoin('shrink-0 rounded-full px-2 text-xs/5 font-medium', styles.pill)}>
            {pill}
          </span>
        </div>
        {hint ? <p className="text-xs text-gray-600">{hint}</p> : null}
      </div>
      {children ? <div className="border-t border-gray-100">{children}</div> : null}
    </section>
  )
}

type PositionGroupProps = {
  slot: SlotId
  title: string
  hint?: string
  layerKeys: string[]
  selectedKeys: string[]
  searchTerm: string
  onReorder: (slot: SlotId, layerKeys: string[]) => void
  onSelect: (slot: SlotId, selectedKeys: string[]) => void
  onMove: LayerRowProps['onMove']
}

const matchesSearch = (layer: AtlasLayerEntry, searchTerm: string) =>
  [layer.subcategoryName, layer.styleName, layer.layerKey, ...layer.categoryNames].some((text) =>
    text.toLowerCase().includes(searchTerm),
  )

// Its own component: a change in one position re-renders the rows of that position only.
function PositionGroup({
  slot,
  title,
  hint,
  layerKeys,
  selectedKeys,
  searchTerm,
  onReorder,
  onSelect,
  onMove,
}: PositionGroupProps) {
  // The row a range selection (shift) starts from.
  const [rangeStart, setRangeStart] = useState<string>()
  const shownKeys = searchTerm
    ? layerKeys.filter((layerKey) => {
        const layer = ATLAS_LAYER_BY_KEY.get(layerKey)
        return layer && matchesSearch(layer, searchTerm)
      })
    : layerKeys
  const select = (layerKey: string, isRange: boolean) => {
    const from = rangeStart ? shownKeys.indexOf(rangeStart) : -1
    const to = shownKeys.indexOf(layerKey)
    setRangeStart(layerKey)
    if (isRange && from !== -1) {
      const range = shownKeys.slice(Math.min(from, to), Math.max(from, to) + 1)
      onSelect(slot, [...new Set([...selectedKeys, ...range])])
    } else if (selectedKeys.includes(layerKey)) {
      onSelect(
        slot,
        selectedKeys.filter((key) => key !== layerKey),
      )
    } else {
      onSelect(slot, [...selectedKeys, layerKey])
    }
  }

  const renderRow = (layerKey: string, dragHandle?: React.ReactNode) => {
    const layer = ATLAS_LAYER_BY_KEY.get(layerKey)
    if (!layer) return null
    return (
      <LayerRow
        layer={layer}
        slot={slot}
        isSelected={selectedKeys.includes(layerKey)}
        dragHandle={dragHandle}
        onSelect={select}
        onMove={onMove}
      />
    )
  }

  return (
    <StackGroup kind="layers" id={slot} title={title} pill={layerKeys.length} hint={hint}>
      {shownKeys.length === 0 ? null : searchTerm ? (
        <ul className="divide-y divide-gray-100">
          {shownKeys.map((layerKey) => (
            <li key={layerKey}>{renderRow(layerKey)}</li>
          ))}
        </ul>
      ) : (
        <SortableList
          items={layerKeys}
          getItemKey={(layerKey) => layerKey}
          onReorder={(next) => onReorder(slot, next)}
          renderItem={(layerKey, { dragHandle }) => renderRow(layerKey, dragHandle)}
          className="divide-y divide-gray-100 *:my-0!"
        />
      )}
    </StackGroup>
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

const EMPTY_LAYER_KEYS: string[] = []

type LayerOrderEditorProps = { savedOrder: MapLayerOrderEntry[] }

function LayerOrderEditor({ savedOrder }: LayerOrderEditorProps) {
  const queryClient = useQueryClient()
  const [stack, setStack] = useState(() => toLayerStack(savedOrder, ATLAS_LAYERS))
  const [isDirty, setIsDirty] = useState(false)
  const [search, setSearch] = useState('')

  const changeStack = (change: (stack: LayerStack) => LayerStack) => {
    setStack(change)
    setIsDirty(true)
  }
  const reorder = (slot: SlotId, layerKeys: string[]) =>
    changeStack((current) => ({ ...current, [slot]: layerKeys }))
  // Selected layers per position, to move several at once.
  const [selected, setSelected] = useState<LayerStack>({})
  const selectedKeys = Object.values(selected).flat()
  const select = (slot: SlotId, layerKeys: string[]) =>
    setSelected((current) => ({ ...current, [slot]: layerKeys }))
  const move = (layerKeys: string[], to: SlotId | typeof DEFAULT_POSITION) => {
    const moving = new Set(layerKeys)
    changeStack((current) => {
      if (to !== DEFAULT_POSITION) return moveToSlot(current, layerKeys, to)
      // Each layer back to the position from the code.
      return STACK_SLOT_IDS.reduce((next, slot) => {
        const keys = layerKeys.filter((key) => {
          const layer = ATLAS_LAYER_BY_KEY.get(key)
          return layer && listedSlot(layer.defaultBeforeId) === slot
        })
        return keys.length > 0 ? moveToSlot(next, keys, slot) : next
      }, current)
    })
    // Moved layers leave the selection; the rest stays selected.
    setSelected((current) =>
      Object.fromEntries(
        Object.entries(current).map(([slot, keys]) => [slot, keys.filter((k) => !moving.has(k))]),
      ),
    )
  }

  const save = useMutation({
    mutationFn: () =>
      updateMapLayerOrderFn({ data: { entries: toSavedOrder(stack, ATLAS_LAYERS) } }),
    onSuccess: () => {
      setIsDirty(false)
      // The refetch gives the editor a new `key`, so it starts again from the saved order.
      return queryClient.invalidateQueries(mapLayerOrderQueryOptions())
    },
  })

  const searchTerm = search.trim().toLowerCase()

  return (
    <AdminAsideLayout
      sections={TARGET_SLOT_IDS.map((slot) => ({ id: slot, label: slotTitle(slot) }))}
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
            Während der Suche lässt sich die Gruppe ändern, aber nicht die Reihenfolge.
          </p>
        ) : null}
      </div>
      {/* No changes while a save runs: the editor starts again from the saved order afterwards. */}
      <fieldset disabled={save.isPending} className="min-w-0 space-y-2">
        {STACK.map((item) => {
          if ('basemap' in item) {
            return (
              <StackGroup
                key={item.basemap}
                kind="basemap"
                title={item.basemap}
                pill="Hintergrundkarte"
                hint={item.hint}
              />
            )
          }
          if ('fixed' in item) {
            return (
              <StackGroup
                key={item.fixed}
                kind="fixed"
                title={item.fixed}
                pill="nicht sortierbar"
                hint={item.hint}
              />
            )
          }
          // A position without a title is the bottom of another one, see `bottomOf`.
          if (!('title' in item)) return null
          return (
            <PositionGroup
              key={item.slot}
              slot={item.slot}
              title={item.title}
              hint={item.hint}
              layerKeys={stack[item.slot] ?? EMPTY_LAYER_KEYS}
              selectedKeys={selected[item.slot] ?? EMPTY_LAYER_KEYS}
              searchTerm={searchTerm}
              onReorder={reorder}
              onSelect={select}
              onMove={move}
            />
          )
        })}
      </fieldset>
      {selectedKeys.length > 0 ? (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-lg bg-gray-800 px-4 py-2 text-sm text-white shadow-lg">
          <span className="flex-1">{selectedKeys.length} Layer ausgewählt</span>
          <PositionSelect
            label="Ausgewählte Layer verschieben nach"
            value=""
            onChange={(to) => move(selectedKeys, to)}
            className="gap-x-1.5 px-3 py-1.5 font-semibold"
          >
            <ArrowRightEndOnRectangleIcon className="size-5" aria-hidden="true" />
            Verschieben nach …
          </PositionSelect>
          <button
            type="button"
            onClick={() => setSelected({})}
            className="rounded-md px-2 py-1.5 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            Auswahl aufheben
          </button>
        </div>
      ) : null}
    </AdminAsideLayout>
  )
}

export function AdminLayerOrder() {
  const { data: savedOrder, dataUpdatedAt } = useQuery(mapLayerOrderQueryOptions())
  if (!savedOrder) return <p className="text-sm text-gray-500">Lade…</p>

  return <LayerOrderEditor key={dataUpdatedAt} savedOrder={savedOrder} />
}
