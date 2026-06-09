import { useQuery } from '@tanstack/react-query'
import { adminBoundariesQueryOptions } from '@/server/planning/planningQueryOptions'

const LEVEL_LABELS: Record<string, string> = {
  '8': 'Gemeinde',
  '9': 'Bezirk',
  '10': 'Stadtteil',
}

type Boundary = { id: string; name: string; admin_level: string; geom: unknown }

/** Dropdown to pick an OSM admin boundary (levels 8–10) as the study_area. */
export const BoundaryPicker = ({
  value,
  onChange,
  regionSlug,
}: {
  value: string | null
  onChange: (boundaryId: string, geom: unknown) => void
  regionSlug: string
}) => {
  const { data: boundaries, isLoading } = useQuery(adminBoundariesQueryOptions(regionSlug))

  if (isLoading) return <span className="text-xs text-gray-400">Lade Gebiete…</span>
  if (!boundaries?.length)
    return <span className="text-xs text-gray-400">Keine Gebiete gefunden.</span>

  // Group by admin_level for <optgroup>
  const grouped = boundaries.reduce<Record<string, Boundary[]>>((acc, b) => {
    const lvl = b.admin_level
    if (!acc[lvl]) acc[lvl] = []
    acc[lvl].push(b)
    return acc
  }, {})

  return (
    <select
      value={value ?? ''}
      onChange={(e) => {
        const selected = boundaries.find((b) => b.id === e.target.value)
        if (selected) onChange(selected.id, selected.geom)
      }}
      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
    >
      <option value="" disabled>
        Gebiet auswählen…
      </option>
      {Object.entries(grouped)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([level, items]) => (
          <optgroup key={level} label={LEVEL_LABELS[level] ?? `Level ${level}`}>
            {items.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </optgroup>
        ))}
    </select>
  )
}
