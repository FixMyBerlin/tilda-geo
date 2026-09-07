import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Reorder, useDragControls } from 'motion/react'
import type React from 'react'
import { useState } from 'react'
import { getAllAtlasLayerEntries } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/sortLayers/getAllAtlasLayerKeys'
import { updateMapLayerOrderFn } from '@/server/map-layer-order/map-layer-order.functions'
import { mapLayerOrderQueryOptions } from '@/server/map-layer-order/mapLayerOrderQueryOptions'
import type { MapLayerOrderEntry } from '@/server/map-layer-order/queries/getMapLayerOrder.server'
import {
  DEFAULT_GROUP,
  flattenGroups,
  GROUPS,
  GROUP_LABELS,
  GroupKeySchema,
  initGroups,
  type GroupedState,
  type GroupKey,
} from './layerOrderGroups'

// Static, region-independent — compute once, not per render/drag-update.
const CODE_ENTRIES = getAllAtlasLayerEntries()
const CODE_KEYS = CODE_ENTRIES.map((e) => e.layerKey)
const CODE_KEY_SET = new Set(CODE_KEYS)
const CODE_DEFAULT_BEFORE_ID = new Map(CODE_ENTRIES.map((e) => [e.layerKey, e.defaultBeforeId]))

type LayerRowProps = {
  layerKey: string
  group: GroupKey
  isStale: boolean
  isNew: boolean
  defaultBeforeId?: string
  onMove: (layerKey: string, from: GroupKey, to: GroupKey) => void
}

function LayerRow({ layerKey, group, isStale, isNew, defaultBeforeId, onMove }: LayerRowProps) {
  // Dedicated drag handle so dragging never conflicts with the group <select>
  // (touch/trackpad: the whole row as drag surface swallows select interactions).
  const dragControls = useDragControls()

  function handleDragPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    dragControls.start(event)
  }

  function handleGroupChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const parsed = GroupKeySchema.safeParse(event.currentTarget.value)
    if (parsed.success) onMove(layerKey, group, parsed.data)
  }

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
        onPointerDown={handleDragPointerDown}
      >
        ⠿
      </button>
      <span className="grow font-mono break-all">
        {layerKey}
        {defaultBeforeId && (
          <span className="ml-2 rounded bg-gray-100 px-1 py-0.5 text-gray-600">
            → {defaultBeforeId}
          </span>
        )}
        {isStale && (
          <span className="ml-2 rounded bg-red-100 px-1 py-0.5 text-red-700">
            nicht mehr im Code, wird beim Speichern entfernt
          </span>
        )}
        {isNew && <span className="ml-2 rounded bg-amber-100 px-1 py-0.5 text-amber-700">neu</span>}
      </span>
      <select
        aria-label="Gruppe wechseln"
        className="shrink-0 rounded border-gray-300 py-0.5 text-xs"
        value={group}
        onChange={handleGroupChange}
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

type LayerOrderEditorProps = {
  dbEntries: MapLayerOrderEntry[]
}

function LayerOrderEditor({ dbEntries }: LayerOrderEditorProps) {
  const queryClient = useQueryClient()
  const dbKeySet = new Set(dbEntries.map((e) => e.layerKey))
  const [groups, setGroups] = useState<GroupedState>(() => initGroups(dbEntries, CODE_KEYS))

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
      const entries = flattenGroups(groups, CODE_KEY_SET)
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
        So funktioniert die Sortierung: Jede Gruppe steht für eine feste Stelle in der
        Hintergrundkarte, zum Beispiel „Unter Straßennamen“. Innerhalb einer Gruppe gilt: Was in der
        Liste weiter unten steht, liegt auf der Karte weiter oben.
      </p>
      <p className="text-sm text-gray-600">
        Die Gruppe „Standard“ ist ein Sonderfall: Diese Layer haben keine eigene Gruppe, sondern
        übernehmen ihre Position aus der Karten-Konfiguration – meist abhängig vom Layer-Typ:
        Flächen liegen unter der Landnutzung, Linien unter den Landesgrenzen, Punkte und
        Beschriftungen unter den Hausnummern. Der graue Hinweis hinter dem Namen (z. B. „→ landuse“)
        zeigt diese Position. Beim Sortieren zählt deshalb nur die Reihenfolge zwischen Layern mit
        demselben grauen Hinweis; Layer mit unterschiedlichen Hinweisen beeinflussen sich nicht,
        egal wo sie in der Liste stehen. Um einen Layer gezielt zu verschieben, weist man ihm rechts
        eine feste Gruppe zu.
      </p>
      <p className="text-sm text-gray-600">
        Gut zu wissen: Die Gruppen wirken nur auf dem Standard-Hintergrund. Ein Raster-Hintergrund
        (Luftbild, Mapnik usw.) wird selbst in die Basemap eingefügt, und zwar an der Stelle „Unter
        Straßennamen“: Er verdeckt alles darunter, Straßennamen und Hausnummern der Basemap bleiben
        sichtbar. Alle Daten-Layer liegen dann darüber – ganz oben, unabhängig von den Gruppen.
        Sortieren lassen sich hier nur die Atlas-Geo-Layer. Hintergründe, statische Daten, Notizen,
        QA und Maske haben eine feste Reihenfolge zueinander, die im Code festgelegt ist.
      </p>
      <p className="text-sm text-gray-600">
        Gespeichert wird eine einzige globale Liste – nicht eine Liste pro Region. Jede Region zeigt
        nur die Layer ihrer Kategorien; diese Teilmenge wird beim Laden der Karte nach der globalen
        Liste sortiert. Solange noch nichts gespeichert wurde, gilt die Reihenfolge aus dem Code –
        dort folgt sie der Kategorie-Reihenfolge der jeweiligen Region. Ab dem ersten Speichern gilt
        für alle Regionen dieselbe Liste; Regionen mit abweichender Kategorie-Reihenfolge können
        sich dadurch leicht ändern. Gespeicherte Änderungen sind sichtbar, sobald die Karte neu
        geladen wird.
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
                  defaultBeforeId={
                    group === DEFAULT_GROUP ? CODE_DEFAULT_BEFORE_ID.get(layerKey) : undefined
                  }
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
