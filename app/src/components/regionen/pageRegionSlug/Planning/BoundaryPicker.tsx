import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { bbox } from '@turf/turf'
import { useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { usePlanningBoundaryState } from '@/components/regionen/pageRegionSlug/hooks/mapState/usePlanningBoundaryState'
import {
  adminBoundariesQueryOptions,
  boundaryGeomQueryOptions,
} from '@/server/planning/planningQueryOptions'

// Level 9 ist regional uneinheitlich: in Berlin Bezirk, in Brandenburg meist Ortsteil.
const LEVEL_LABELS: Record<string, string> = {
  '8': 'Gemeinde',
  '9': 'Bezirk / Ortsteil',
  '10': 'Ortsteil',
}

type Boundary = { id: string; name: string; name_prefix: string | null; admin_level: string }

// Die Liste enthält alle Gebiete der Region (in Berlin über 3.000). Alle davon als Combobox-Optionen
// zu rendern macht jeden Tastendruck spürbar langsam – deshalb hart auf 20 Treffer begrenzen und
// den Rest über „Suche verfeinern“ ausblenden.
const MAX_RESULTS = 20

// Bei nur 20 sichtbaren Treffern muss das Naheliegende oben stehen: erst exakte Namen, dann
// Präfix-Treffer („Mitte“ vor „Alt-Mitte“), dann Treffer an einer Wortgrenze, dann der Rest.
const matchRank = (name: string, query: string) => {
  const n = name.toLowerCase()
  if (n === query) return 0
  if (n.startsWith(query)) return 1
  if (new RegExp(`\\b${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(n)) return 2
  return 3
}

// Namen wiederholen sich über die Ebenen hinweg (Berlin hat „Mitte", „Pankow", „Spandau" … jeweils
// als Bezirk und als Ortsteil). In der Liste trennt das die Gruppen-Überschrift, im Eingabefeld
// nach der Auswahl nicht – deshalb dort die Ebene mit anzeigen.
const displayName = (b: Boundary | null) =>
  b ? `${b.name} (${b.name_prefix ?? LEVEL_LABELS[b.admin_level] ?? `Level ${b.admin_level}`})` : ''

/** Searchable combobox to pick an OSM admin boundary (levels 8–10) as the study_area. */
export const BoundaryPicker = ({
  value,
  onChange,
  regionSlug,
}: {
  value: string | null
  onChange: (boundaryId: string, geom: unknown, name: string) => void
  regionSlug: string
}) => {
  const { mainMap: map } = useMap()
  const queryClient = useQueryClient()
  const { data: boundaries, isLoading } = useQuery(adminBoundariesQueryOptions(regionSlug))
  const setBoundaryHighlightGeom = usePlanningBoundaryState((s) => s.setBoundaryHighlightGeom)
  const [query, setQuery] = useState('')
  const [geomLoading, setGeomLoading] = useState(false)
  const [geomError, setGeomError] = useState<string | null>(null)

  if (isLoading) return <span className="text-xs text-gray-400">Lade Gebiete…</span>
  // Datenlücke, kein Nutzerfehler: `public.boundaries` ist leer bzw. enthält keine Grenzen im
  // Regions-Umriss (Processing für diese Region noch nicht gelaufen). Deutlich sichtbar machen,
  // sonst wirkt es, als wäre die Gebietssuche verschwunden.
  if (!boundaries?.length)
    return (
      <div className="rounded border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
        Für diese Region sind keine Gebietsgrenzen verfügbar (Tabelle <code>public.boundaries</code>{' '}
        ist leer). Bitte über „Eigenes Gebiet“ ein Polygon zeichnen oder eine GeoJSON-Datei
        hochladen.
      </div>
    )

  const normalizedQuery = query.trim().toLowerCase()
  const matchingBoundaries =
    normalizedQuery === ''
      ? boundaries
      : boundaries
          .filter((b) => b.name.toLowerCase().includes(normalizedQuery))
          // Stabil sortieren: die Server-Reihenfolge (admin_level, name) bleibt innerhalb einer
          // Rang-Gruppe erhalten.
          .sort((a, b) => matchRank(a.name, normalizedQuery) - matchRank(b.name, normalizedQuery))

  const visibleBoundaries = matchingBoundaries.slice(0, MAX_RESULTS)
  const hiddenCount = matchingBoundaries.length - visibleBoundaries.length

  const grouped = visibleBoundaries.reduce<Record<string, Boundary[]>>((acc, b) => {
    const lvl = b.admin_level
    if (!acc[lvl]) acc[lvl] = []
    acc[lvl].push(b)
    return acc
  }, {})

  const currentBoundary = value ? (boundaries.find((b) => b.id === value) ?? null) : null

  // Die Geometrie hängt nicht an der Liste, sondern wird erst hier nachgeladen (sonst müsste die
  // Liste alle Umrisse der Region mitliefern – für Berlin einige hundert Kilobyte).
  const handleChange = async (boundary: Boundary | null) => {
    if (!boundary) return
    setGeomError(null)
    setGeomLoading(true)
    try {
      const geom = await queryClient.fetchQuery(boundaryGeomQueryOptions(regionSlug, boundary.id))
      onChange(boundary.id, geom, boundary.name)
      setBoundaryHighlightGeom(geom)

      if (map) {
        const [minLng, minLat, maxLng, maxLat] = bbox({
          type: 'Feature',
          geometry: geom as any,
          properties: {},
        })
        map.fitBounds([minLng, minLat, maxLng, maxLat], { padding: 60, duration: 800 })
      }
    } catch (error) {
      console.error(error)
      setGeomError('Die Gebietsgrenze konnte nicht geladen werden. Bitte erneut versuchen.')
    } finally {
      setGeomLoading(false)
    }
  }

  return (
    <Combobox as="div" value={currentBoundary} onChange={handleChange} by="id">
      <ComboboxInput
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
        displayValue={displayName}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setQuery('')}
        placeholder="Gebiet suchen…"
      />
      {geomLoading && <p className="mt-1 text-xs text-gray-400">Lade Gebietsgrenze…</p>}
      {geomError && <p className="mt-1 text-xs text-red-600">{geomError}</p>}
      <ComboboxOptions
        anchor="bottom start"
        className="z-50 max-h-60 w-[var(--input-width)] overflow-auto rounded border border-gray-200 bg-white text-sm shadow-lg empty:hidden"
      >
        {Object.entries(grouped)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([level, items]) => (
            <div key={level}>
              <div className="bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-500 uppercase">
                {LEVEL_LABELS[level] ?? `Level ${level}`}
              </div>
              {items.map((b) => (
                <ComboboxOption
                  key={b.id}
                  value={b}
                  className="cursor-pointer px-3 py-1 data-focus:bg-blue-50 data-selected:font-medium"
                >
                  {b.name}
                </ComboboxOption>
              ))}
            </div>
          ))}
        {hiddenCount > 0 && (
          <div className="border-t border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-500">
            … {hiddenCount.toLocaleString('de-DE')} weitere Treffer. Suche verfeinern.
          </div>
        )}
        {matchingBoundaries.length === 0 && (
          <div className="px-3 py-2 text-gray-400">Keine Ergebnisse.</div>
        )}
      </ComboboxOptions>
    </Combobox>
  )
}
