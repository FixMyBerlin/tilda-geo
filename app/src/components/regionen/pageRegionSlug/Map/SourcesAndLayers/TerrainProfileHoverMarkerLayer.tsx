import { useQueryClient } from '@tanstack/react-query'
import { featureCollection, point } from '@turf/turf'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useMapInspectorFeatures } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useBg3dParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBg3dParam'
import {
  terrainProfileGeometryFingerprint,
  terrainProfileGeometryFromFeature,
} from '@/components/regionen/pageRegionSlug/profile/geometry/terrainProfileGeometryFromFeature'
import { useTerrainProfileHoverSampleIndex } from '@/components/regionen/pageRegionSlug/profile/state/terrain-profile-hover-store'
import type { TerrainProfileData } from '@/components/regionen/pageRegionSlug/profile/types'
import { terrainProfileQueryKey } from '@/components/regionen/pageRegionSlug/profile/ui/SelectedFeatureTerrainProfilePanel'

const TERRAIN_PROFILE_HOVER_SOURCE_ID = 'terrain-profile-hover'
const TERRAIN_PROFILE_HOVER_LAYER_ID = 'terrain-profile-hover-marker'

export const TerrainProfileHoverMarkerLayer = () => {
  const { is3dTerrainActive } = useBg3dParam()
  const hoverSampleIndex = useTerrainProfileHoverSampleIndex()
  const inspectorFeatures = useMapInspectorFeatures()
  const queryClient = useQueryClient()

  if (!is3dTerrainActive || hoverSampleIndex === null) return null

  const eligibleFeature = inspectorFeatures.find(
    (feature) => terrainProfileGeometryFromFeature(feature) !== null,
  )
  if (!eligibleFeature) return null

  const geometry = terrainProfileGeometryFromFeature(eligibleFeature)
  if (!geometry) return null

  const profile = queryClient.getQueryData<TerrainProfileData>(
    terrainProfileQueryKey(eligibleFeature, terrainProfileGeometryFingerprint(geometry)),
  )
  const sample = profile?.samples[hoverSampleIndex]
  if (!sample) return null

  const geojson = featureCollection([
    point([sample.lng, sample.lat], { elevation: sample.elevationMeters }),
  ])

  return (
    <Source id={TERRAIN_PROFILE_HOVER_SOURCE_ID} type="geojson" data={geojson}>
      <Layer
        id={TERRAIN_PROFILE_HOVER_LAYER_ID}
        type="circle"
        paint={{
          'circle-radius': 7,
          'circle-color': '#ca8a04',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        }}
      />
    </Source>
  )
}
