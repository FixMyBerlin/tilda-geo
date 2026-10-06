import { XMarkIcon } from '@heroicons/react/20/solid'
import { useState } from 'react'
import { IntlProvider } from 'react-intl'
import { ConditionalFormattedKey } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/ConditionalFormattedKey'
import { ConditionalFormattedValue } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/ConditionalFormattedValue'
import { translations } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/translations.const'
import { modePanelFilterControlClassName } from '../modePanel.const'
import type { CalculatorFilter } from './calculatorModeParam'
import { calculatorMissingGroupValueLabel } from './utils/calculateMetricSummaries'

type Props = {
  sourceId: string
  filter: CalculatorFilter
  onToggleFilter: (key: string, value: string) => void
  onClear: () => void
}

/**
 * The active filters of the Summieren mode (`sum.filter`) in the filter line of the panel. A
 * filter is set by clicking a value in the breakdown; a chip removes it again.
 */
export const CalculatorFilterChips = ({ sourceId, filter, onToggleFilter, onClear }: Props) => {
  // The line collapses when the last filter goes (`ModePanel` `filterOpen`); until it is
  // closed it keeps showing that filter.
  const [shownFilter, setShownFilter] = useState(filter)
  const hasFilter = Object.keys(filter).length > 0
  if (hasFilter && JSON.stringify(shownFilter) !== JSON.stringify(filter)) setShownFilter(filter)
  const entries = Object.entries(hasFilter ? filter : shownFilter)

  return (
    <IntlProvider messages={translations} locale="de" defaultLocale="de">
      <div className="flex flex-wrap items-center gap-1.5">
        {entries.map(([key, value]) => (
          <button
            key={key}
            type="button"
            onClick={() => onToggleFilter(key, value)}
            title="Filter entfernen"
            className={`${modePanelFilterControlClassName} max-w-full gap-1 px-1.5`}
          >
            <span className="min-w-0 truncate [&_span]:truncate">
              <ConditionalFormattedKey sourceId={sourceId} tagKey={key} />:{' '}
              <span className="font-semibold">
                <ConditionalFormattedValue
                  sourceId={sourceId}
                  tagKey={key}
                  tagValue={value || calculatorMissingGroupValueLabel}
                />
              </span>
            </span>
            <XMarkIcon className="size-3.5 shrink-0" aria-hidden />
          </button>
        ))}
        {entries.length > 1 && (
          <button
            type="button"
            onClick={onClear}
            className="cursor-pointer px-1 text-xs text-gray-600 underline hover:text-gray-900"
          >
            Alle entfernen
          </button>
        )}
      </div>
    </IntlProvider>
  )
}
