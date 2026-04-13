import { GeocodingControl } from '@maptiler/geocoding-control/maplibregl'
import type { ControlPosition } from 'react-map-gl/maplibre'
import { useControl } from 'react-map-gl/maplibre'
import { MAPTILER_API_KEY } from '../utils/maptilerApiKey.const'

type SearchControlClientProps = {
  position: ControlPosition
}

export const SearchControlClient = ({ position }: SearchControlClientProps) => {
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

  return (
    <style
      // biome-ignore lint/security/noDangerouslySetInnerHtml: static CSS for geocoder control
      dangerouslySetInnerHTML={{
        __html: '.maplibregl-ctrl-geocoder .input-group { border: 1px solid rgb(212 212 216) }',
      }}
    />
  )
}
