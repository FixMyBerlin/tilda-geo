import { MAP_FEATURE_COLOR } from '@osm-editor-kit/street-imagery'
import {
  LocationPickOnMap,
  StreetLevelImagerySourcesAndLayers,
  useMapViewportBbox,
  useViewerBearing,
  useViewerHfov,
  useViewerLngLat,
} from '@osm-editor-kit/street-imagery-react'
import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import { getStreetImageryStyle } from '../../streetImagery/streetImageryStyles'
import { useShownStreetImageryPhoto } from '../../streetImagery/useShownStreetImageryPhoto'
import { useStreetImageryParam } from '../../streetImagery/useStreetImageryParam'

/**
 * Street-level photos (Mapillary, Panoramax) of `@osm-editor-kit/street-imagery-react`: sources,
 * layers and their look come from the package. Not part of the categories; see `?photos=`.
 */
export const SourcesLayersStreetImagery = () => {
  const { providers, style, date, photo: selected } = useStreetImageryParam()
  const { mapParam } = useMapParam()
  const bbox = useMapViewportBbox('mainMap', mapParam)
  const { photo } = useShownStreetImageryPhoto()
  const bearing = useViewerBearing()
  const hfov = useViewerHfov()
  const lngLat = useViewerLngLat()

  return (
    <>
      {/* "Öffnen in …" of the layer controls: the next click on the map opens that place. */}
      <LocationPickOnMap />
      {/* Without a layer on, the shown photo (e.g. opened from the inspector) still gets its
          marker, view cone and sequence line. */}
      {(providers.length > 0 || photo) && (
        <StreetLevelImagerySourcesAndLayers
          providers={providers}
          bbox={bbox}
          zoom={mapParam.zoom}
          filter={{ date }}
          options={{
            beforeId: 'atlas-app-beforeid-below-roadname',
            photoCircleColor: getStreetImageryStyle(style, date).color,
            mapFeatureCircleColor: MAP_FEATURE_COLOR,
            selectedPhoto: photo,
            // The photo's own sequence first: the id in the URL comes from the viewer, which
            // reports a placeholder when it does not know the sequence.
            selectedSequenceId: photo?.sequenceId ?? selected?.sequence,
            viewerPov: { bearing, hfov, lngLat },
            showSelectionHighlight: true,
            showViewCone: true,
          }}
        />
      )}
    </>
  )
}
