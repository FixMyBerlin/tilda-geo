import { isDev } from '@/src/app/_components/utils/isEnv'
import { useRegionDatasets } from '@/src/app/regionen/[regionSlug]/_hooks/useRegionDatasets/useRegionDatasets'
import React from 'react'
import { FormattedMessage } from 'react-intl'
import { SourcesId } from '../../../../_mapData/mapDataSources/sources.const'
import { getDatasetOrSourceData } from '../../../../_mapData/utils/getMapDataUtils'
import { translations } from './translations.const'

type Props = {
  sourceId: SourcesId | string // string = StaticDatasetsIds
  tagKey: string
}

export const ConditionalFormattedKey: React.FC<Props> = ({ sourceId, tagKey }) => {
  let key = `${sourceId}--${tagKey}--key`

  // Some data should not be "translated"; we want to show the raw string.
  const regionDatasets = useRegionDatasets()
  const sourceData = getDatasetOrSourceData(sourceId, regionDatasets)
  const showRawValues =
    sourceData &&
    'disableTranslations' in sourceData.inspector &&
    sourceData.inspector.disableTranslations === true
  if (showRawValues) {
    return <code>{tagKey}</code>
  }

  // Some sources have their keys translated already for a different source, so lets look there…
  const lookAtFirstSources: Record<string, string> = {
    'bibi-on-street-parking-lines': 'parkraumParking',
    'bibi-parking-areas': 'parkraumParkingAreas',
    'bibi-on-street-parking-ortskerne-2023-onstreet': 'parkraumParking',
    'bibi-on-street-parking-ortskerne-2023-offstreet': 'parkraumParkingAreas',
    atlas_roadsPathClasses: 'atlas_roads',
    atlas_bikelanesPresence: 'atlas_roads',
    atlas_bikeSuitability: 'atlas_roads',
  }
  const lookAtThisSourceFirst = Object.keys(lookAtFirstSources).find((s) => s === sourceId)
  if (lookAtThisSourceFirst) {
    const keyCandidate = `${sourceId.replace(
      lookAtThisSourceFirst,
      // TODO TS: Why is the "!" required here?
      lookAtFirstSources[lookAtThisSourceFirst]!,
    )}--${tagKey}--key`
    key = translations[keyCandidate] ? keyCandidate : key
  }

  // For some key, we don't want to add translations for each source.
  // For those, we use a simple fallback. UNLESS they have a source specific translation.
  // (Unfortunatelly react-intl. does not support nested FormattedMessage components to handle the fallbacks.)
  const simpleTranslFallbackKeys = [
    '_parent_highway',
    'composit_surface_smoothness',
    'composit_mapillary',
    'surface_color',
    'highway',
    'name',
    'description',
    'oneway',
    'traffic_sign',
    'traffic_sign:forward',
    'traffic_sign:backward',
    'width',
    'maxspeed',
    'length',
  ]
  if (!translations[key] && simpleTranslFallbackKeys.includes(tagKey)) {
    key = `ALL--${tagKey}--key`
  }

  // It will take a while to translate everything. This fallback does look better on production.
  const defaultMessage = isDev ? key : tagKey

  return <FormattedMessage id={key} defaultMessage={defaultMessage} />
}
