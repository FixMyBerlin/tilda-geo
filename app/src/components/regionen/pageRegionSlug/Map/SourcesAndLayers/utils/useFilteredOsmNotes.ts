import { featureCollection } from '@turf/turf'
import type { z } from 'zod'
import { useOsmNotesQuery } from '@/components/regionen/pageRegionSlug/modes/notes/useOsmNotesQuery'
import type { zodInternalNotesFilterParam } from '@/shared/regionen/regionSearchZod'

type NotesFilter = z.infer<typeof zodInternalNotesFilterParam>

/**
 * OSM notes from the Query cache, optionally filtered. The filter is passed in (owned by the notes
 * mode); the map overlay on other modes does not load OSM notes.
 */
export const useFilteredOsmNotes = (filter?: NotesFilter | null) => {
  const { data } = useOsmNotesQuery()
  const osmNotesFeatureCollection = data ?? featureCollection([])

  // Filter data
  let filteredOsmNotes = osmNotesFeatureCollection.features
  if (filter) {
    // Filter by `query` on note.body/subject or any note.comment.body
    filteredOsmNotes = filteredOsmNotes.filter((note) => {
      if (typeof filter.query !== 'string') return true
      const fullNote = osmNotesFeatureCollection.features.find(
        (fNote) => fNote.id === note.properties.id,
      )?.properties
      // ATM there is no parent object, just comments
      // if (fullNote?.body?.includes(filter.query)) return true
      if (fullNote?.comments?.some((c) => filter.query && c.text?.includes(filter.query)))
        return true
      return false
    })
    // Filter by `completed` on note.status
    filteredOsmNotes = filteredOsmNotes.filter((note) => {
      if (typeof filter.completed !== 'boolean') return true
      if (filter.completed === true && note.properties.status === 'closed') return true
      if (filter.completed === false && note.properties.status === 'open') return true
      return false
    })
    // Filter by `user` (Author) – which is the initial comment user
    filteredOsmNotes = filteredOsmNotes.filter((note) => {
      if (typeof filter.user !== 'string') return true
      if (filter.user === note.properties.comments.at(0)?.user) return true
      return false
    })
    // Filter by `commented` on note.noteComments
    filteredOsmNotes = filteredOsmNotes.filter((note) => {
      if (typeof filter.commented !== 'boolean') return true
      const fullNote = osmNotesFeatureCollection.features.find(
        (fNote) => fNote.id === note.properties.id,
      )?.properties
      if (fullNote?.comments?.length && filter.commented === fullNote.comments.length > 1) {
        return true
      }
      return false
    })
  }
  return featureCollection(filteredOsmNotes)
}
