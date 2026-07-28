import { TagsTableRow } from '../TagsTableRow'
import { ConditionalFormattedValue } from '../translations/ConditionalFormattedValue'
import { resolveCompositParentHighwayDisplay } from './resolveCompositParentHighwayDisplay'
import type { CompositTableRow } from './types'

export const tableKeyHighway = 'composit_parent_highway'
export const TagsTableRowCompositParentHighway = ({
  sourceId,
  tagKey: _, // is `composit_parent_highway` which is not helpful here
  properties,
}: CompositTableRow) => {
  const display = resolveCompositParentHighwayDisplay(properties)
  if (!display) return null

  return (
    <TagsTableRow sourceId={sourceId} tagKey={display.rowTagKey}>
      <ConditionalFormattedValue
        sourceId={sourceId}
        tagKey={display.valueTagKey}
        tagValue={display.tagValue}
      />
    </TagsTableRow>
  )
}
