import { featureCollection, point } from '@turf/turf'
import { useEffect } from 'react'
import { Layer, Source, useMap } from 'react-map-gl/maplibre'
import { useMapLoaded } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useTerrainProfileHoverPoints } from '@/components/regionen/pageRegionSlug/terrainProfile/state/terrain-profile-hover-store'

const TERRAIN_PROFILE_HOVER_SOURCE_ID = 'terrain-profile-hover'
const TERRAIN_PROFILE_HOVER_LAYER_ID = 'terrain-profile-hover-marker'

/** Always mounted so moveLayer can keep the cursor above selection highlights. */
export const TerrainProfileHoverMarkerLayer = () => {
  const { mainMap: map } = useMap()
  const mapLoaded = useMapLoaded()
  const hoverPoints = useTerrainProfileHoverPoints()

  // Goal: keep the profile hover circle above selection highlights.
  // Issue: topic/dataset/bg layers (and LayerHighlight) remount later and can
  // land above this always-mounted layer. (`f` only toggles feature-state — no remount.)
  // Not beforeId: this layer mounts after highlights, so it cannot be their beforeId
  // yet; highlights also must keep their Maptiler beforeId band.
  // Workaround: last in RegionMap tree + moveLayer when hoverPoints / map ready.
  useEffect(
    function keepHoverMarkerOnTop() {
      if (!map || !mapLoaded) return
      if (!map.getLayer(TERRAIN_PROFILE_HOVER_LAYER_ID)) return
      map.moveLayer(TERRAIN_PROFILE_HOVER_LAYER_ID) // beforeId undefined → top of stack
    },
    [hoverPoints, map, mapLoaded],
  )

  return (
    <>
      <Source
        id={TERRAIN_PROFILE_HOVER_SOURCE_ID}
        type="geojson"
        data={featureCollection(hoverPoints.map((entry) => point([entry.lng, entry.lat])))}
      />
      <Layer
        id={TERRAIN_PROFILE_HOVER_LAYER_ID}
        type="circle"
        source={TERRAIN_PROFILE_HOVER_SOURCE_ID}
        paint={{
          // Same look as graph sample dots: dark fill + white border.
          'circle-radius': 3,
          'circle-color': '#111827', // gray-900
          'circle-opacity': 1,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
          'circle-stroke-opacity': 1,
          'circle-pitch-alignment': 'viewport',
        }}
      />
    </>
  )
}
