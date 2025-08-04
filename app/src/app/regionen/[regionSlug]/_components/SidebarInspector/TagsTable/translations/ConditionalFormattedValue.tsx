import { isDev, isStaging } from '@/src/app/_components/utils/isEnv'
import { useRegionDatasets } from '@/src/app/regionen/[regionSlug]/_hooks/useRegionDatasets/useRegionDatasets'
import { SourcesId } from '@/src/app/regionen/[regionSlug]/_mapData/mapDataSources/sources.const'
import { getDatasetOrSourceData } from '@/src/app/regionen/[regionSlug]/_mapData/utils/getMapDataUtils'
import { FormattedDate, FormattedMessage, FormattedNumber } from 'react-intl'
import { NodataFallback } from '../compositTableRows/NodataFallback'
import { translations } from './translations.const'

type Props = {
  sourceId: SourcesId | string // string = StaticDatasetsIds
  tagKey: string
  tagValue: string
}

// In atlas-geo, we started to prefix all raw values with `osm__`.
const prefixWithOsm = (tagKey: string) => {
  return `osm_${tagKey}`
}

export const ConditionalFormattedValue = ({ sourceId, tagKey, tagValue }: Props) => {
  const regionDatasets = useRegionDatasets()

  if (typeof tagValue === 'undefined') {
    return <NodataFallback />
  }

  // Some data should not be "translated"; we want to show the raw string.
  const sourceData = getDatasetOrSourceData(sourceId, regionDatasets)
  const showRawValues =
    sourceData &&
    'disableTranslations' in sourceData.inspector &&
    sourceData.inspector.disableTranslations === true
  if (showRawValues) {
    return (
      <code className="break-all">
        {typeof tagValue === 'boolean' ? JSON.stringify(tagValue) : tagValue || '–'}
      </code>
    )
  }

  // Some values are translated in the DB in `atlas-geo`, we keep them as is.
  const categoryTranslatedAlready = sourceId == 'atlas_poiClassification' && tagKey == 'category'
  if (categoryTranslatedAlready) {
    return <>{tagValue}</>
  }

  // Some values are untranslatable (eg. `name`), we keep them as is.
  const keepAsIs = [
    'name',
    'highway_name',
    'highway:name', // bietigheim-bissingen_parking_areas
    'maxstay:conditional', // bietigheim-bissingen_parking_areas
    'operator',
    'description',
    'website',
    'cycle_network_key', // bikeroutes
    'route_description', // bikeroutes
    'symbol_description', // bikeroutes
    'colours', // bikeroutes
    'colour',
    'ref', // bikeroutes
  ]
  if (keepAsIs.includes(tagKey) || keepAsIs.map((v) => prefixWithOsm(v)).includes(tagKey)) {
    return <>{tagValue}</>
  }

  // https://formatjs.io/docs/react-intl/components/#formattednumber
  const numberConfigs: { key: string; suffix?: string }[] = [
    { key: 'capacity', suffix: undefined },
    { key: 'capacity:cargo_bike', suffix: undefined },
    { key: 'capacity:disabled', suffix: undefined },
    { key: 'highway_width_proc_effective', suffix: 'm' }, // parkraumParkingStats
    { key: 'length', suffix: 'm' },
    { key: 'maxspeed', suffix: 'km/h' },
    { key: 'maxheight', suffix: 'm' },
    { key: 'population', suffix: 'Einwohner:innen' },
    { key: 'width', suffix: 'm' },
    { key: 'sum_km', suffix: 'km' }, // parkraumParkingStats
    { key: 'lane_km', suffix: 'km' }, // parkraumParkingStats
    { key: 'd_other_km', suffix: 'km' }, // parkraumParkingStats
    { key: 'on_kerb_km', suffix: 'km' }, // parkraumParkingStats
    { key: 'half_on_kerb_km', suffix: 'km' }, // parkraumParkingStats
    { key: 'street_side_km', suffix: 'km' }, // parkraumParkingStats
    { key: 'length_wo_dual_carriageway', suffix: 'km' }, // parkraumParkingStats
    { key: 'done_percent', suffix: '%' }, // parkraumParkingStats
    { key: 'admin_level', suffix: undefined },
    { key: 'maxstay', suffix: 'Minuten' }, // bietigheim-bissingen_parking_areas
    { key: 'parking:levels', suffix: 'Stockwerke' }, // bietigheim-bissingen_parking_areas
    { key: 'distance', suffix: 'km' }, // bikeroutes
    { key: 'buffer_left', suffix: 'm' }, // bikelanes
    { key: 'buffer_right', suffix: 'm' }, // bikelanes
    { key: 'tilda_osm_id', suffix: undefined }, // infravelo
    { key: 'tilda_width', suffix: 'm' }, // infravelo
    { key: 'radius', suffix: 'm' }, // parkings_cutouts
    { key: 'area', suffix: 'm²' }, // area values
    { key: 'circumference', suffix: 'm' }, // circumference values
    { key: 'buffer_radius', suffix: 'm' }, // buffer radius values
    { key: 'direction', suffix: '°' }, // direction values in degrees
  ]
  const numberConfig = numberConfigs.find(
    (c) => c.key === tagKey || prefixWithOsm(c.key) === tagKey,
  )
  if (numberConfig) {
    return (
      <>
        <FormattedNumber value={parseFloat(tagValue)} /> {numberConfig.suffix}
      </>
    )
  }

  const dateKeys = ['population:date']
  if (dateKeys.includes(tagKey) || dateKeys.map((v) => prefixWithOsm(v)).includes(tagKey)) {
    return (
      <span className="group">
        <FormattedDate value={tagValue} />{' '}
        <code className="text-gray-50 group-hover:text-gray-600">{tagValue}</code>
      </span>
    )
  }

  let translationKey = `${sourceId}--${tagKey}=${tagValue}`

  // Some keys are a duplicate of other Keys.
  // We want them translated only once, so we overwrite them here…
  const keyOverwrites: Record<string, string> = { _parent_highway: 'highway' }
  if (Object.keys(keyOverwrites).includes(tagKey)) {
    // TODO TS: Why is the "!"" required here?
    tagKey = keyOverwrites[tagKey]!
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
    const translationKeyCandidate = `${lookAtFirstSources[lookAtThisSourceFirst]}--${tagKey}=${tagValue}`
    translationKey = translations[translationKeyCandidate]
      ? translationKeyCandidate
      : translationKey
  }

  // Some tags are translated already for a different key, so lets look there…
  // Keys need to be source specific, otherwise there is interference with the next step.
  const lookThereForKey: Record<string, string> = {
    'atlas_roads--road': 'highway',
    'atlas_roadsPathClasses--road': 'highway',
    'atlas_bikelanesPresence--road': 'highway',
    'atlas_bikeSuitability--road': 'highway',
  }
  const lookThereForKeyEntry = Object.keys(lookThereForKey).find(
    (k) => k === `${sourceId}--${tagKey}`,
  )
  if (lookThereForKeyEntry) {
    tagKey = lookThereForKey[lookThereForKeyEntry]!
    translationKey = `ALL--${lookThereForKey[lookThereForKeyEntry]}=${tagValue}`
  }

  // Lastly…
  // Some TagKeys are not specific per source; we only translate those once. UNLESS they have a source specific translation.
  const nonCategorizedTagKeys = [
    '_parent_highway',
    'highway',
    'smoothness',
    'surface',
    'surface_color',
    'category',
    'traffic_sign',
    'traffic_sign:forward',
    'traffic_sign:backward',
    'confidence', // true key is `maxspeed_confidence`, `surface_confidence`, … but we overwrite that when passing props
    // 'fresh', // true key is `maxspeed_fresh`, `surface_fresh`, … but we overwrite that when passing props
    'width_source',
    'length',
    'lifecycle',
  ]
  if (!translations[translationKey] && nonCategorizedTagKeys.includes(tagKey)) {
    translationKey = `ALL--${tagKey}=${tagValue}`
  }

  if (isDev || isStaging) {
    console.log('Inspector: Missing translation', { missing: translationKey, fallback: tagValue })
  }

  return <FormattedMessage id={translationKey} defaultMessage={tagValue} />
}
