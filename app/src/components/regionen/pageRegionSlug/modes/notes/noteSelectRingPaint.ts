import type { FilterSpecification } from 'maplibre-gl'
import { modeIdentity } from '@/components/regionen/pageRegionSlug/modes/modeIdentity'

/**
 * Hover and selection use the same fill disc under the icon. A stroke ring is hard to keep
 * concentric with the sprite.
 */
export const noteHighlightCirclePaint = {
  'circle-color': modeIdentity.notes.accent.hex,
  'circle-opacity': 0.28,
  'circle-radius': 16,
  'circle-stroke-width': 0,
} as const

export const noteHighlightFilter = (ids: number[]) => {
  const unique = [...new Set(ids.filter(Number.isFinite))]
  const [first, ...rest] = unique
  if (first === undefined) return ['literal', false] satisfies FilterSpecification
  if (rest.length === 0) return ['==', ['get', 'id'], first] satisfies FilterSpecification
  return ['in', 'id', first, ...rest] satisfies FilterSpecification
}
