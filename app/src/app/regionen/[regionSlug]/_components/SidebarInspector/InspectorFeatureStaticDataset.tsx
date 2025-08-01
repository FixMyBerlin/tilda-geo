import { quote } from '@/src/app/_components/text/Quotes'
import { IntlProvider } from 'react-intl'
import { useRegionDatasets } from '../../_hooks/useRegionDatasets/useRegionDatasets'
import { parseSourceKeyStaticDatasets } from '../utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { Disclosure } from './Disclosure/Disclosure'
import { InspectorFeature } from './Inspector'
import { RegionBbPgNewPriorityNoteButton } from './InspectorFeatureInternalNote/RegionBbPgNewPriorityNoteButton'
import { TagsTable } from './TagsTable/TagsTable'
import { translations } from './TagsTable/translations/translations.const'
import { ToolsLinks } from './Tools/ToolsLinks'
import { ToolsOtherProperties } from './Tools/ToolsOtherProperties'
import { ToolsWrapper } from './Tools/ToolsWrapper'

export const InspectorFeatureStaticDataset = ({ sourceKey, feature }: InspectorFeature) => {
  const regionDatasets = useRegionDatasets()
  if (!sourceKey || !feature.properties) return null

  // The documentedKeys info is placed on the source object
  const sourceId = parseSourceKeyStaticDatasets(sourceKey).sourceId as string
  const sourceData = regionDatasets.find((dataset) => dataset.id === sourceId)

  if (typeof sourceData === 'undefined') return null
  if (!sourceData.inspector.enabled) return null

  const datasetTranslations = { ...translations, ...(sourceData.inspector.translations || {}) }

  return (
    <div className="mt-5 w-full rounded-2xl bg-white">
      <IntlProvider messages={datasetTranslations} locale="de" defaultLocale="de">
        <Disclosure
          title={<>Statische Daten {quote(sourceData.name)}</>}
          objectId={feature.properties.osm_id}
          showLockIcon={!sourceData.isPublic}
        >
          <p
            dangerouslySetInnerHTML={{ __html: sourceData.attributionHtml }}
            className="border-b py-1.5 pl-4 pr-3 text-gray-400"
          />
          <TagsTable
            properties={feature.properties}
            sourceDocumentedKeys={sourceData.inspector.documentedKeys}
            sourceId={sourceId}
          />

          <RegionBbPgNewPriorityNoteButton feature={feature} />

          <ToolsWrapper>
            <ToolsLinks
              feature={feature}
              editors={sourceData.inspector.editors}
              osmIdConfig={sourceData.osmIdConfig}
            />
            <ToolsOtherProperties
              feature={feature}
              documentedKeys={sourceData.inspector.documentedKeys}
            />
          </ToolsWrapper>
        </Disclosure>
      </IntlProvider>
    </div>
  )
}
