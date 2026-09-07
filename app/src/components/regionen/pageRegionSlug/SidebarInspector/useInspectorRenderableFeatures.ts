import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { useMapInspectorFeatures } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useSelectedFeatures } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useSelectedFeatures'
import { isModeOwnedSource } from '@/components/regionen/pageRegionSlug/modes/modeScopedSelection'

const isMapFeature = (feature: MapGeoJSONFeature | undefined): feature is MapGeoJSONFeature =>
  feature !== undefined

/** Inspector features excluding sources owned by the current mode panel (notes / QA / Prüflisten). */
export const inspectorRenderableFeatures = (
  inspectorFeatures: MapGeoJSONFeature[],
  selectedMapFeatures: (MapGeoJSONFeature | undefined)[],
) => {
  const rawFeatures = inspectorFeatures.length
    ? inspectorFeatures
    : selectedMapFeatures.filter(isMapFeature)
  return rawFeatures.filter((feature) => !isModeOwnedSource(feature.source))
}

/** True when the mobile inspector sheet (or desktop inspector) has something to show. */
export const useInspectorRenderableFeatures = () => {
  const inspectorFeatures = useMapInspectorFeatures()
  const selectedFeatures = useSelectedFeatures(!inspectorFeatures.length)
  return inspectorRenderableFeatures(
    inspectorFeatures,
    selectedFeatures.map((feature) => feature.mapFeature),
  )
}
