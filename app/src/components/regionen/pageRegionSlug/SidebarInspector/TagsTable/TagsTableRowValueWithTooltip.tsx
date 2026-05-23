import { getDescriptionForInspectorTag } from '@/data/topicDocs/runtime'
import type { TagsTableRowProps } from './TagsTableRow'
import { ConditionalFormattedValue } from './translations/ConditionalFormattedValue'
import { ValueDisclosure, ValueDisclosureButton, ValueDisclosurePanel } from './ValueDisclosure'

export const TagsTableRowValueWithTooltip = ({
  sourceId,
  tagKey,
  tagValue,
  children,
}: TagsTableRowProps) => {
  const TagValueCell = tagValue && (
    <ConditionalFormattedValue sourceId={sourceId} tagKey={tagKey} tagValue={tagValue} />
  )

  const dataDescription = getDescriptionForInspectorTag(sourceId, tagKey, tagValue ?? undefined)

  const hasTooltip = Boolean(dataDescription)

  if (!hasTooltip) {
    return <>{TagValueCell || children}</>
  }

  return (
    <ValueDisclosure>
      <ValueDisclosureButton>{TagValueCell || children}</ValueDisclosureButton>
      <ValueDisclosurePanel>{dataDescription}</ValueDisclosurePanel>
    </ValueDisclosure>
  )
}
