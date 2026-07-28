import { useCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/useCategoriesConfig'
import { getSourceData } from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import { CalculatorControls } from './CalculatorControls'
import { CalculatorOutput } from './CalculatorOutput'
import { flattenSubcategories } from './utils/flattenSubcategories'

export const Calculator = () => {
  const { categoriesConfig } = useCategoriesConfig()
  let calculatorSource: ReturnType<typeof getSourceData> | undefined
  let activeSubcategoryWithCalculator: ReturnType<typeof flattenSubcategories>[number] | undefined
  if (categoriesConfig) {
    const activeSubcategories = flattenSubcategories(categoriesConfig).filter((t) =>
      t.styles.filter((s) => s.id !== 'hidden').some((s) => s.active),
    )
    const sourceDataOfActiveSubcats = activeSubcategories.map((t) => getSourceData(t.sourceId))
    const calculatorSources = sourceDataOfActiveSubcats.filter((s) => s.calculator.enabled)
    calculatorSource = calculatorSources?.at(0)

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
  const sumKeys = calculatorSource?.calculator?.sumKeys
  const groupByKeys = calculatorSource?.calculator?.groupByKeys
  const sourceId = calculatorSource?.id
  const subcategoryName = activeSubcategoryWithCalculator?.name

  if (!queryLayers) return null

  return (
    <>
      <style
        // oxlint-disable-next-line react/no-danger -- static CSS for map control position
        dangerouslySetInnerHTML={{
          // Offset the top-left map controls past the desktop sidebar only (no sidebar on mobile).
          __html: '@media (min-width: 640px) { .maplibregl-ctrl-top-left { left: 270px; } }',
        }}
      />
      <CalculatorControls queryLayers={queryLayers} />
      <CalculatorOutput
        sumKeys={sumKeys}
        sourceId={sourceId}
        groupByKeys={groupByKeys}
        queryLayers={queryLayers}
        subcategoryName={subcategoryName}
      />
    </>
  )
}
