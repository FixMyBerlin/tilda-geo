import { FormattedNumber } from 'react-intl'
import type { CompositTableRow } from '../compositTableRows/types'
import { TagsTableRow } from '../TagsTableRow'
import { cleanKey, KEY_IF_PRESENCE } from '../utils/cleanKey'
import { ChartSwatch } from './ChartSwatch'
import type { InspectorPieChart } from './inspectorChart.schema'

type Props = CompositTableRow & { chart: InspectorPieChart }

// Survey values are often text like `62%`
const readNumber = (value: unknown) =>
  typeof value === 'number' ? value : Number.parseFloat(String(value ?? '').replace(',', '.'))

export const TagsTableRowPie = ({ sourceId, tagKey: uncleanKey, properties, chart }: Props) => {
  const tagKey = cleanKey(uncleanKey)
  const slices = chart.slices
    .map((slice) => ({ ...slice, value: readNumber(properties[slice.key]) }))
    .filter((slice) => Number.isFinite(slice.value) && slice.value > 0)
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  if (!slices.length) {
    if (uncleanKey.includes(KEY_IF_PRESENCE)) return null
    return <TagsTableRow sourceId={sourceId} tagKey={tagKey} tagValue={null} />
  }

  const gradientStops = slices.map((slice, index) => {
    const start = slices.slice(0, index).reduce((sum, { value }) => sum + value, 0)
    return `${slice.color} ${(start / total) * 100}% ${((start + slice.value) / total) * 100}%`
  })

  return (
    <TagsTableRow sourceId={sourceId} tagKey={tagKey}>
      <div className="flex items-center gap-3">
        <div
          role="img"
          aria-label={slices
            .map((slice) => `${slice.label}: ${slice.value}${chart.unit ? ` ${chart.unit}` : ''}`)
            .join(', ')}
          className="size-14 shrink-0 rounded-full"
          style={{ background: `conic-gradient(${gradientStops.join(', ')})` }}
        />
        <ul className="min-w-0 space-y-0.5">
          {slices.map((slice) => (
            <li key={slice.key} className="flex items-start gap-1.5">
              <ChartSwatch color={slice.color} />
              <span>
                {slice.label}: <FormattedNumber value={slice.value} />
                {chart.unit ? ` ${chart.unit}` : null}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </TagsTableRow>
  )
}
