import { TagsTableRow } from '../TagsTableRow'
import { ConditionalFormattedValue } from '../translations/ConditionalFormattedValue'
import type { CompositTableRow } from './types'

export const tableKeyHighway = 'composit_parent_highway'
export const TagsTableRowCompositParentHighway = ({
  sourceId,
  tagKey: _, // is `composit_parent_highway` which is not helpful here
  properties,
}: CompositTableRow) => {
  const lookupCandidates = [
    {
      sourceValue: properties._parent_highway,
      rowTagKey: '_parent_highway',
      valueTagKey: 'highway',
    },
    { sourceValue: properties.road, rowTagKey: '_parent_highway', valueTagKey: 'highway' },
    { sourceValue: properties.highway, rowTagKey: '_parent_highway', valueTagKey: 'highway' },
  ] as const
  const candidate = lookupCandidates.find((entry) => Boolean(entry.sourceValue))
  if (!candidate) return null

  return (
    <TagsTableRow sourceId={sourceId} tagKey={candidate.rowTagKey}>
      <ConditionalFormattedValue
        sourceId={sourceId}
        tagKey={candidate.valueTagKey}
        tagValue={candidate.sourceValue}
      />
    </TagsTableRow>
  )
}
