import { CollapsibleBox } from '@/components/shared/CollapsibleBox/CollapsibleBox'
import { DEFAULT_FACTOR_TEMPLATE } from '../factors/spaceFinderDefaults'
import type { PlanningVariantDetail } from '../spaceFinderVariantDetail'
import {
  CarriagewaysToggle,
  CensusToggle,
  UserObstaclesToggle,
  VegetationToggle,
} from './LayerToggles'
import { MinAreaFilter } from './MinAreaFilter'
import { ScoreModeSwitcher } from './ScoreModeSwitcher'

/**
 * »Anzeige«: map controls. Before the first complete run only the Eigene-Daten layer
 * toggle is available (and only when a file is uploaded). Score mode, area filter and
 * the run-backed layers appear once a run is complete.
 */
export const DisplaySection = ({ variant }: { variant: PlanningVariantDetail }) => {
  const latestRun = variant.runs[0] ?? null
  const hasCompleteRun = latestRun?.status === 'COMPLETE'
  const hasUserDatasets = (variant.factorConfig.user_datasets?.length ?? 0) > 0
  if (!hasCompleteRun && !hasUserDatasets) return null

  const lastRunConfig = latestRun?.factorConfigSnapshot ?? null
  const factorConfig = variant.factorConfig

  return (
    <CollapsibleBox title="Anzeige">
      {hasCompleteRun && (
        <>
          <MinAreaFilter
            variantId={variant.id}
            savedMinArea={factorConfig?.min_area_m2 ?? 0}
            // The clusters on the map were built with the run's threshold, not the current factors.
            clusterMinScore={
              lastRunConfig?.min_score_threshold ?? DEFAULT_FACTOR_TEMPLATE.min_score_threshold
            }
          />
          <ScoreModeSwitcher />
          {(latestRun?.vegCount ?? 0) > 0 && <VegetationToggle />}
          {factorConfig?.exclude_carriageways && <CarriagewaysToggle />}
          {/* Aus dem Lauf-Snapshot, nicht aus der aktuellen Konfiguration: die Kacheln werden auf das
              Planungsgebiet DIESES Laufs zugeschnitten (siehe planning_census), der Schalter soll also
              genau dann erscheinen, wenn der Bewohnerbedarf tatsächlich mitgerechnet wurde. */}
          {(lastRunConfig?.weights?.w_bewohnerbedarf ?? 0) > 0 && <CensusToggle />}
        </>
      )}
      {hasUserDatasets && <UserObstaclesToggle />}
    </CollapsibleBox>
  )
}
