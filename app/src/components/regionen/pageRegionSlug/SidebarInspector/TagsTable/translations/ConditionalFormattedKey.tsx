import { registerInspectorMissingTranslation } from '@/components/regionen/pageRegionSlug/hooks/mapState/useInspectorMissingTranslationsState'
import { useRegionDatasetsQuery } from '@/components/regionen/pageRegionSlug/hooks/useRegionDataQueries'
import type { SourcesId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sources.const'
import { isDev } from '@/components/shared/utils/isEnv'
import { InspectorFormattedMessage } from './InspectorFormattedMessage'
import { translations } from './translations.const'
import { shouldShowRawInspectorValues } from './utils/shouldShowRawInspectorValues'

type Props = {
  sourceId: SourcesId | string // string = StaticDatasetsIds
  tagKey: string
}

export const ConditionalFormattedKey = ({ sourceId, tagKey }: Props) => {
  const translationKey = `${sourceId}--${tagKey}--key`
  const debugTitle = isDev ? `(KEY) ${translationKey}` : undefined

  const { data: regionDatasets } = useRegionDatasetsQuery()
  const showRawValues = shouldShowRawInspectorValues(sourceId, regionDatasets)
  const hasMissingTranslation = !showRawValues && !translations[translationKey]

  if (hasMissingTranslation) {
    registerInspectorMissingTranslation({ missing: translationKey })
  }

  if (showRawValues) {
    return <code title={debugTitle}>{tagKey}</code>
  }

  return (
    <span title={debugTitle}>
      <InspectorFormattedMessage id={translationKey} defaultMessage={tagKey} />
    </span>
  )
}
