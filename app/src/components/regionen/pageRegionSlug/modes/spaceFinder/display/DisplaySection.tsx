import { CollapsibleBox } from '@/components/shared/CollapsibleBox/CollapsibleBox'
import type { SpaceFinderVariantDetail } from '../spaceFinderVariantDetail'
import {
  CarriagewaysToggle,
  CensusToggle,
  UserObstaclesToggle,
  VegetationToggle,
} from './LayerToggles'
import { ScoreModeSwitcher } from './ScoreModeSwitcher'

/**
 * »Anzeige«: map controls. Hidden until the first run is complete: all controls (score mode,
 * layer toggles) act on run data, and the map layers are only mounted with a run.
 */
export const DisplaySection = ({ variant }: { variant: SpaceFinderVariantDetail }) => {
  const latestRun = variant.runs[0] ?? null
  const hasCompleteRun = latestRun?.status === 'COMPLETE'
  if (!hasCompleteRun) return null

  const factorConfig = variant.factorConfig
  const hasUserDatasets = (factorConfig.user_datasets?.length ?? 0) > 0

  return (
    <CollapsibleBox title="Anzeige">
      <ScoreModeSwitcher />
      {(latestRun?.vegCount ?? 0) > 0 && <VegetationToggle />}
      {factorConfig?.exclude_carriageways && <CarriagewaysToggle />}
      {/* Always available: the tiles read the census table directly, clipped to the
              Planungsgebiet of the run (see space_finder_census), whether or not resident demand was
              weighted. */}
      <CensusToggle />
      {hasUserDatasets && <UserObstaclesToggle />}
    </CollapsibleBox>
  )
}
