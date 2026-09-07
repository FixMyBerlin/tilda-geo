import { FormattedMessage, IntlProvider } from 'react-intl'
import { getSourceData } from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import { mapillaryKeyUrl } from '@/lib/mapillaryPKeyUrl'
import { parseSourceKeyAtlasGeo } from '../utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import { Disclosure } from './Disclosure/Disclosure'
import type { InspectorFeature } from './Inspector'
import {
  NoticeMaproulette,
  useNoticeMaprouletteVisible,
} from './InspectorFeatureSource/NoticeMaproulette'
import { NoticeTransformedGeometry } from './InspectorFeatureSource/NoticeTransformedGeometry'
import { MapillaryIframe } from './MapillaryIframe/MapillaryIframe'
import { TagsTable } from './TagsTable/TagsTable'
import { translations } from './TagsTable/translations/translations.const'
import { extractOsmTypeIdByConfig } from './Tools/osmUrls/extractOsmTypeIdByConfig'
import { osmTypeIdString } from './Tools/osmUrls/osmUrls'
import { ToolsLinks } from './Tools/ToolsLinks'
import { ToolsOtherProperties } from './Tools/ToolsOtherProperties'
import { ToolsWrapper } from './Tools/ToolsWrapper'

export const InspectorFeatureTilda = ({ sourceKey, feature }: InspectorFeature) => {
  const { geometry, properties } = feature
  const sourceId = sourceKey ? parseSourceKeyAtlasGeo(sourceKey).sourceId : ''
  const sourceData = sourceId ? getSourceData(sourceId) : null
  const { osmType, osmId } =
    properties && sourceData
      ? extractOsmTypeIdByConfig(properties, sourceData.osmIdConfig)
      : { osmType: undefined, osmId: undefined }
  const osmTypeId = osmType && osmId ? osmTypeIdString(osmType, osmId) : undefined

  const showMaprouletteNotice = useNoticeMaprouletteVisible({
    sourceId,
    osmTypeIdString: osmTypeId,
    kind: properties?.category || properties?.road,
    properties: properties ?? {},
    geometry,
  })

  if (!sourceKey || !properties) return null
  if (!sourceData?.inspector.enabled) return null
  if (!sourceId) return null

  const showTransformedGeometryNotice = !!properties.prefix
  const showMapillaryIframe = sourceId.includes('mapillary') && !!mapillaryKeyUrl(properties.id)
  const hasPreTableContent =
    showTransformedGeometryNotice || showMaprouletteNotice || showMapillaryIframe

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

        {hasPreTableContent && <div className="py-1" />}

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
          <ToolsOtherProperties feature={feature} sourceId={sourceId} />
        </ToolsWrapper>
      </Disclosure>
    </IntlProvider>
  )
}
