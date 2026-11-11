import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useEffectEvent, useRef } from 'react'
import { useSpaceFinderLayersActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/space-finder-layers-store'
import { useMapActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { Spinner } from '@/components/shared/Spinner/Spinner'
import {
  spaceFinderJobQueryOptions,
  spaceFinderVariantQueryOptions,
} from '@/server/space-finder/spaceFinderQueryOptions'
import { useActivateSpaceFinderFactorLayers } from '../display/useActivateSpaceFinderFactorLayers'
import { deriveScoringStep, SpaceFinderRunSteps } from './SpaceFinderRunSteps'

const LABELS: Record<string, string> = {
  QUEUED: 'In Warteschlange…',
  RUNNING: 'Berechnung läuft…',
  DONE: 'Fertig',
  FAILED: 'Fehlgeschlagen',
}

const COLORS: Record<string, string> = {
  QUEUED: 'bg-gray-200 text-gray-800',
  RUNNING: 'bg-blue-100 text-blue-800',
  DONE: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
}

/**
 * Polls a job until DONE/FAILED. On DONE, shows the run on the map + refreshes variant, and
 * switches on the map layers with the input data of the weighted factors, the normal ones and
 * the mode's own (Vegetation, Fahrbahnen, Zensus).
 */
export const JobStatusBadge = ({ jobId, variantId }: { jobId: number; variantId: number }) => {
  const queryClient = useQueryClient()
  const { clearInspectorFeatures } = useMapActions()

  const { data } = useQuery({
    ...spaceFinderJobQueryOptions(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'DONE' || status === 'FAILED' ? false : 2000
    },
  })

  // Only a job that was seen running here counts as "just finished": opening a variant whose
  // job is long done must not switch layers on again that the user has hidden since.
  const activeJobId = useRef<number | null>(null)
  const activateFactorLayers = useActivateSpaceFinderFactorLayers()
  const { setVegetationVisible, setCarriagewaysVisible, setCensusVisible } =
    useSpaceFinderLayersActions()
  const showFactorLayers = useEffectEvent(() => {
    if (!data) return
    activateFactorLayers(data.weights)
    // Only ever on, never off: a layer the user switched on stays.
    if ((data.weights.w_vegetation ?? 0) > 0) setVegetationVisible(true)
    if (data.excludeCarriageways) setCarriagewaysVisible(true)
    if ((data.weights.w_bewohnerbedarf ?? 0) > 0) setCensusVisible(true)
  })

  useEffect(() => {
    if (data?.status === 'QUEUED' || data?.status === 'RUNNING') activeJobId.current = jobId
    if (data?.status !== 'DONE' || data.resultRunId == null) return
    if (activeJobId.current === jobId) {
      activeJobId.current = null
      showFactorLayers()
    }
    // No explicit "show this run" write: the shown run is always `variant.currentRunId` (D7), which
    // the worker already set server-side — this invalidation just refetches it.
    queryClient.invalidateQueries(spaceFinderVariantQueryOptions(variantId))
    queryClient.invalidateQueries({ queryKey: ['spaceFinder', 'areas'] })
    // An open hexagon inspector shows the previous run's frozen snapshot.
    clearInspectorFeatures()
  }, [data?.status, data?.resultRunId, jobId, variantId, queryClient, clearInspectorFeatures])

  // The "Neu berechnen" button in RunButton already shows the finished state.
  if (!data || data.status === 'DONE') return null

  const showProgress =
    (data.status === 'RUNNING' || data.status === 'QUEUED') && data.progress != null

  const jobActive = data.status === 'RUNNING' || data.status === 'QUEUED'

  const currentStep = deriveScoringStep(data.status, data.progress, data.progressLabel)
  // The step list already shows the numeric "n/total · " prefix of the scoring
  // steps – only append the plain name in the header.
  const headerLabel = data.progressLabel?.replace(/^\d+\/\d+\s*·\s*/, '')

  return (
    <div className={`rounded px-2 py-1 text-sm ${COLORS[data.status] ?? ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          {jobActive ? (
            <Spinner size="3" color="current" label={LABELS[data.status] ?? data.status} />
          ) : null}
          <span>
            {LABELS[data.status] ?? data.status}
            {showProgress && headerLabel ? ` – ${headerLabel}` : ''}
          </span>
        </span>
        {showProgress ? <span className="tabular-nums">{data.progress} %</span> : null}
      </div>
      {showProgress ? (
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-white/60">
          <div
            className="h-full rounded bg-blue-500 transition-all"
            style={{ width: `${data.progress}%` }}
          />
        </div>
      ) : null}
      {showProgress ? (
        <SpaceFinderRunSteps
          currentStep={currentStep}
          weights={data.weights}
          hasUserDatasets={data.hasUserDatasets}
        />
      ) : null}
      {data.status === 'FAILED' && data.errorMessage ? (
        <pre className="mt-1 max-h-24 overflow-auto text-xs whitespace-pre-wrap">
          {data.errorMessage}
        </pre>
      ) : null}
    </div>
  )
}
