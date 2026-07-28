import { FormattedMessage } from 'react-intl'
import { getInspectorValueDescriptionTranslationKey } from '@/data/topicDocs/runtime'
import type { TagsTableRowProps } from './TagsTableRow'
import { ConditionalFormattedValue } from './translations/ConditionalFormattedValue'
import { ValueDisclosure, ValueDisclosureButton, ValueDisclosurePanel } from './ValueDisclosure'

export const TagsTableRowValueWithTooltip = ({
  sourceId,
  tagKey,
  tagValue,
  children,
}: TagsTableRowProps) => {
  const descriptionKey = getInspectorValueDescriptionTranslationKey(sourceId, tagKey, tagValue)

  const valueContent =
    tagValue != null ? (
      <ConditionalFormattedValue sourceId={sourceId} tagKey={tagKey} tagValue={tagValue} />
    ) : (
      children
    )

  if (!descriptionKey) {
    return <>{valueContent}</>
  }

  return (
    <ValueDisclosure>
      <ValueDisclosureButton>
        <span>{valueContent}</span>
      </ValueDisclosureButton>
      <ValueDisclosurePanel>
        <p>
          <FormattedMessage id={descriptionKey} />
        </p>
      </ValueDisclosurePanel>
    </ValueDisclosure>
  )
}
