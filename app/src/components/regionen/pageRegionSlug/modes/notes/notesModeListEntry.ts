import type { FeatureCollection } from 'geojson'
import { internalNotesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersInternalNotes'
import { osmNotesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersOsmNotes'
import {
  osmNoteReplyCount,
  type OsmFeaturePointType,
} from '@/components/regionen/pageRegionSlug/modes/notes/osmNotesSchema'

/** Normalized note row shown in the notes mode list, for both internal and OSM notes. */
export type NotesModeListEntry = {
  id: number
  sourceId: string
  coordinates: [number, number]
  status: 'open' | 'closed'
  title: string
  subtitle?: string
  commentPreview?: string
  commentCount: number
}

const truncate = (text: string, max = 80) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text

/** Map the internal-notes feature collection (getNotesAndCommentsForRegion) to list entries. */
export const internalNotesToListEntries = (collection: FeatureCollection | undefined) => {
  if (!collection) return []
  return collection.features.flatMap((feature) => {
    if (feature.geometry?.type !== 'Point') return []
    const props = feature.properties ?? {}
    const [lng, lat] = feature.geometry.coordinates
    if (typeof lng !== 'number' || typeof lat !== 'number') return []
    return [
      {
        id: Number(props.id),
        sourceId: internalNotesSourceId,
        coordinates: [lng, lat],
        status: props.status === 'closed' ? 'closed' : 'open',
        title: String(props.subject || `Hinweis #${props.id}`),
        subtitle: props.authorName ? String(props.authorName) : undefined,
        commentPreview: props.latestComment ? truncate(String(props.latestComment)) : undefined,
        commentCount: Number(props.commentCount ?? 0),
      } satisfies NotesModeListEntry,
    ]
  })
}

/** Map the OSM-notes feature collection (Query cache) to read-only list entries. */
export const osmNotesToListEntries = (
  features:
    | { geometry: OsmFeaturePointType['geometry']; properties: OsmFeaturePointType['properties'] }[]
    | undefined,
) => {
  if (!features) return []
  return features.flatMap((feature) => {
    const { properties: props, geometry } = feature
    const [lng, lat] = geometry.coordinates
    if (typeof lng !== 'number' || typeof lat !== 'number') return []
    const firstComment = props.comments[0]
    return [
      {
        id: props.id,
        sourceId: osmNotesSourceId,
        coordinates: [lng, lat],
        status: props.status,
        title: `Hinweis #${props.id}`,
        subtitle: firstComment?.user || undefined,
        commentPreview: firstComment?.text ? truncate(firstComment.text) : undefined,
        commentCount: osmNoteReplyCount(props.comments),
      } satisfies NotesModeListEntry,
    ]
  })
}
