import { useDrawParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useDrawParam'
import type { DrawArea } from '../CalculatorControlsDrawControl'

export const useDelete = () => {
  const { setDrawParam } = useDrawParam()

  const deleteDrawFeatures = (
    currentFeatures: DrawArea[] | undefined | null,
    inputFeatures: DrawArea[] | undefined,
  ) => {
    if (!currentFeatures || !inputFeatures) return

    const deletedFeaturesIds = inputFeatures.map((f) => f.id)
    const newDrawAreas = currentFeatures.filter(
      (feature) => !deletedFeaturesIds.includes(feature.id),
    )
    void setDrawParam(newDrawAreas)
  }

  return { deleteDrawFeatures }
}
