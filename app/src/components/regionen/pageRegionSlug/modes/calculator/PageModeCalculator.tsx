import { ModeCollectionSelect } from '../ModeCollectionSelect'
import { ModePanel } from '../ModePanel'
import { CalculatorFilterBar } from './CalculatorFilterBar'
import { CalculatorPanelActions } from './CalculatorPanelActions'
import { CalculatorResult } from './CalculatorResult'
import { useCalculatorDatasets } from './useCalculatorDatasets'

/**
 * Summieren mode: draw areas on the map (`CalculatorMap`) and read the totals of the selected
 * dataset here. A click on a value of the breakdown narrows the sum to it; the
 * filter line also sets how the points are colored. Nothing is stored;
 * areas, dataset and filter live in the URL (`sum`), so a calculation is shared by
 * its link.
 */
export const PageModeCalculator = () => {
  const {
    datasets,
    activeDataset,
    selectDataset,
    filter,
    toggleFilter,
    clearFilter,
    style,
    setStyle,
  } = useCalculatorDatasets()

  return (
    <ModePanel
      title="Summieren"
      subtitle={activeDataset?.name}
      actions={activeDataset ? <CalculatorPanelActions /> : undefined}
      collection={
        datasets.length > 1 && activeDataset ? (
          <ModeCollectionSelect
            aria-label="Datensatz wählen"
            value={activeDataset.id}
            options={datasets.map((dataset) => ({
              value: dataset.id,
              label: dataset.name,
            }))}
            onChange={selectDataset}
          />
        ) : undefined
      }
      filter={
        activeDataset ? (
          <CalculatorFilterBar
            parts={activeDataset.parts}
            groupByKeys={activeDataset.groupByKeys}
            style={style}
            onStyleChange={setStyle}
            filter={filter}
            onToggleFilter={toggleFilter}
            onClearFilter={clearFilter}
          />
        ) : undefined
      }
    >
      {activeDataset ? (
        <CalculatorResult dataset={activeDataset} filter={filter} onToggleFilter={toggleFilter} />
      ) : null}
    </ModePanel>
  )
}
