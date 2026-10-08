import { useEffect } from 'react'
import { twJoin } from 'tailwind-merge'
import { CollapsibleBox } from '@/components/shared/CollapsibleBox/CollapsibleBox'
import { formatDate } from '@/components/shared/date/formatDate'
import {
  areaInputsDiffer,
  comparableRunSnapshot,
  factorsDiffer,
  outdatedBannerReason,
} from '@/server/planning/factorFingerprint'
import { areaInputFromRow } from '@/server/planning/mergeFactorConfig'
import { useSpaceFinderBoundaryActions } from '../../hooks/mapState/space-finder-boundary-store'
import { modePanelMutedClassName } from '../modePanel.const'
import { SpaceFinderCandidatesSection } from './candidates/SpaceFinderCandidatesSection'
import { DisplaySection } from './display/DisplaySection'
import { UserObstaclesToggle } from './display/LayerToggles'
import { FactorEditorPanel } from './factors/FactorEditorPanel'
import { JobStatusBadge } from './run/JobStatusBadge'
import type { PlanningVariantDetail } from './spaceFinderVariantDetail'

type LatestJob = PlanningVariantDetail['jobs'][number] | null
type LatestRun = PlanningVariantDetail['runs'][number] | null

/** Status line (D5): run state, outdated reason, progress while running. */
const StatusSection = ({
  variant,
  latestJob,
  latestRun,
  isLocked,
  hasCompleteRun,
}: {
  variant: PlanningVariantDetail
  latestJob: LatestJob
  latestRun: LatestRun
  isLocked: boolean
  hasCompleteRun: boolean
}) => {
  const lastRunConfig = latestRun?.factorConfigSnapshot ?? null
  const comparableSnapshot = comparableRunSnapshot(lastRunConfig, areaInputFromRow(variant.area))
  const currentConfig = variant.factorConfig
  const outdatedReason =
    hasCompleteRun && !isLocked
      ? outdatedBannerReason(
          factorsDiffer(currentConfig, comparableSnapshot),
          areaInputsDiffer(currentConfig, lastRunConfig),
        )
      : null

  return (
    <div className="flex flex-col gap-2 px-4 py-2">
      {outdatedReason && (
        <p className="rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
          {outdatedReason} — Ergebnis veraltet. Bitte neu berechnen.
        </p>
      )}
      {latestJob != null && <JobStatusBadge jobId={latestJob.id} variantId={variant.id} />}
      {latestJob == null && latestRun != null && hasCompleteRun && !outdatedReason && (
        <p className="text-xs text-green-700">✓ Ergebnis vom {formatDate(latestRun.createdAt)}</p>
      )}
      {latestJob == null && !hasCompleteRun && (
        <p className={modePanelMutedClassName}>Noch nicht berechnet.</p>
      )}
    </div>
  )
}

/**
 * Flächenfinder panel body (D5): status line, Faktoren, Anzeige (only with a complete run)
 * and Auswahl as collapsible sections, not a list. The Eigene-Daten layer toggle is
 * independent of `hasCompleteRun` (uploaded data shows on the map before the first run)
 * and therefore lives outside `DisplaySection`.
 */
export const SpaceFinderBody = ({
  regionSlug,
  variant,
  editable = true,
}: {
  regionSlug: string
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

  const userGeojson = variant?.factorConfig.user_geojson
  useEffect(() => {
    setUserObstaclesGeom((userGeojson as object | undefined) ?? null)
    return () => setUserObstaclesGeom(null)
  }, [userGeojson, setUserObstaclesGeom])

  if (!variant) return null

  const latestJob = variant.jobs[0] ?? null
  const latestRun = variant.runs[0] ?? null
  const isLocked = latestJob?.status === 'QUEUED' || latestJob?.status === 'RUNNING'
  const hasCompleteRun = latestRun?.status === 'COMPLETE'

  return (
    <div className="flex flex-col">
      <StatusSection
        variant={variant}
        latestJob={latestJob}
        latestRun={latestRun}
        isLocked={isLocked}
        hasCompleteRun={hasCompleteRun}
      />
      <div className="flex flex-col gap-3 p-3">
        {editable ? (
          <FactorEditorPanel
            variantId={variant.id}
            areaId={variant.area.id}
            regionSlug={regionSlug}
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
        {hasCompleteRun && <DisplaySection variant={variant} />}
        {userGeojson != null && (
          <CollapsibleBox title="Eigene Daten" defaultOpen={false}>
            <UserObstaclesToggle />
          </CollapsibleBox>
        )}
        {editable && variant.currentRunId != null && (
          <SpaceFinderCandidatesSection variantId={variant.id} runId={variant.currentRunId} />
        )}
      </div>
    </div>
  )
}
