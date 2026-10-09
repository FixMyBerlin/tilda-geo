import { SwatchIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { IntlProvider } from 'react-intl'
import { ConditionalFormattedKey } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/ConditionalFormattedKey'
import { ConditionalFormattedValue } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/ConditionalFormattedValue'
import { translations } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/translations.const'
import { MotionAutoHeight } from '@/components/shared/motion/MotionAutoHeight'
import { ModeFilterSelect } from '../ModeFilterSelect'
import { modePanelFilterControlClassName } from '../modePanel.const'
import { type CalculatorDataset, calculatorTranslationSourceId } from './calculatorDatasets.const'
import type { CalculatorFilter } from './calculatorModeParam'
import { calculatorMissingGroupValueLabel } from './utils/calculateMetricSummaries'

const defaultStyleValue = 'default'

type Props = {
  /** The sources of the dataset; their translations name the tags and values. */
  parts: CalculatorDataset['parts']
  /** The tags of the dataset: what the points can be colored by. */
  groupByKeys: string[]
  style: string | undefined
  onStyleChange: (key: string | undefined) => void
  filter: CalculatorFilter
  onToggleFilter: (key: string, value: string) => void
  onClearFilter: () => void
}

/**
 * Filter line of the Summieren panel: how the points are colored (`sum.style`) and the active
 * filters (`sum.filter`). A filter is set by clicking a value in the breakdown; a chip removes
 * it again.
 */
export const CalculatorFilterBar = ({
  parts,
  groupByKeys,
  style,
  onStyleChange,
  filter,
  onToggleFilter,
  onClearFilter,
}: Props) => {
  const entries = Object.entries(filter)
  const styleOptions = [
    { value: defaultStyleValue, label: 'Einfarbig' },
    ...groupByKeys.map((key) => ({
      value: key,
      label: `Nach ${translations[`${calculatorTranslationSourceId(parts, key)}--${key}--key`] ?? key}`,
    })),
  ]

  return (
    <IntlProvider messages={translations} locale="de" defaultLocale="de">
      {/* A chip may wrap to a new line; the result below should not jump. */}
      <MotionAutoHeight>
        <div className="flex flex-wrap items-center gap-1.5">
          <ModeFilterSelect
            label="Punkte einfärben"
            triggerPrefix="Farbe"
            icon={SwatchIcon}
            value={style ?? defaultStyleValue}
            options={styleOptions}
            onChange={(value) => onStyleChange(value === defaultStyleValue ? undefined : value)}
          />
          {entries.map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => onToggleFilter(key, value)}
              title="Filter entfernen"
              className={`${modePanelFilterControlClassName} max-w-full gap-1 px-1.5`}
            >
              <span className="min-w-0 truncate [&_span]:truncate">
                <ConditionalFormattedKey
                  sourceId={calculatorTranslationSourceId(parts, key)}
                  tagKey={key}
                />
                :{' '}
                <span className="font-semibold">
                  <ConditionalFormattedValue
                    sourceId={calculatorTranslationSourceId(parts, key, value)}
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
              onClick={onClearFilter}
              className="cursor-pointer px-1 text-xs text-gray-600 underline hover:text-gray-900"
            >
              Alle entfernen
            </button>
          )}
        </div>
      </MotionAutoHeight>
    </IntlProvider>
  )
}
