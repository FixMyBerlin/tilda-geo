import { IntlProvider } from 'react-intl'
import { useRegionDatasetsQuery } from '@/components/regionen/pageRegionSlug/hooks/useRegionDataQueries'
import { quote } from '@/components/shared/text/Quotes'
import { parseSourceKeyStaticDatasets } from '../utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { staticDatasetDisplayName } from '../utils/staticDatasetDisplayName'
import { Disclosure } from './Disclosure/Disclosure'
import type { InspectorFeature } from './Inspector'
import { TagsTable } from './TagsTable/TagsTable'
import { translations } from './TagsTable/translations/translations.const'
import { ToolsLinks } from './Tools/ToolsLinks'
import { ToolsOtherProperties } from './Tools/ToolsOtherProperties'
import { ToolsWrapper } from './Tools/ToolsWrapper'

export const InspectorFeatureStaticDataset = ({ sourceKey, feature }: InspectorFeature) => {
  const { data: regionDatasets } = useRegionDatasetsQuery()
  if (!sourceKey || !feature.properties) return null

  // The documentedKeys info is placed on the source object
  const { sourceId, subId } = parseSourceKeyStaticDatasets(sourceKey)
  const sourceData = regionDatasets.find(
    (dataset) => dataset.id === sourceId && dataset.subId === subId,
  )

  if (!sourceData) return null
  if (!sourceData.inspector.enabled) return null

  const datasetTranslations = { ...translations, ...sourceData.inspector.translations }

  return (
    <IntlProvider messages={datasetTranslations} locale="de" defaultLocale="de">
      <Disclosure
        title={<>Statische Daten {quote(staticDatasetDisplayName(sourceData))}</>}
        objectId={feature.properties.osm_id}
        showLockIcon={!sourceData.public}
      >
        <p
          // oxlint-disable-next-line react/no-danger -- attribution HTML from dataset config
          dangerouslySetInnerHTML={{ __html: sourceData.attributionHtml }}
          className="border-b py-1.5 pr-2 pl-2 text-gray-400"
        />
        <TagsTable
          properties={feature.properties}
          sourceDocumentedKeys={sourceData.inspector.documentedKeys}
          sourceId={sourceId}
          charts={sourceData.inspector.charts}
        />

        <ToolsWrapper>
          <ToolsLinks
            feature={feature}
            editors={sourceData.inspector.editors}
            osmIdConfig={sourceData.osmIdConfig}
          />
          <ToolsOtherProperties feature={feature} sourceId={sourceId} />
        </ToolsWrapper>
      </Disclosure>
    </IntlProvider>
  )
}
