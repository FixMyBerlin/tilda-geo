import { pointBbox, useMapExtentFilter, type ModeListExtent } from '../useMapExtentFilter'
import type { NotesModeListEntry } from './notesModeListEntry'

/**
 * Notes after the map extent filter. OSM notes are already the map bbox; TILDA notes follow
 * `extent`. The list rows and the count in the filter bar share it.
 */
export const useVisibleNotesEntries = (
  entries: NotesModeListEntry[],
  showingOsm: boolean,
  extent: ModeListExtent | undefined,
) => {
  const passesExtent = useMapExtentFilter(showingOsm ? 'all' : (extent ?? 'view'))
  return entries.filter((entry) => passesExtent(pointBbox(entry.coordinates)))
}
