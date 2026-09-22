import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { planningPanelTitleInputClass } from '@/components/regionen/pageRegionSlug/Planning/planningPanelStyles'
import { frenchQuote } from '@/components/shared/text/Quotes'
import { createPlanningVariantFn } from '@/server/planning/planning.functions'
import {
  planningAreasQueryOptions,
  planningVariantQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { useSpaceFinderModeParam } from '../useSpaceFinderModeParam'

/** ModePanel detail view for »Neue Variante in diesem Gebiet« (`ff.new === 'variant'`). */
export const SpaceFinderNewVariantDetail = ({
  areaId,
  areaTitle,
  regionSlug,
}: {
  areaId: number
  areaTitle: string
  regionSlug: string
}) => {
  const queryClient = useQueryClient()
  const { spaceFinderMode, setSpaceFinderModeParam } = useSpaceFinderModeParam()
  const [title, setTitle] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      createPlanningVariantFn({ data: { areaId, title: title.trim() || undefined } }),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries(planningAreasQueryOptions(regionSlug))
      await queryClient.invalidateQueries(planningVariantQueryOptions(created.id))
      setSpaceFinderModeParam({ ...spaceFinderMode, key: created.id, new: undefined })
    },
  })

  const closeNew = () => setSpaceFinderModeParam({ ...spaceFinderMode, new: undefined })

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <p className="text-sm text-gray-600">
        Neue Variante für Gebiet {frenchQuote(areaTitle)}. Die Faktoren starten mit den
        Standardwerten.
      </p>
      <label className="flex flex-col gap-1 text-sm text-gray-700">
        Name der Variante (optional)
        <input
          type="text"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z. B. Variante 2"
          className={planningPanelTitleInputClass}
        />
      </label>
      {mutation.isError && (
        <p className="text-xs text-red-600">{String((mutation.error as Error).message)}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Wird angelegt…' : 'Variante anlegen'}
        </button>
        <button
          type="button"
          onClick={closeNew}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}
