import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { useQuery } from '@tanstack/react-query'
import { bbox } from '@turf/turf'
import { useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { usePlanningBoundaryState } from '@/components/regionen/pageRegionSlug/hooks/mapState/usePlanningBoundaryState'
import { adminBoundariesQueryOptions } from '@/server/planning/planningQueryOptions'

const LEVEL_LABELS: Record<string, string> = {
  '8': 'Gemeinde',
  '9': 'Bezirk',
}

type Boundary = { id: string; name: string; admin_level: string; geom: unknown }

/** Searchable combobox to pick an OSM admin boundary (levels 8–9) as the study_area. */
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
  const { data: boundaries, isLoading } = useQuery(adminBoundariesQueryOptions(regionSlug))
  const setBoundaryHighlightGeom = usePlanningBoundaryState((s) => s.setBoundaryHighlightGeom)
  const [query, setQuery] = useState('')

  if (isLoading) return <span className="text-xs text-gray-400">Lade Gebiete…</span>
  if (!boundaries?.length)
    return <span className="text-xs text-gray-400">Keine Gebiete gefunden.</span>

  const filteredBoundaries = boundaries
    .filter((b) => b.admin_level !== '10')
    .filter((b) => query === '' || b.name.toLowerCase().includes(query.toLowerCase()))

  const grouped = filteredBoundaries.reduce<Record<string, Boundary[]>>((acc, b) => {
    const lvl = b.admin_level
    if (!acc[lvl]) acc[lvl] = []
    acc[lvl].push(b)
    return acc
  }, {})

  const currentBoundary = value ? (boundaries.find((b) => b.id === value) ?? null) : null

  const handleChange = (boundary: Boundary | null) => {
    if (!boundary) return
    onChange(boundary.id, boundary.geom, boundary.name)
    setBoundaryHighlightGeom(boundary.geom as object)

    if (map) {
      const [minLng, minLat, maxLng, maxLat] = bbox({
        type: 'Feature',
        geometry: boundary.geom as any,
        properties: {},
      })
      map.fitBounds([minLng, minLat, maxLng, maxLat], { padding: 60, duration: 800 })
    }
  }

  return (
    <Combobox as="div" value={currentBoundary} onChange={handleChange} by="id">
      <ComboboxInput
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
        displayValue={(b: Boundary | null) => b?.name ?? ''}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setQuery('')}
        placeholder="Gebiet suchen…"
      />
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
        {filteredBoundaries.length === 0 && (
          <div className="px-3 py-2 text-gray-400">Keine Ergebnisse.</div>
        )}
      </ComboboxOptions>
    </Combobox>
  )
}
