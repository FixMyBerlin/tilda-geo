import type { FilterSpecification } from 'maplibre-gl'
import { modeIdentity } from '@/components/regionen/pageRegionSlug/modes/modeIdentity'

/** Selected ring under note icons (same treatment as LayerHighlight symbols). */
export const noteSelectRingPaint = {
  'circle-color': 'transparent',
  'circle-radius': 10,
  'circle-stroke-width': 2,
  'circle-stroke-color': modeIdentity.notes.accent.hex,
  'circle-stroke-opacity': 0.8,
} as const

/**
 * List-hover disc under the note icon. Fill only and larger than the sprite — a stroke ring
 * is hard to keep concentric with the icon, and a solid border makes any offset obvious.
 */
export const noteHoverCirclePaint = {
  'circle-color': modeIdentity.notes.accent.hex,
  'circle-opacity': 0.28,
  'circle-radius': 16,
  'circle-stroke-width': 0,
} as const

export const noteHoverFilter = (hoveredId: number | null) => {
  if (hoveredId == null) return ['literal', false] satisfies FilterSpecification
  return ['==', ['get', 'id'], hoveredId] satisfies FilterSpecification
}
