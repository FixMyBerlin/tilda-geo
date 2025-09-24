import { FormattedMessage, IntlProvider } from 'react-intl'
import { getSourceData } from '../../_mapData/utils/getMapDataUtils'
import { parseSourceKeyAtlasGeo } from '../utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import { Disclosure } from './Disclosure/Disclosure'
import { InspectorFeature } from './Inspector'
import { NoticeMaproulette } from './InspectorFeatureSource/NoticeMaproulette'
import { NoticeTransformedGeometry } from './InspectorFeatureSource/NoticeTransformedGeometry'
import { MapillaryIframe } from './MapillaryIframe/MapillaryIframe'
import { TagsTable } from './TagsTable/TagsTable'
import { translations } from './TagsTable/translations/translations.const'
import { ToolsLinks } from './Tools/ToolsLinks'
import { ToolsOtherProperties } from './Tools/ToolsOtherProperties'
import { ToolsWrapper } from './Tools/ToolsWrapper'
import { extractOsmTypeIdByConfig } from './Tools/osmUrls/extractOsmTypeIdByConfig'
import { osmTypeIdString } from './Tools/osmUrls/osmUrls'

export const InspectorFeatureTilda = ({ sourceKey, feature }: InspectorFeature) => {
  const { geometry, properties } = feature
  if (!sourceKey || !properties) return null

  // The documentedKeys info is placed on the source object
  const { sourceId } = parseSourceKeyAtlasGeo(sourceKey)
  const sourceData = getSourceData(sourceId)
  const { osmType, osmId } = extractOsmTypeIdByConfig(properties, sourceData.osmIdConfig)
  const osmTypeId = osmType && osmId ? osmTypeIdString(osmType, osmId) : undefined

  if (!sourceData.inspector.enabled) return null
  if (!sourceId) return null

  return (
    <IntlProvider messages={translations} locale="de" defaultLocale="de">
      <Disclosure title={<FormattedMessage id={`${sourceId}--title`} />} objectId={osmTypeId}>
        <NoticeTransformedGeometry visible={properties?.prefix} />

        <NoticeMaproulette
          sourceId={sourceId}
          osmTypeIdString={osmTypeId}
          kind={properties?.category || properties?.road}
          properties={properties}
          geometry={geometry}
        />

        {/* Mapillary Source: Show preview */}
        <MapillaryIframe visible={sourceId.includes('mapillary')} pKey={properties.id} />

        <div className="py-1">{/* Spacer */}</div>

        <TagsTable
          properties={properties}
          sourceDocumentedKeys={sourceData.inspector.documentedKeys}
          sourceId={sourceId}
        />

        {/* <Verification properties={properties} sourceId={sourceId} /> */}

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
  )
}
