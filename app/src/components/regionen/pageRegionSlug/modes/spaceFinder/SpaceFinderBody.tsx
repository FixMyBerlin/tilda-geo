import { feature, featureCollection } from '@turf/helpers'
import { useEffect } from 'react'
import { twJoin } from 'tailwind-merge'
import { comparableRunSnapshot } from '@/server/planning/factorFingerprint'
import { areaInputFromRow } from '@/server/planning/mergeFactorConfig'
import { useSpaceFinderBoundaryActions } from '../../hooks/mapState/space-finder-boundary-store'
import { modePanelMutedClassName } from '../modePanel.const'
import { SpaceFinderCandidatesSection } from './candidates/SpaceFinderCandidatesSection'
import { DisplaySection } from './display/DisplaySection'
import { FactorEditorPanel } from './factors/FactorEditorPanel'
import { JobStatusBadge } from './run/JobStatusBadge'
import { spaceFinderOpenRunStatus } from './spaceFinderRunStatus'
import type { PlanningVariantDetail } from './spaceFinderVariantDetail'

/** Status line (D5): same run state as the Varianten dropdown and the run button. */
const StatusSection = ({ variant }: { variant: PlanningVariantDetail }) => {
  const { status, outdatedReason, latestJob } = spaceFinderOpenRunStatus(variant)

  return (
    <div className="flex flex-col gap-2 px-4 py-2">
      {status === 'stale' && (
        <p className="rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
          {outdatedReason ? `${outdatedReason} — ` : ''}Ergebnis veraltet. Bitte neu berechnen.
        </p>
      )}
      {latestJob != null && <JobStatusBadge jobId={latestJob.id} variantId={variant.id} />}
      {status === 'none' && latestJob == null && (
        <p className={modePanelMutedClassName}>Noch nicht berechnet.</p>
      )}
    </div>
  )
}

/**
 * Flächenfinder panel body (D5): status line, Faktoren, Anzeige and Auswahl as
 * collapsible sections, not a list. Anzeige needs a complete run and is hidden before.
 */
export const SpaceFinderBody = ({
  variant,
  editable = true,
}: {
  variant: PlanningVariantDetail | undefined
  /**
   * Desktop only (D10): hides Faktoren editing, the run button (footer, handled by the caller)
   * and candidate selection behind a short notice. Status and Anzeige
   * (view-only controls) stay visible.
   */
  editable?: boolean
}) => {
  const { setVegetationAttribution, setUserObstaclesGeom } = useSpaceFinderBoundaryActions()

  useEffect(() => {
    if (!variant) return
    setVegetationAttribution(variant.runs[0]?.cirAttribution ?? null)
    return () => setVegetationAttribution(null)
  }, [variant, setVegetationAttribution])

  // All "Eigene Daten" datasets as one control layer; the name is on every object.
  const userDatasets = variant?.factorConfig.user_datasets
  useEffect(
    function syncUserDatasetsToMapStore() {
      if (!userDatasets || userDatasets.length === 0) {
        setUserObstaclesGeom(null)
        return
      }
      const collection = featureCollection(
        userDatasets.flatMap((dataset) =>
          dataset.geojson.features.map(({ geometry }) =>
            feature(geometry, { dataset: dataset.name }),
          ),
        ),
      )
      setUserObstaclesGeom(collection)
      return function clearUserDatasetsFromMapStore() {
        setUserObstaclesGeom(null)
      }
    },
    [userDatasets, setUserObstaclesGeom],
  )

  if (!variant) return null

  const { status, latestRun, hasCompleteRun } = spaceFinderOpenRunStatus(variant)
  const isLocked = status === 'running'

  return (
    <div className="flex flex-col">
      <StatusSection variant={variant} />
      <div className="flex flex-col gap-3 p-3">
        {editable ? (
          <FactorEditorPanel
            variantId={variant.id}
            areaId={variant.area.id}
            factorConfig={variant.factorConfig}
            lastRunConfig={comparableRunSnapshot(
              latestRun?.factorConfigSnapshot ?? null,
              areaInputFromRow(variant.area),
            )}
            readOnly={isLocked}
            defaultOpen={!hasCompleteRun}
            parkingDataAvailable={variant.parkingDataAvailable}
          />
        ) : (
          <p
            className={twJoin(
              'rounded border border-gray-200 px-2.5 py-2',
              modePanelMutedClassName,
            )}
          >
            Faktoren und Berechnung nur am Desktop bearbeitbar.
          </p>
        )}
        <DisplaySection variant={variant} />
        {editable && variant.currentRunId != null && (
          <SpaceFinderCandidatesSection variantId={variant.id} runId={variant.currentRunId} />
        )}
      </div>
    </div>
  )
}
