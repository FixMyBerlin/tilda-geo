import { GeocodingControl } from '@maptiler/geocoding-control/maplibregl'
import '@maptiler/geocoding-control/style.css'
import { ControlPosition, useControl } from 'react-map-gl/maplibre'
import { useStaticRegion } from '../../regionUtils/useStaticRegion'
import { MAPTILER_API_KEY } from '../utils/maptilerApiKey.const'

function SearchControl({ position }: { position: ControlPosition }) {
  useControl(
    () =>
      new GeocodingControl({
        apiKey: MAPTILER_API_KEY,
        placeholder: 'Suche',
        proximity: [
          {
            type: 'map-center',
          },
        ],
        country: 'DE',
      }),
    { position },
  )
  return null
}

// DOCS:
// React Map GL: https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/use-control
// Maptiler GeocodingControl: https://docs.maptiler.com/react/maplibre-gl-js/geocoding-control/
// NOT: https://docs.maptiler.com/react/maplibre-gl-js/geocoding-control/
export const Search = () => {
  const region = useStaticRegion()
  if (region?.showSearch !== true) return null

  // NOTE: We cannot add custom html/css here; the control is portaled to the `position` so the styles don't apply
  return (
    <>
      <SearchControl position="top-right" />
      <style
        dangerouslySetInnerHTML={{
          // border border-gray-300
          __html: '.maplibregl-ctrl-geocoder .input-group { border: 1px solid rgb(212 212 216) }',
        }}
      />
    </>
  )
}
