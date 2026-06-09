import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMap } from 'react-map-gl/maplibre'
import { createPlanningScenarioFn } from '@/server/planning/planning.functions'
import { planningScenariosQueryOptions } from '@/server/planning/planningQueryOptions'
import { usePlanningScenarioParam } from '../hooks/useQueryState/usePlanningParams'
import { boundsToPolygon, FAHRRADBOX_TEMPLATE } from './planningDefaults'

/** Lists the region's scenarios (with parent/child lineage) and creates new ones. */
export const ScenarioList = ({ regionSlug }: { regionSlug: string }) => {
  const queryClient = useQueryClient()
  const { current: map } = useMap()
  const [activeScenario, setActiveScenario] = usePlanningScenarioParam()
  const { data: scenarios } = useQuery(planningScenariosQueryOptions(regionSlug))

  const createMutation = useMutation({
    mutationFn: () => {
      const bounds = map?.getBounds()
      if (!bounds) throw new Error('Karte noch nicht bereit')
      return createPlanningScenarioFn({
        data: {
          regionSlug,
          title: `Szenario ${new Date().toLocaleString('de-DE')}`,
          factorConfig: { ...FAHRRADBOX_TEMPLATE, study_area: boundsToPolygon(bounds) },
        },
      })
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries(planningScenariosQueryOptions(regionSlug))
      setActiveScenario(created.id)
    },
  })

  // Order children directly under their parent for a simple lineage view.
  const byParent = new Map<number | null, typeof scenarios>()
  for (const s of scenarios ?? []) {
    const arr = byParent.get(s.parentId) ?? []
    arr.push(s)
    byParent.set(s.parentId, arr)
  }
  const rows: { scenario: NonNullable<typeof scenarios>[number]; depth: number }[] = []
  const walk = (parentId: number | null, depth: number) => {
    for (const s of byParent.get(parentId) ?? []) {
      rows.push({ scenario: s, depth })
      walk(s.id, depth + 1)
    }
  }
  walk(null, 0)

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => createMutation.mutate()}
        disabled={createMutation.isPending}
        className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-50"
      >
        + Neues Szenario (aktueller Kartenausschnitt)
      </button>

      <ul className="flex flex-col gap-0.5">
        {rows.map(({ scenario, depth }) => (
          <li key={scenario.id} style={{ paddingLeft: depth * 12 }}>
            <button
              type="button"
              onClick={() => setActiveScenario(scenario.id)}
              className={`w-full rounded px-2 py-1 text-left text-sm hover:bg-gray-100 ${
                activeScenario === scenario.id ? 'bg-blue-50 font-medium' : ''
              }`}
            >
              {depth > 0 && <span className="text-gray-400">↳ </span>}
              {scenario.title}
              <span className="ml-1 text-xs text-gray-500">
                {scenario.creator?.osmName ? `· ${scenario.creator.osmName}` : ''}
              </span>
            </button>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="px-2 py-1 text-sm text-gray-500">Noch keine Szenarien.</li>
        )}
      </ul>
    </div>
  )
}
