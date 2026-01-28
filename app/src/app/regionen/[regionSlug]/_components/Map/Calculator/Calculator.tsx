import { useCategoriesConfig } from '@/src/app/regionen/[regionSlug]/_hooks/useQueryState/useCategoriesConfig/useCategoriesConfig'
import { useMemo, useRef } from 'react'
import { getSourceData } from '../../../_mapData/utils/getMapDataUtils'
import { CalculatorControls } from './CalculatorControls'
import { CalculatorOutput } from './CalculatorOutput'
import { flattenSubcategories } from './utils/flattenSubcategories'

export const Calculator = () => {
  const drawControlRef = useRef<MapboxDraw>()

  // This blob ist just to check if the Calculator should be enabled
  // by checking the sourceData.
  const { categoriesConfig } = useCategoriesConfig()
  const { queryLayers, calculatorSourceKeys, subcategoryName } = useMemo(() => {
    let calculatorSource: ReturnType<typeof getSourceData> | undefined = undefined
    let activeSubcategoryWithCalculator:
      | ReturnType<typeof flattenSubcategories>[number]
      | undefined = undefined
    if (categoriesConfig) {
      const activeSubcategories = flattenSubcategories(categoriesConfig)
        // a subcategory is active, when any style is active that is not "hidden"
        .filter((t) => t.styles.filter((s) => s.id !== 'hidden').some((s) => s.active))
      const sourceDataOfActiveSubcats = activeSubcategories.map((t) => getSourceData(t.sourceId))
      const calculatorSources = sourceDataOfActiveSubcats.filter((s) => s.calculator.enabled)
      calculatorSource = calculatorSources?.at(0)

      // Find the active subcategory that has calculator enabled
      if (calculatorSource) {
        activeSubcategoryWithCalculator = activeSubcategories.find(
          (subcat) => getSourceData(subcat.sourceId).id === calculatorSource?.id,
        )
      }

      if (calculatorSources.length > 1) {
        console.log(
          'ERROR: Calculator found multiple "calculator.enabled".',
          { count: calculatorSources.length },
          'Picking the first',
          { queryLayers },
        )
      }
    }
    return {
      queryLayers: calculatorSource?.calculator?.queryLayers,
      calculatorSourceKeys: calculatorSource?.calculator?.keys,
      subcategoryName: activeSubcategoryWithCalculator?.name,
    }
  }, [categoriesConfig])

  if (!queryLayers) return null

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: '.maplibregl-ctrl-top-left { left: 270px; }',
        }}
      />
      <CalculatorControls queryLayers={queryLayers} drawControlRef={drawControlRef} />
      <CalculatorOutput
        keys={calculatorSourceKeys}
        drawControlRef={drawControlRef}
        subcategoryName={subcategoryName}
      />
    </>
  )
}
