import { twJoin } from 'tailwind-merge'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { formatNumber } from '@/components/shared/utils/formatNumber'
import { getInspectorValueTranslationKey } from '@/data/topicDocs/runtime'
import type { QaDecisionDataIndicator } from '@/server/qa-configs/queries/getQaDecisionDataForArea.server'
import type { QaDecisionData as QaDecisionDataType } from '@/server/qa-configs/schemas/qaDecisionDataSchema'
import { translations } from '../../../SidebarInspector/TagsTable/translations/translations.const'
import { QaChange } from './QaChange'

/** Rough guess: a name up to this length fits the column, so it needs no tooltip. */
const NAME_FITS_CHARS = 16

type Props = {
  decisionData: QaDecisionDataType
  indicator: Pick<QaDecisionDataIndicator, 'key' | 'unit' | 'unitSuffix' | 'inspectorSourceId'>
}

/**
 * One evaluation snapshot (`decisionData`) as a table of reference, current and difference: the
 * total, then the changed amounts per tag value for indicators split by a tag. Used both by
 * `QaIndicatorValues` (current state) and `QaThread` (history entries).
 */
export const QaDecisionData = ({ decisionData, indicator }: Props) => {
  // A short unit follows every number; a unit that is a word (Stellplätze) heads the table once.
  const unit = indicator.unitSuffix ?? ''
  // The name of a tag value as in the Inspector; the raw value when there is no translation.
  const valueLabel = (tagValue: string) => {
    if (tagValue === '__none__') return 'Ohne Angabe'
    const key = getInspectorValueTranslationKey(
      indicator.inspectorSourceId,
      indicator.key,
      tagValue,
    )
    return (key && translations[key]) || tagValue
  }
  // Only the tag values whose amount changed; amounts are shown with two decimals, so a smaller
  // change would read as "+ 0".
  const breakdownEntries = Object.entries(decisionData.breakdown ?? {})
    .map(([tagValue, values]) => ({
      tagValue,
      label: valueLabel(tagValue),
      ...values,
      change: values.current - values.reference,
    }))
    .filter(({ change }) => Math.abs(change) >= 0.005)
    .sort((a, b) => Math.max(b.reference, b.current) - Math.max(a.reference, a.current))

  const numberCell = 'py-0.5 pl-3 text-right whitespace-nowrap tabular-nums'

  return (
    <table className="w-full rounded-lg bg-gray-50 text-gray-700">
      <thead className="text-xs text-gray-500">
        <tr>
          <th scope="col" className="pt-2 pb-0.5 pl-3 text-left font-normal">
            {indicator.unitSuffix ? <span className="sr-only">Wert</span> : indicator.unit}
          </th>
          <th scope="col" className="pt-2 pb-0.5 pl-3 text-right font-normal">
            Referenz
          </th>
          <th scope="col" className="pt-2 pb-0.5 pl-3 text-right font-normal">
            Aktuell
          </th>
          <th scope="col" className="pt-2 pr-3 pb-0.5 pl-3 text-right font-normal">
            Differenz
          </th>
        </tr>
      </thead>
      <tbody>
        <tr className="align-middle font-semibold">
          <th scope="row" className="py-0.5 pr-2 pl-3 text-left font-semibold">
            Gesamt
          </th>
          <td className={numberCell}>
            {formatNumber(decisionData.reference)} {unit}
          </td>
          <td className={numberCell}>
            {formatNumber(decisionData.current)} {unit}
          </td>
          <td className={twJoin(numberCell, 'pr-3')}>
            <QaChange amount={decisionData.difference} share={decisionData.deviation} unit={unit} />
          </td>
        </tr>
        {breakdownEntries.map(({ tagValue, label, reference, current, change }) => (
          <tr key={tagValue} className="align-middle">
            {/* `max-w-0` with `w-full`: the name takes the space the numbers leave and is cut. */}
            <th scope="row" className="w-full max-w-0 py-0.5 pr-2 pl-3 text-left font-normal">
              {label.length > NAME_FITS_CHARS ? (
                <Tooltip text={label} className="truncate">
                  {label}
                </Tooltip>
              ) : (
                <div className="truncate">{label}</div>
              )}
            </th>
            <td className={numberCell}>
              {formatNumber(reference)} {unit}
            </td>
            <td className={numberCell}>
              {formatNumber(current)} {unit}
            </td>
            <td className={twJoin(numberCell, 'pr-3')}>
              <QaChange
                amount={Math.abs(change)}
                share={Math.abs(change) / Math.max(reference, current)}
                unit={unit}
                direction={change > 0 ? 'more' : 'less'}
              />
            </td>
          </tr>
        ))}
        <tr aria-hidden="true">
          <td colSpan={4} className="h-2" />
        </tr>
      </tbody>
    </table>
  )
}
