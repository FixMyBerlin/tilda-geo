import type { FilterSpecification } from 'maplibre-gl'
import { modeIdentity } from '@/components/regionen/pageRegionSlug/modes/modeIdentity'

/** Shared hover/selection shadow; circle radius and half the line/area halo width. */
export const modeHighlightShadowPx = 16
export const modeHighlightOpacity = 0.28

/**
 * Hover and selection use the same fill disc under the icon. A stroke ring is hard to keep
 * concentric with the sprite.
 */
export const noteHighlightCirclePaint = {
  'circle-color': modeIdentity.notes.accent.hex,
  'circle-opacity': modeHighlightOpacity,
  'circle-radius': modeHighlightShadowPx,
  'circle-stroke-width': 0,
} as const

export const noteHighlightFilter = (ids: number[]) => {
  const unique = [...new Set(ids.filter(Number.isFinite))]
  const [first] = unique
  if (first === undefined) return ['literal', false] satisfies FilterSpecification
  if (unique.length === 1) return ['==', ['get', 'id'], first] satisfies FilterSpecification
  return ['in', ['get', 'id'], ['literal', unique]] satisfies FilterSpecification
}
