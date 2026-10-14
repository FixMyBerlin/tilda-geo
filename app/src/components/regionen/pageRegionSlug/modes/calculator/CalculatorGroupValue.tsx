import { ConditionalFormattedValue } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/ConditionalFormattedValue'
import { calculatorTranslationSourceId } from './calculatorDatasets.const'
import { calculatorMissingGroupValueLabel } from './utils/calculateMetricSummaries'

type Props = {
  parts: Parameters<typeof calculatorTranslationSourceId>[0]
  tagKey: string
  /** The value as a filter stores it; `''` is a missing tag. */
  value: string
}

/** A value of a group-by key. A missing tag is no tag value, so it is not looked up as one. */
export const CalculatorGroupValue = ({ parts, tagKey, value }: Props) => {
  if (!value) return <>{calculatorMissingGroupValueLabel}</>

  return (
    <ConditionalFormattedValue
      sourceId={calculatorTranslationSourceId(parts, tagKey, value)}
      tagKey={tagKey}
      tagValue={value}
    />
  )
}
