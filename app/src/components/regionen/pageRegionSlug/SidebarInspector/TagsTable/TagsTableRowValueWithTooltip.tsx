import { FormattedMessage } from 'react-intl'
import type { TagsTableRowProps } from './TagsTableRow'
import { ConditionalFormattedValue } from './translations/ConditionalFormattedValue'
import { translations } from './translations/translations.const'
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

  // For some key we want to force a tooltip (regardless of it's values).
  const tooltipOverwrites = {
    // [Search key]: [Key of translation]
    length: 'ALL--length--tooltip',
  }
  const hasTooltipOverwrite = Object.keys(tooltipOverwrites).includes(tagKey)

  const hasTooltip =
    hasTooltipOverwrite ||
    (tagValue && Boolean(translations[`${sourceId}--${tagKey}=${tagValue}--tooltip`]))

  if (!hasTooltip) {
    return <>{TagValueCell || children}</>
  }

  const TooltipValue = hasTooltipOverwrite ? (
    <FormattedMessage id={tooltipOverwrites[tagKey]} />
  ) : (
    <ConditionalFormattedValue
      sourceId={sourceId}
      tagKey={tagKey}
      tagValue={`${tagValue}--tooltip`}
    />
  )

  return (
    <ValueDisclosure>
      <ValueDisclosureButton>{TagValueCell || children}</ValueDisclosureButton>
      <ValueDisclosurePanel>{TooltipValue}</ValueDisclosurePanel>
    </ValueDisclosure>
  )
}
