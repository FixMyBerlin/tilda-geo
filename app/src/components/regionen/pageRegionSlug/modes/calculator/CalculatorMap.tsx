import { CalculatorAreasMask } from './CalculatorAreasMask'
import { CalculatorMapDrawing } from './drawing/CalculatorMapDrawing'
import { useCalculatorLiveAreas } from './drawing/useCalculatorDraw'
import { SourcesLayersCalculator } from './SourcesLayersCalculator'
import { useCalculatorDatasets } from './useCalculatorDatasets'
import { useCalculatorStyleColors } from './utils/calculatorStyleColors'

/**
 * The map side of the Summieren mode: the features of the selected dataset (all its parts), the
 * mask that dims the map outside the drawn areas, and the drawing surface. Mounted by `RegionMap`
 * only in this mode; the sums come from the server (`useCalculatorQuery`) and are shown in the
 * mode panel (`CalculatorResult`).
 */
export const CalculatorMap = () => {
  const { activeDataset, filter } = useCalculatorDatasets()
  const styleColors = useCalculatorStyleColors()
  // Includes a drag in progress; only the labels follow it.
  const liveAreas = useCalculatorLiveAreas()

  if (!activeDataset) return null

  // From the bottom: dataset, mask, drawing. Dataset and mask have their own position in the map
  // style (`LAYER_POSITIONS`), the drawing lies on top of the style.
  return (
    <>
      <SourcesLayersCalculator dataset={activeDataset} filter={filter} styleColors={styleColors} />
      <CalculatorAreasMask />
      <CalculatorMapDrawing
        areas={liveAreas}
        getFeatureLabel={({ index }) => (liveAreas.length > 1 ? `Fläche ${index + 1}` : undefined)}
      />
    </>
  )
}
