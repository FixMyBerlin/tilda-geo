import type { VisibilitySpecification } from 'maplibre-gl'

export const layerVisibility = (visibile: boolean) => {
  return { visibility: visibile ? 'visible' : 'none' } satisfies {
    visibility: VisibilitySpecification
  }
}
