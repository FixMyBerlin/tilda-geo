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
 * »Anzeige«: map controls. Hidden until the first run is complete: all controls (score mode,
 * area filter, layer toggles) act on run data, and the map layers are only mounted with a run.
 */
export const DisplaySection = ({ variant }: { variant: PlanningVariantDetail }) => {
  const latestRun = variant.runs[0] ?? null
  const hasCompleteRun = latestRun?.status === 'COMPLETE'
  if (!hasCompleteRun) return null

  const lastRunConfig = latestRun?.factorConfigSnapshot ?? null
  const factorConfig = variant.factorConfig
  const hasUserDatasets = (factorConfig.user_datasets?.length ?? 0) > 0

  return (
    <CollapsibleBox title="Anzeige">
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
      {/* From the run snapshot, not the current config: the tiles are clipped to the
              Planungsgebiet of THIS run (see planning_census), so the toggle should appear exactly
              when resident demand was actually included. */}
      {(lastRunConfig?.weights?.w_bewohnerbedarf ?? 0) > 0 && <CensusToggle />}
      {hasUserDatasets && <UserObstaclesToggle />}
    </CollapsibleBox>
  )
}
