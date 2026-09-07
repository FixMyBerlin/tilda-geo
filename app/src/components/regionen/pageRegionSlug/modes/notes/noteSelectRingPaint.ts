import { modeIdentity } from '@/components/regionen/pageRegionSlug/modes/modeIdentity'

/** Selected ring under note icons (same treatment as LayerHighlight symbols). */
export const noteSelectRingPaint = {
  'circle-color': 'transparent',
  'circle-radius': 10,
  'circle-stroke-width': 2,
  'circle-stroke-color': modeIdentity.notes.accent,
  'circle-stroke-opacity': 0.8,
} as const
