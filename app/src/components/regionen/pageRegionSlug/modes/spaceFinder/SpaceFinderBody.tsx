import { useQuery } from '@tanstack/react-query'
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
import type { FactorConfig } from '@/server/planning/planning.functions'
import { planningVariantQueryOptions } from '@/server/planning/planningQueryOptions'
import { useSpaceFinderBoundaryState } from '../../hooks/mapState/useSpaceFinderBoundaryState'
import { modePanelMutedClassName } from '../modePanel.const'
import { SpaceFinderCandidatesSection } from './candidates/SpaceFinderCandidatesSection'
import { DisplaySection } from './display/DisplaySection'
import { UserObstaclesToggle } from './display/LayerToggles'
import { FactorEditorPanel } from './factors/FactorEditorPanel'
import { JobStatusBadge } from './run/JobStatusBadge'
import type { PlanningVariantDetail } from './spaceFinderVariantDetail'

/** Status line (D5): run state, outdated reason, progress while running. */
const StatusSection = ({ variant }: { variant: PlanningVariantDetail }) => {
  const latestJob = variant.jobs[0] ?? null
  const latestRun = variant.runs[0] ?? null
  const isLocked = latestJob?.status === 'QUEUED' || latestJob?.status === 'RUNNING'
  const hasCompleteRun = latestRun?.status === 'COMPLETE'
  const lastRunConfig = (latestRun?.factorConfigSnapshot as FactorConfig | undefined) ?? null
  const comparableSnapshot = comparableRunSnapshot(lastRunConfig, areaInputFromRow(variant.area))
  const currentConfig = variant.factorConfig as FactorConfig
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
      {latestJob == null && hasCompleteRun && !outdatedReason && (
        <p className="text-xs text-green-700">✓ Ergebnis vom {formatDate(latestRun.createdAt)}</p>
      )}
      {latestJob == null && !hasCompleteRun && (
        <p className={modePanelMutedClassName}>Noch nicht berechnet.</p>
      )}
    </div>
  )
}

/**
 * Flächenfinder panel body (D5): status line, Faktoren, Anzeige (only with
 * a complete run) and Auswahl — collapsible sections, no list, replacing the former
 * `SpaceFinderPanelBody`/`VariantDetail`. The Eigene-Daten layer toggle is independent of
 * `hasCompleteRun` (uploaded data shows on the map before the first run) and therefore lives
 * outside `DisplaySection`, same as before.
 */
export const SpaceFinderBody = ({
  regionSlug,
  variantId,
  editable = true,
}: {
  regionSlug: string
  variantId: number
  /**
   * Desktop only (D10): hides Faktoren editing, the run button (footer, handled by the caller)
   * and candidate selection behind a short notice. Status and Anzeige
   * (view-only controls) stay visible.
   */
  editable?: boolean
}) => {
  const setVegetationAttribution = useSpaceFinderBoundaryState((s) => s.setVegetationAttribution)
  const setUserObstaclesGeom = useSpaceFinderBoundaryState((s) => s.setUserObstaclesGeom)
  const { data: variant } = useQuery(planningVariantQueryOptions(variantId))

  useEffect(() => {
    if (!variant) return
    setVegetationAttribution(variant.runs[0]?.cirAttribution ?? null)
    return () => setVegetationAttribution(null)
  }, [variant, setVegetationAttribution])

  const userGeojson = (variant?.factorConfig as FactorConfig | undefined)?.user_geojson
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
      <StatusSection variant={variant} />
      <div className="flex flex-col gap-3 p-3">
        {editable ? (
          <FactorEditorPanel
            variantId={variant.id}
            areaId={variant.area.id}
            regionSlug={regionSlug}
            factorConfig={variant.factorConfig as FactorConfig}
            lastRunConfig={comparableRunSnapshot(
              (latestRun?.factorConfigSnapshot as FactorConfig | undefined) ?? null,
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
          <SpaceFinderCandidatesSection variantId={variant.id} />
        )}
      </div>
    </div>
  )
}
