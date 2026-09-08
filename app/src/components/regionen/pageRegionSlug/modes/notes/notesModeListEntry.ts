import type { Feature, FeatureCollection } from 'geojson'
import { internalNotesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersInternalNotes'
import { osmNotesSourceId } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/SourcesLayersOsmNotes'
import { osmFeaturePointSchema } from '@/components/regionen/pageRegionSlug/modes/notes/osmNotesSchema'

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
export const osmNotesToListEntries = (features: Feature[] | undefined) => {
  if (!features) return []
  return features.flatMap((feature) => {
    const parsed = osmFeaturePointSchema.safeParse(feature)
    if (!parsed.success) return []
    const { properties: props, geometry } = parsed.data
    const [lng, lat] = geometry.coordinates
    if (typeof lng !== 'number' || typeof lat !== 'number') return []
    const firstComment = props.comments[0]
    const lastComment = props.comments[props.comments.length - 1]
    return [
      {
        id: props.id,
        sourceId: osmNotesSourceId,
        coordinates: [lng, lat],
        status: props.status,
        title: firstComment?.text ? truncate(firstComment.text) : `OSM-Hinweis #${props.id}`,
        subtitle: firstComment?.user || undefined,
        commentPreview: lastComment?.text ? truncate(lastComment.text) : undefined,
        commentCount: props.comments.length,
      } satisfies NotesModeListEntry,
    ]
  })
}
