import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import type { UrlFeature } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/types'
import {
  convertToUrlFeature,
  isPersistableFeature,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import {
  isModeOwnedSource,
  modeForSource,
} from '@/components/regionen/pageRegionSlug/modes/modeScopedSelection'
import type { RegionMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { dataFeatureKey, uniqueDataFeatures } from './uniqueDataFeatures'

// Same identity as `uniqueDataFeatures` (data source + `properties.id`, else `feature.id`).
// Sources that only promote an id (Flächenfinder hexagons: `promoteId="h3_id"`) have no
// `properties.id`; comparing that alone made every such feature equal to every other.
const featureInArray = (feature: MapGeoJSONFeature, features: MapGeoJSONFeature[]) => {
  const key = dataFeatureKey(feature)
  return key !== undefined && features.some((other) => dataFeatureKey(other) === key)
}

const inspectorUrlFeatures = (features: UrlFeature[]) =>
  features.filter((feature) => !isModeOwnedSource(feature.sourceId))

export const mergeModeUrlFeature = (previous: UrlFeature[], nextModeFeature: UrlFeature) => [
  ...inspectorUrlFeatures(previous),
  nextModeFeature,
]

type PartitionClickedFeaturesInput = {
  clickedFeatures: MapGeoJSONFeature[]
  currentMode: RegionMode
  previousUrlFeatures: UrlFeature[]
  previousInspectorFeatures: MapGeoJSONFeature[]
  regionDatasets: { id: string }[]
  multiselect: boolean
}

/*
 * Click handling splits inspector layers vs mode-owned layers (notes/QA/review lists)
 * so they do not share selection. Inspector supports multi-select; the active mode
 * keeps a single selected feature in the URL.
 */
export const partitionClickedFeatures = ({
  clickedFeatures,
  currentMode,
  previousUrlFeatures,
  previousInspectorFeatures,
  regionDatasets,
  multiselect,
}: PartitionClickedFeaturesInput) => {
  const clickedInspectorFeatures = uniqueDataFeatures(
    clickedFeatures.filter((feature) => !isModeOwnedSource(feature.source)),
  )
  const previousInspectorDomain = previousInspectorFeatures.filter(
    (feature) => !isModeOwnedSource(feature.source),
  )

  const nextInspectorFeatures = multiselect
    ? [
        ...previousInspectorDomain.filter(
          (feature) => !featureInArray(feature, clickedInspectorFeatures),
        ),
        ...clickedInspectorFeatures.filter(
          (feature) => !featureInArray(feature, previousInspectorDomain),
        ),
      ]
    : clickedInspectorFeatures

  const nextInspectorUrlFeatures = nextInspectorFeatures
    .filter((feature) => isPersistableFeature(feature, regionDatasets))
    .map((feature) => convertToUrlFeature(feature))

  const clickedModeFeature = clickedFeatures.find(
    (feature) => modeForSource(feature.source) === currentMode,
  )
  const previousModeUrlFeatures = previousUrlFeatures.filter(
    (feature) => modeForSource(feature.sourceId) === currentMode,
  )
  const nextModeUrlFeatures =
    clickedModeFeature && isPersistableFeature(clickedModeFeature, regionDatasets)
      ? [convertToUrlFeature(clickedModeFeature)]
      : previousModeUrlFeatures

  return {
    nextInspectorFeatures,
    nextUrlFeatures: [...nextInspectorUrlFeatures, ...nextModeUrlFeatures],
  }
}
