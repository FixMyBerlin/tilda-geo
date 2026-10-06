import { ModeCollectionSelect } from '../ModeCollectionSelect'
import { ModePanel } from '../ModePanel'
import { CalculatorFilterChips } from './CalculatorFilterChips'
import { CalculatorResult } from './CalculatorResult'
import { useCalculatorDatasets } from './useCalculatorDatasets'

/**
 * Summieren mode: draw areas on the map (`CalculatorMap`) and read the totals of the selected
 * dataset here. A click on a value of the breakdown narrows the sum to it. Nothing is stored;
 * areas, dataset and filter live in the URL (`sum`), so a calculation is shared by
 * its link.
 */
export const PageModeCalculator = () => {
  const { datasets, activeDataset, selectDataset, filter, toggleFilter, clearFilter } =
    useCalculatorDatasets()
  const hasFilter = Object.keys(filter).length > 0

  return (
    <ModePanel
      title="Summieren"
      subtitle={activeDataset?.name}
      collection={
        datasets.length > 1 && activeDataset ? (
          <ModeCollectionSelect
            aria-label="Datensatz wählen"
            value={activeDataset.sourceId}
            options={datasets.map((dataset) => ({
              value: dataset.sourceId,
              label: dataset.name,
            }))}
            onChange={selectDataset}
          />
        ) : undefined
      }
      filter={
        activeDataset ? (
          <CalculatorFilterChips
            sourceId={activeDataset.sourceId}
            filter={filter}
            onToggleFilter={toggleFilter}
            onClear={clearFilter}
          />
        ) : undefined
      }
      filterOpen={hasFilter}
    >
      {activeDataset ? (
        <CalculatorResult dataset={activeDataset} filter={filter} onToggleFilter={toggleFilter} />
      ) : null}
    </ModePanel>
  )
}
