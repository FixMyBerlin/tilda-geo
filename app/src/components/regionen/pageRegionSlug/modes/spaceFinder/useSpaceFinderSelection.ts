import { useQuery } from '@tanstack/react-query'
import { planningVariantQueryOptions } from '@/server/planning/planningQueryOptions'
import { candidateRunKey } from '../../hooks/mapState/space-finder-candidates-store'
import { useCurrentMode } from '../useCurrentMode'
import { isSpaceFinderAreaFormOpen } from './spaceFinderModeParam'
import { useSpaceFinderModeParam } from './useSpaceFinderModeParam'

/**
 * Resolves the active variant, its planungsgebiet and its shown run from `space.key` (D7: the URL only
 * holds the variant id — area and run are both derived from it, not stored separately). The variant
 * query is only enabled while the Flächenfinder mode is actually mounted, so `space.key` surviving a
 * mode switch (D3) does not keep fetching planning data on every other region page.
 *
 * While a Planungsgebiet is being created or edited there is no shown run (`runId` null), so every
 * consumer — result layers, interactive layers, candidate tool, hexagon inspector — treats the
 * result as gone; `variantId`/`areaId` stay as the way back and the Gebiet being edited.
 */
export const useSpaceFinderSelection = () => {
  const { spaceFinderMode } = useSpaceFinderModeParam()
  const { isSpaceFinder } = useCurrentMode()
  const variantId = spaceFinderMode.key ?? null
  const areaFormOpen = isSpaceFinderAreaFormOpen(spaceFinderMode)

  const { data: variant } = useQuery({
    ...planningVariantQueryOptions(variantId!),
    enabled: isSpaceFinder && variantId != null,
  })

  const runId = areaFormOpen ? null : (variant?.currentRunId ?? null)
  const run = runId == null ? undefined : variant?.runs.find((candidate) => candidate.id === runId)

  return {
    variantId,
    areaId: variant?.area.id ?? null,
    runId,
    /** Key of the shown run in the candidate store (`candidateRunKey`); null without a run. */
    candidateRunKey: run ? candidateRunKey(run) : null,
    variant,
    areaFormOpen,
  }
}
