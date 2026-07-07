import { FormattedDate, FormattedMessage, FormattedNumber } from 'react-intl'
import { registerInspectorMissingTranslation } from '@/components/regionen/pageRegionSlug/hooks/mapState/useInspectorMissingTranslationsState'
import { useRegionDatasetsQuery } from '@/components/regionen/pageRegionSlug/hooks/useRegionDataQueries'
import type { SourcesId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sources.const'
import { isDev } from '@/components/shared/utils/isEnv'
import {
  getInspectorAttributeFormat,
  getInspectorValueTranslationKey,
  formatInspectorTagValue,
  isNumericTopicDocFormat,
} from '@/data/topicDocs/runtime'
import { getTopicDocNumericFormatSuffix, isTopicDocDateFormat } from '@/data/topicDocs/schema'
import { NodataFallback } from '../compositTableRows/NodataFallback'
import { translations } from './translations.const'
import { shouldShowRawInspectorValues } from './utils/shouldShowRawInspectorValues'

type Props = {
  sourceId: SourcesId | string // string = StaticDatasetsIds
  tagKey: string
  tagValue: string | boolean | undefined
}

export const ConditionalFormattedValue = ({ sourceId, tagKey, tagValue }: Props) => {
  const { data: regionDatasets } = useRegionDatasetsQuery()

  if (typeof tagValue === 'undefined') {
    return <NodataFallback />
  }
  const fallbackValue = formatInspectorTagValue(tagValue)!
  const translationKey = getInspectorValueTranslationKey(sourceId, tagKey, tagValue)!
  const debugTitle = isDev ? `(VALUE) ${translationKey}` : undefined

  const showRawValues = shouldShowRawInspectorValues(sourceId, regionDatasets)
  if (showRawValues) {
    return (
      <code className="break-all" title={debugTitle}>
        {fallbackValue || '–'}
      </code>
    )
  }

  const topicDocFormat = getInspectorAttributeFormat(sourceId, tagKey)
  if (topicDocFormat === 'sanitized_strings') {
    if (translations[translationKey]) {
      return (
        <span title={debugTitle}>
          <FormattedMessage id={translationKey} defaultMessage={fallbackValue} />
        </span>
      )
    }
    return <span title={debugTitle}>{fallbackValue}</span>
  }

  if (topicDocFormat && isNumericTopicDocFormat(topicDocFormat)) {
    const numericValue = Number(fallbackValue)
    if (Number.isNaN(numericValue)) {
      return <>{fallbackValue}</>
    }

    const suffix = getTopicDocNumericFormatSuffix(topicDocFormat)
    return (
      <span title={debugTitle}>
        <FormattedNumber value={numericValue} />
        {suffix ? ` ${suffix}` : null}
      </span>
    )
  }

  if (topicDocFormat && isTopicDocDateFormat(topicDocFormat)) {
    return (
      <span className="group" title={debugTitle}>
        <FormattedDate value={fallbackValue} />{' '}
        <code className="text-gray-50 group-hover:text-gray-600">{fallbackValue}</code>
      </span>
    )
  }

  const hasMissingTranslation = !translations[translationKey]
  if (hasMissingTranslation) {
    registerInspectorMissingTranslation({ missing: translationKey })
  }

  return (
    <span title={debugTitle}>
      <FormattedMessage id={translationKey} defaultMessage={fallbackValue} />
    </span>
  )
}
