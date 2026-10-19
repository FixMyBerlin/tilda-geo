import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { bbox } from '@turf/turf'
import { useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { useSpaceFinderBoundaryActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/space-finder-boundary-store'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { useDebouncedValue } from '@/components/shared/hooks/useDebouncedValue'
import {
  adminBoundariesQueryOptions,
  boundaryGeomQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { spaceFinderTextInputClass } from '../spaceFinderPanelStyles'

// Level 9 varies by region: a Bezirk in Berlin, mostly an Ortsteil in Brandenburg.
const LEVEL_LABELS: Record<string, string> = {
  '8': 'Gemeinde',
  '9': 'Bezirk / Ortsteil',
  '10': 'Ortsteil',
}

type Boundary = { id: string; name: string; name_prefix: string | null; admin_level: string }

// Names repeat across levels (Berlin has „Mitte", „Pankow", „Spandau" … each as Bezirk and as
// Ortsteil). In the list the group heading separates them, in the input after selection it
// doesn't – so show the level there too.
const displayName = (b: Boundary | null) =>
  b ? `${b.name} (${b.name_prefix ?? LEVEL_LABELS[b.admin_level] ?? `Level ${b.admin_level}`})` : ''

/** Searchable combobox to pick an OSM admin boundary (levels 8–10) as the study_area. */
export const BoundaryPicker = ({
  value,
  onChange,
}: {
  value: string | null
  onChange: (boundaryId: string, geom: unknown, name: string) => void
}) => {
  const regionSlug = useRegionSlug()
  const { mainMap: map } = useMap()
  const queryClient = useQueryClient()
  const { setBoundaryHighlightGeom } = useSpaceFinderBoundaryActions()
  const [query, setQuery] = useState('')
  // The selected area comes from the result list at the moment of selection; since the list
  // depends on the search, keep it here instead of looking it up again later.
  const [selected, setSelected] = useState<Boundary | null>(null)
  const [geomLoading, setGeomLoading] = useState(false)
  const [geomError, setGeomError] = useState<string | null>(null)

  // The search runs server-side with LIMIT – debounced so not every keystroke triggers a
  // request.
  const debouncedQuery = useDebouncedValue(query.trim(), 250)
  const { data, isPending } = useQuery(adminBoundariesQueryOptions(regionSlug, debouncedQuery))

  const boundaries = data?.boundaries ?? []
  const currentBoundary = value && selected?.id === value ? selected : null

  const grouped = boundaries.reduce<Record<string, Boundary[]>>((acc, b) => {
    const lvl = b.admin_level
    if (!acc[lvl]) acc[lvl] = []
    acc[lvl].push(b)
    return acc
  }, {})

  // The geometry is not part of the list but loaded here (otherwise the list would have to
  // ship all outlines of the region – a few hundred kilobytes for Berlin).
  const handleChange = async (boundary: Boundary | null) => {
    if (!boundary) return
    setSelected(boundary)
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

  if (isPending && debouncedQuery === '')
    return <span className="text-xs text-gray-400">Lade Gebiete…</span>
  // Data gap, not a user error: `public.boundaries` is empty or has no boundaries within the
  // region outline (processing not yet run for this region). Make it clearly visible, otherwise
  // the area search looks like it vanished. An empty result *with* a search term just means
  // „nichts gefunden“ and is reported in the list below.
  if (debouncedQuery === '' && boundaries.length === 0)
    return (
      <div className="rounded border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
        Für diese Region sind keine Gebietsgrenzen verfügbar (Tabelle <code>public.boundaries</code>{' '}
        ist leer). Bitte über „Eigenes Gebiet“ ein Polygon zeichnen oder eine GeoJSON-Datei
        hochladen.
      </div>
    )

  return (
    <Combobox as="div" value={currentBoundary} onChange={handleChange} by="id">
      <ComboboxInput
        className={`w-full ${spaceFinderTextInputClass}`}
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
        {data?.hasMore && (
          <div className="border-t border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-500">
            … weitere Treffer vorhanden. Suche verfeinern.
          </div>
        )}
        {boundaries.length === 0 && (
          <div className="px-3 py-2 text-gray-400">Keine Ergebnisse.</div>
        )}
      </ComboboxOptions>
    </Combobox>
  )
}
