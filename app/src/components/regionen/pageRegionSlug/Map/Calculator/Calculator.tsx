import { useRef } from 'react'
import { useCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/useCategoriesConfig'
import { getSourceData } from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import { CalculatorControls } from './CalculatorControls'
import { CalculatorOutput } from './CalculatorOutput'
import { flattenSubcategories } from './utils/flattenSubcategories'

export const Calculator = () => {
  const drawControlRef = useRef<MapboxDraw | undefined>(undefined)

  // This blob ist just to check if the Calculator should be enabled
  // by checking the sourceData.
  // React Compiler automatically memoizes this computation
  const { categoriesConfig } = useCategoriesConfig()
  let calculatorSource: ReturnType<typeof getSourceData> | undefined
  let activeSubcategoryWithCalculator: ReturnType<typeof flattenSubcategories>[number] | undefined
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
      )
    }
  }
  const queryLayers = calculatorSource?.calculator?.queryLayers
  const calculatorSourceKeys = calculatorSource?.calculator?.keys
  const subcategoryName = activeSubcategoryWithCalculator?.name

  if (!queryLayers) return null

  return (
    <>
      <style
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static CSS for map control position
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
