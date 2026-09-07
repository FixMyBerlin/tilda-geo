import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { featureCollection } from '@turf/turf'
import { getOsmApiUrl } from '@/components/shared/utils/getOsmUrl'
import { STALE_TIME_NOTES_MS } from '@/config/queryStaleTimes'
import {
  osmApiFeatureCollectionSchema,
  type OsmFeatureCollectionType,
  type OsmFeaturePointType,
} from './osmNotesSchema'

export const osmNotesQueryKey = (bbox: string | undefined) => ['osmNotes', bbox] as const

const TILDA_NOTE_SEARCH_TERMS = ['#tilda', '#radverkehrsatlas']

export const osmNotesQueryOptions = ({ bbox }: { bbox: string | undefined }) => {
  return queryOptions({
    queryKey: osmNotesQueryKey(bbox),
    queryFn: async () => {
      const apiUrl = getOsmApiUrl(`/notes.json?bbox=${bbox}`)
      const response = await fetch(apiUrl, { headers: { Accept: 'application/json' } })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const rawJson = await response.json()
      const parsed = osmApiFeatureCollectionSchema.parse(rawJson)
      // Some of our features require a feature.id
      // In addition, we add a property to change the note icon (tilda notes vs. other)
      const featuresWithId: OsmFeaturePointType[] = parsed.features.map((feature) => {
        return {
          ...feature,
          id: feature.properties.id,
          properties: {
            ...feature.properties,
            tilda: feature.properties.comments.some((c) =>
              TILDA_NOTE_SEARCH_TERMS.some((term) => c.text?.toLocaleLowerCase().includes(term)),
            ),
          },
        }
      })
      // @ts-expect-error turf.featureCollection has an option `id` but we are sure it is there. But this causes a type missmatch.
      const result: OsmFeatureCollectionType = featureCollection(featuresWithId)
      return result
    },
    staleTime: STALE_TIME_NOTES_MS,
    placeholderData: keepPreviousData,
  })
}
