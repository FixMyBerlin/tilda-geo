import type { DrawStyles } from '@osm-editor-kit/react-map-gl-draw'
import type { ExpressionSpecification } from 'maplibre-gl'
import { modeIdentity } from '@/components/regionen/pageRegionSlug/modes/modeIdentity'
import { REVIEW_ENTRY_MOVE_COLOR } from '../reviewEntryMapColors'

const IN_PROGRESS_COLOR = '#0ea5e9' // sky-500

const isActive: ExpressionSpecification = ['boolean', ['get', 'active'], false]
// The part that "Teil löschen" removes. Lines and areas also show their corners; a point
// has nothing else to tell it apart.
const isSelected: ExpressionSpecification = ['boolean', ['get', 'selected'], false]
const SELECTED_OUTLINE_COLOR = '#7c2d12' // orange-900

/** In-progress shapes are sky; a finished shape takes `shapeColor`. */
const createStyles = (shapeColor: string) => {
  const color: ExpressionSpecification = [
    'case',
    ['==', ['get', 'role'], 'draft'],
    IN_PROGRESS_COLOR,
    shapeColor,
  ]
  return {
    fill: { paint: { 'fill-color': color, 'fill-opacity': ['case', isSelected, 0.45, 0.25] } },
    line: { paint: { 'line-color': color, 'line-width': ['case', isSelected, 5, 3] } },
    point: {
      paint: {
        'circle-radius': ['case', isSelected, 8, 6],
        'circle-color': color,
        'circle-stroke-color': ['case', isSelected, SELECTED_OUTLINE_COLOR, '#ffffff'],
        'circle-stroke-width': ['case', isSelected, 3, 2],
      },
    },
    vertex: {
      paint: {
        'circle-radius': ['case', ['any', isActive, ['boolean', ['get', 'closing'], false]], 8, 6],
        'circle-color': REVIEW_ENTRY_MOVE_COLOR,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    },
    midpoint: {
      paint: {
        'circle-radius': ['case', isActive, 6, 4],
        'circle-color': REVIEW_ENTRY_MOVE_COLOR,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
      },
    },
  } satisfies DrawStyles
}

export const reviewDrawStyles = {
  compose: createStyles(modeIdentity.reviewLists.accent.hex),
  // The orange named in the entry detail help text.
  edit: createStyles(REVIEW_ENTRY_MOVE_COLOR),
}
