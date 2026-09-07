import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { isModeOwnedSource, modeForSource } from './modeScopedSelection'
import { useCurrentMode } from './useCurrentMode'

export const useModeDetailSelection = () => {
  const mode = useCurrentMode()
  const { featuresParam, setFeaturesParam } = useFeaturesParam()

  const selected = featuresParam.find((feature) => modeForSource(feature.sourceId) === mode)

  const clearModeDetail = () => {
    const next = featuresParam.filter((feature) => !isModeOwnedSource(feature.sourceId))
    setFeaturesParam(next.length > 0 ? next : null)
  }

  return { selected, clearModeDetail }
}
