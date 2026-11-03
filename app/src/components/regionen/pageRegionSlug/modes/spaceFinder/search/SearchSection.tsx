import { CollapsibleBox } from '@/components/shared/CollapsibleBox/CollapsibleBox'
import { DEFAULT_FACTOR_TEMPLATE } from '../factors/spaceFinderDefaults'
import type { SpaceFinderVariantDetail } from '../spaceFinderVariantDetail'
import { MinAreaFilter } from './MinAreaFilter'

/**
 * »Suche«: narrows the result down before candidates are picked in »Auswahl«. Hidden until the
 * first run is complete, like »Anzeige«. The caller keys it by run, so it opens again after every
 * new result.
 */
export const SearchSection = ({ variant }: { variant: SpaceFinderVariantDetail }) => {
  const latestRun = variant.runs[0] ?? null
  if (latestRun?.status !== 'COMPLETE') return null

  return (
    <CollapsibleBox title="Suche">
      <MinAreaFilter
        variantId={variant.id}
        savedMinArea={variant.factorConfig.min_area_m2 ?? 0}
        // The clusters on the map were built with the run's threshold, not the current factors.
        clusterMinScore={
          latestRun.factorConfigSnapshot?.min_score_threshold ??
          DEFAULT_FACTOR_TEMPLATE.min_score_threshold
        }
      />
    </CollapsibleBox>
  )
}
