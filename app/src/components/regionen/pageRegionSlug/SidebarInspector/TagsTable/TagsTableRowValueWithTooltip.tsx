import { getDescriptionForInspectorTag } from '@/data/topicDocs/runtime'
import type { TagsTableRowProps } from './TagsTableRow'
import { ConditionalFormattedValue } from './translations/ConditionalFormattedValue'
import { renderTranslationHtml } from './translations/renderTranslationHtml'
import { ValueDisclosure, ValueDisclosureButton, ValueDisclosurePanel } from './ValueDisclosure'

export const TagsTableRowValueWithTooltip = ({
  sourceId,
  tagKey,
  tagValue,
  children,
}: TagsTableRowProps) => {
  // Prefer value-level topic-doc descriptions; fall back to key-level (e.g. `length`).
  const description = getDescriptionForInspectorTag(sourceId, tagKey, tagValue)

  const valueContent =
    tagValue != null ? (
      <ConditionalFormattedValue sourceId={sourceId} tagKey={tagKey} tagValue={tagValue} />
    ) : (
      children
    )

  if (!description) {
    return <>{valueContent}</>
  }

  return (
    <ValueDisclosure>
      <ValueDisclosureButton>
        <span>{valueContent}</span>
      </ValueDisclosureButton>
      <ValueDisclosurePanel>
        <p>{renderTranslationHtml(description)}</p>
      </ValueDisclosurePanel>
    </ValueDisclosure>
  )
}
