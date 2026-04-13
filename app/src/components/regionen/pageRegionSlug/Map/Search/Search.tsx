import { ClientOnly } from '@tanstack/react-router'
import { useStaticRegion } from '../../regionUtils/useStaticRegion'
import { SearchControlClient } from './SearchControl.client'

// DOCS:
// React Map GL: https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/use-control
// Maptiler GeocodingControl: https://docs.maptiler.com/react/maplibre-gl-js/geocoding-control/
// NOT: https://docs.maptiler.com/react/maplibre-gl-js/geocoding-control/
export const Search = () => {
  const region = useStaticRegion()

  if (region?.showSearch !== true) return null

  return (
    <ClientOnly fallback={null}>
      <SearchControlClient position="top-right" />
    </ClientOnly>
  )
}
