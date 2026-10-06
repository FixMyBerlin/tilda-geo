import { CollapsibleBox } from '@/components/shared/CollapsibleBox/CollapsibleBox'
import type { FactorConfig } from '@/server/planning/planning.functions'
import { DEFAULT_FACTOR_TEMPLATE } from '../factors/spaceFinderDefaults'
import type { PlanningVariantDetail } from '../spaceFinderVariantDetail'
import { CarriagewaysToggle, CensusToggle, VegetationToggle } from './LayerToggles'
import { MinAreaFilter } from './MinAreaFilter'
import { ScoreModeSwitcher } from './ScoreModeSwitcher'

/** »Anzeige« (only with a complete run): score mode, opacity, Gesuchte-Fläche filter, layer toggles. */
export const DisplaySection = ({ variant }: { variant: PlanningVariantDetail }) => {
  const latestRun = variant.runs[0] ?? null
  const lastRunConfig = (latestRun?.factorConfigSnapshot as FactorConfig | undefined) ?? null
  const factorConfig = variant.factorConfig as FactorConfig

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
      {/* Aus dem Lauf-Snapshot, nicht aus der aktuellen Konfiguration: die Kacheln werden auf das
          Planungsgebiet DIESES Laufs zugeschnitten (siehe planning_census), der Schalter soll also
          genau dann erscheinen, wenn der Bewohnerbedarf tatsächlich mitgerechnet wurde. */}
      {(lastRunConfig?.weights?.w_bewohnerbedarf ?? 0) > 0 && <CensusToggle />}
    </CollapsibleBox>
  )
}
