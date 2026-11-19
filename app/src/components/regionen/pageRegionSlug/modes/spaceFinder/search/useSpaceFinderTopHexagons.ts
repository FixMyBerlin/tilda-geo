import { useQuery } from '@tanstack/react-query'
import {
  useSpaceFinderMinAreaDraft,
  useSpaceFinderTopDraft,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/space-finder-factor-draft-store'
import { useDebouncedValue } from '@/components/shared/hooks/useDebouncedValue'
import { spaceFinderTopHexagonsQueryOptions } from '@/server/space-finder/spaceFinderQueryOptions'
import { appliedMinAreaM2, appliedTopCount } from '../spaceFinderModeParam'
import { useSpaceFinderModeParam } from '../useSpaceFinderModeParam'
import { useSpaceFinderSelection } from '../useSpaceFinderSelection'

// Each ranking clusters the whole run on the server, so typing waits for a pause.
const DRAFT_DEBOUNCE_MS = 300

export const useSpaceFinderTopHexagons = () => {
  const { runId, variant } = useSpaceFinderSelection()
  const { spaceFinderMode } = useSpaceFinderModeParam()
  const topDraft = useSpaceFinderTopDraft()
  const minAreaDraft = useSpaceFinderMinAreaDraft()
  const count = useDebouncedValue(appliedTopCount(spaceFinderMode.top, topDraft), DRAFT_DEBOUNCE_MS)
  const minAreaM2 = useDebouncedValue(
    appliedMinAreaM2(
      spaceFinderMode.minArea === true,
      variant?.factorConfig.min_area_m2,
      minAreaDraft,
    ),
    DRAFT_DEBOUNCE_MS,
  )
  const enabled = runId != null && spaceFinderMode.top != null && count != null

  const query = useQuery({
    ...spaceFinderTopHexagonsQueryOptions({
      runId: runId ?? 0,
      count: count ?? 1,
      minAreaM2,
      by: spaceFinderMode.topBy ?? 'area',
    }),
    enabled,
  })

  const result = enabled ? (query.data ?? null) : null
  return {
    topHexagons: result?.hexagons ?? null,
    topRequest: result?.request ?? null,
    isFetching: enabled && query.isFetching,
  }
}
