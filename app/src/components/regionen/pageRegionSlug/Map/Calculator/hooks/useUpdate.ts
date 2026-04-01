import { useDrawParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useDrawParam'
import type { DrawArea } from '../CalculatorControlsDrawControl'
import { simplifyPositions } from '../utils/simplifyPositions'

export const useUpdate = () => {
  const { setDrawParam } = useDrawParam()

  const updateDrawFeatures = (
    currentFeatures: DrawArea[] | null | undefined,
    inputFeatures: DrawArea[],
  ) => {
    currentFeatures = currentFeatures || []
    // Input can be added, modified or multi select modification

    // Case new feature(s):
    const currFeatureIds = currentFeatures.map((f) => f.id)
    const newFeatures = inputFeatures.filter((iF) => !currFeatureIds.includes(iF.id))

    // Case modified features
    const modifiedFeatures = inputFeatures.filter((iF) => currFeatureIds.includes(iF.id))
    const modifiedFeatureIds = modifiedFeatures.map((f) => f.id)

    // Rest: Non modified features
    const untouchedFeatures = currentFeatures.filter((cF) => !modifiedFeatureIds.includes(cF.id))

    const newDrawAreas = [...newFeatures, ...modifiedFeatures, ...untouchedFeatures]
    const simplifiedDrawAreas = simplifyPositions(newDrawAreas)
    void setDrawParam(simplifiedDrawAreas)
  }
  return { updateDrawFeatures }
}
