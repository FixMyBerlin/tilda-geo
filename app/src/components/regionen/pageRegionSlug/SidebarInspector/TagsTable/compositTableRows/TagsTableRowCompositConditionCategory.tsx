import { isDev } from '@/components/shared/utils/isEnv'
import {
  formatParkingConditionCategorySegment,
  resolveParkingConditionCategoryBase,
  resolveParkingConditionDetailToken,
  splitParkingConditionCategoryValue,
} from '../parking/parkingConditionCategorySegment'
import { TagsTableRow } from '../TagsTableRow'
import type { CompositTableRow } from './types'

export const tableKeyConditionCategory = 'composit_condition_category'

export const TagsTableRowCompositConditionCategory = ({
  sourceId,
  tagKey,
  properties,
}: CompositTableRow) => {
  if (!properties.condition_category) return null

  const raw = properties.condition_category
  const segments = splitParkingConditionCategoryValue(raw)

  const items = segments.map((segment) => ({
    segment,
    line: formatParkingConditionCategorySegment(
      segment,
      resolveParkingConditionCategoryBase,
      resolveParkingConditionDetailToken,
    ),
  }))

  const sole = items.length === 1 ? items[0] : undefined

  return (
    <TagsTableRow key={tagKey} sourceId={sourceId} tagKey={tagKey}>
      {sole === undefined ? (
        <ul className="list-disc pl-4">
          {items.map(({ segment, line }) => (
            <li key={segment}>
              <span title={isDev ? segment : undefined}>{line}</span>
            </li>
          ))}
        </ul>
      ) : (
        <span title={isDev ? raw : undefined}>{sole.line}</span>
      )}
    </TagsTableRow>
  )
}
