import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Reorder, useDragControls } from 'motion/react'
import { useState } from 'react'
import { z } from 'zod'
import { getAllAtlasLayerKeys } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/sortLayers/getAllAtlasLayerKeys'
import { ATLAS_APP_ANCHOR_IDS } from '@/components/regionen/pageRegionSlug/mapData/types'
import { updateMapLayerOrderFn } from '@/server/map-layer-order/map-layer-order.functions'
import { mapLayerOrderQueryOptions } from '@/server/map-layer-order/mapLayerOrderQueryOptions'
import type { MapLayerOrderEntry } from '@/server/map-layer-order/queries/getMapLayerOrder.server'
import { AtlasAppAnchorIdSchema } from '@/server/map-layer-order/schemas'

// Layers without an explicit anchor keep their config/type-based default placement.
const DEFAULT_GROUP = 'default' as const
const GROUPS = [DEFAULT_GROUP, ...ATLAS_APP_ANCHOR_IDS] as const
type GroupKey = (typeof GROUPS)[number]
const GroupKeySchema = z.enum(GROUPS)

const GROUP_LABELS: Record<GroupKey, string> = {
  default: 'Standard (Platzierung aus Config)',
  'atlas-app-beforeid-above-landuse': 'Über Landnutzung (ganz unten)',
  'atlas-app-beforeid-below-road': 'Unter Straßen',
  'atlas-app-beforeid-below-roadname': 'Unter Straßennamen',
  'atlas-app-beforeid-group2': 'Gruppe 2',
  'atlas-app-beforeid-fallback': 'Fallback-Gruppe',
  'atlas-app-beforeid-group1': 'Gruppe 1',
  'atlas-app-beforeid-top': 'Ganz oben',
}

// Static, region-independent — compute once, not per render/drag-update.
const CODE_KEYS = getAllAtlasLayerKeys()
const CODE_KEY_SET = new Set(CODE_KEYS)

type GroupedState = Record<GroupKey, string[]>

const EMPTY_GROUPED_STATE = {
  default: [],
  'atlas-app-beforeid-above-landuse': [],
  'atlas-app-beforeid-below-road': [],
  'atlas-app-beforeid-below-roadname': [],
  'atlas-app-beforeid-group2': [],
  'atlas-app-beforeid-fallback': [],
  'atlas-app-beforeid-group1': [],
  'atlas-app-beforeid-top': [],
} satisfies GroupedState

function initGroups(dbEntries: MapLayerOrderEntry[]) {
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
  // Code keys missing from the DB appear at the end of the default group.
  for (const key of CODE_KEYS) {
    if (!dbKeys.has(key)) groups[DEFAULT_GROUP].push(key)
  }
  return groups
}

function LayerRow({
  layerKey,
  group,
  isStale,
  isNew,
  onMove,
}: {
  layerKey: string
  group: GroupKey
  isStale: boolean
  isNew: boolean
  onMove: (layerKey: string, from: GroupKey, to: GroupKey) => void
}) {
  // Dedicated drag handle so dragging never conflicts with the group <select>
  // (touch/trackpad: the whole row as drag surface swallows select interactions).
  const dragControls = useDragControls()
  return (
    <Reorder.Item
      value={layerKey}
      dragListener={false}
      dragControls={dragControls}
      className="flex items-center justify-between gap-2 rounded border border-gray-200 bg-white px-2 py-1 text-xs"
    >
      <button
        type="button"
        aria-label="Ziehen zum Sortieren"
        className="cursor-grab touch-none px-1 text-gray-400 select-none active:cursor-grabbing"
        onPointerDown={(event) => dragControls.start(event)}
      >
        ⠿
      </button>
      <span className="grow font-mono break-all">
        {layerKey}
        {isStale && (
          <span className="ml-2 rounded bg-red-100 px-1 py-0.5 text-red-700">
            nicht mehr im Code — wird beim Speichern entfernt
          </span>
        )}
        {isNew && <span className="ml-2 rounded bg-amber-100 px-1 py-0.5 text-amber-700">neu</span>}
      </span>
      <select
        aria-label="Gruppe wechseln"
        className="shrink-0 rounded border-gray-300 py-0.5 text-xs"
        value={group}
        onChange={(event) => {
          const parsed = GroupKeySchema.safeParse(event.target.value)
          if (parsed.success) onMove(layerKey, group, parsed.data)
        }}
      >
        {GROUPS.map((g) => (
          <option key={g} value={g}>
            {GROUP_LABELS[g]}
          </option>
        ))}
      </select>
    </Reorder.Item>
  )
}

function LayerOrderEditor({ dbEntries }: { dbEntries: MapLayerOrderEntry[] }) {
  const queryClient = useQueryClient()
  const dbKeySet = new Set(dbEntries.map((e) => e.layerKey))
  const [groups, setGroups] = useState<GroupedState>(() => initGroups(dbEntries))

  const moveToGroup = (layerKey: string, from: GroupKey, to: GroupKey) => {
    if (from === to) return
    // Inserted at the end of the target group = topmost within that group on the map;
    // fine placement happens via drag afterwards.
    setGroups((prev) => ({
      ...prev,
      [from]: prev[from].filter((k) => k !== layerKey),
      [to]: [...prev[to], layerKey],
    }))
  }

  const {
    mutate: save,
    isPending: saving,
    error: saveError,
  } = useMutation({
    mutationFn: () => {
      // Flatten bottom-first: group order is irrelevant for splicing (beforeId decides),
      // but keeping a deterministic full-list order keeps positions stable and readable.
      const entries = GROUPS.flatMap((group) =>
        groups[group]
          .filter((layerKey) => CODE_KEY_SET.has(layerKey)) // drop stale keys
          .map((layerKey) => ({
            layerKey,
            beforeId: group === DEFAULT_GROUP ? null : group,
          })),
      )
      // Guard against destructive saves: dropping many entries (drifted keys) should be
      // a conscious decision, not a silent side effect.
      if (dbEntries.length > 0 && entries.length < dbEntries.length) {
        const dropped = dbEntries.length - entries.length
        if (
          !window.confirm(
            `${dropped} Einträge sind nicht mehr im Code und werden beim Speichern entfernt. Fortfahren?`,
          )
        ) {
          return Promise.reject(new Error('Abgebrochen'))
        }
      }
      return updateMapLayerOrderFn({ data: { entries, baselineCount: dbEntries.length } })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mapLayerOrder'] }),
  })

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Reihenfolge innerhalb einer Gruppe: unten in der Liste = oben auf der Karte. Die Gruppen
        bestimmen, wo die Layer in die Basemap eingespleißt werden (beforeId-Anker). Änderungen
        wirken nach dem nächsten Laden der Karte.
      </p>
      <p className="text-sm text-gray-600">
        Hinweise: Die Gruppen gelten nur für den Standard-Hintergrund — auf eigenen
        Raster-Hintergründen liegen alle Daten-Layer oben. Sortierbar sind hier nur Atlas-Geo-Layer;
        Hintergründe, statische Daten, Notes, QA und Maske haben feste Positionen relativ zueinander
        (Interleaving nur über die Anker-Gruppen).
      </p>
      {GROUPS.map((group) => (
        <section key={group}>
          <h2 className="mb-2 text-sm font-semibold text-gray-900">
            {GROUP_LABELS[group]}{' '}
            <span className="font-normal text-gray-500">({groups[group].length})</span>
          </h2>
          {groups[group].length === 0 ? (
            <p className="text-xs text-gray-400">Keine Layer in dieser Gruppe.</p>
          ) : (
            <Reorder.Group
              axis="y"
              values={groups[group]}
              onReorder={(newOrder: string[]) =>
                setGroups((prev) => ({ ...prev, [group]: newOrder }))
              }
              className="space-y-1"
            >
              {groups[group].map((layerKey) => (
                <LayerRow
                  key={layerKey}
                  layerKey={layerKey}
                  group={group}
                  isStale={!CODE_KEY_SET.has(layerKey)}
                  isNew={!dbKeySet.has(layerKey)}
                  onMove={moveToGroup}
                />
              ))}
            </Reorder.Group>
          )}
        </section>
      ))}
      {saveError && saveError.message !== 'Abgebrochen' && (
        <p className="text-sm text-red-700">{saveError.message}</p>
      )}
      <button
        type="button"
        onClick={() => save()}
        disabled={saving}
        className="rounded bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-300 disabled:opacity-50"
      >
        {saving ? 'Speichern…' : 'Reihenfolge speichern'}
      </button>
    </div>
  )
}

export function AdminLayerOrder() {
  const { data: dbEntries, dataUpdatedAt } = useQuery(mapLayerOrderQueryOptions())
  if (!dbEntries) return <p className="text-sm text-gray-500">Lade…</p>
  // Re-initialize the editor state after (re)fetches — dataUpdatedAt only changes when the
  // query actually refetched (own save → invalidate), not on every render.
  return <LayerOrderEditor key={dataUpdatedAt} dbEntries={dbEntries} />
}
