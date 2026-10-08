import {
  createDrawController,
  featuresFromGeometry,
  geometryFromFeatures,
  shapeTypeOf,
  useDraw,
  type DrawFeature,
} from '@osm-editor-kit/react-map-gl-draw'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { toastError } from '@/components/shared/toast/toastError'
import {
  reviewEntriesQueryOptions,
  reviewListsQueryOptions,
} from '@/server/regions/regionQueryOptions'
import {
  createReviewEntryFn,
  updateReviewEntryFn,
} from '@/server/review-lists/review-lists.functions'
import { useReviewDrawSession } from '../useReviewDrawActive'
import { useReviewListsModeParam } from '../useReviewListsModeParam'
import {
  useReviewComposeFeatures,
  useReviewComposeType,
  useReviewDrawActions,
} from './review-draw-store'

const reviewDrawController = createDrawController()

type EntryGeometry = NonNullable<ReturnType<typeof geometryFromFeatures>>

const CREATE_ENTRY_KEY = ['review-lists', 'createEntry'] as const
const UPDATE_GEOMETRY_KEY = ['review-lists', 'updateEntryGeometry'] as const

/**
 * The drawing surface of the Prüflisten mode.
 *
 * - Compose (`rl.new`): one new shape. It is saved as soon as it is finished and stays on the
 *   map, editable, until the save succeeds.
 * - Edit (`rl.move` with a selected entry): the entry's geometry, one shape per part. Every
 *   finished edit is written to the query cache at once and saved in the background.
 */
export const useReviewDraw = () => {
  const regionSlug = useRegionSlug()
  const queryClient = useQueryClient()
  const { session, editingEntryId, activeListId } = useReviewDrawSession()
  const { reviewListsMode, setReviewListsModeParam } = useReviewListsModeParam()
  const composeType = useReviewComposeType()
  const composeFeatures = useReviewComposeFeatures()
  const { setComposeFeatures, resetCompose } = useReviewDrawActions()

  const entriesQueryKey = reviewEntriesQueryOptions(regionSlug, activeListId).queryKey
  const { data: entriesData } = useQuery({
    ...reviewEntriesQueryOptions(regionSlug, activeListId),
    enabled: session === 'edit',
  })
  const editingGeometry = entriesData?.featureCollection.features.find(
    (feature) => feature.id === editingEntryId,
  )?.geometry
  // Prisma JsonValue does not overlap GeoJSON.Geometry; double cast required.
  const editFeatures = featuresFromGeometry(editingGeometry as unknown as GeoJSON.Geometry | null)

  const createEntry = useMutation({
    mutationKey: CREATE_ENTRY_KEY,
    mutationFn: (geometry: EntryGeometry) => {
      if (activeListId === undefined) throw new Error('No review list selected')
      return createReviewEntryFn({ data: { regionSlug, listId: activeListId, geometry } })
    },
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: reviewListsQueryOptions(regionSlug).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: ['review-lists', 'getReviewEntriesForList'],
        }),
      ])
      resetCompose()
      setReviewListsModeParam({ ...reviewListsMode, new: undefined })
    },
    onError: (error) => toastError(error, 'Eintrag konnte nicht gespeichert werden'),
  })

  const writeGeometryToCache = (entryId: number, geometry: EntryGeometry) => {
    const previous = queryClient.getQueryData(entriesQueryKey)
    queryClient.setQueryData(entriesQueryKey, (current) => {
      if (!current) return current
      return {
        ...current,
        featureCollection: {
          ...current.featureCollection,
          features: current.featureCollection.features.map((feature) =>
            feature.id === entryId
              ? { ...feature, geometry: geometry as unknown as typeof feature.geometry }
              : feature,
          ),
        },
      }
    })
    return previous
  }

  const updateGeometry = useMutation({
    mutationKey: UPDATE_GEOMETRY_KEY,
    // One after the other, so a slow save cannot overwrite a newer one.
    scope: { id: 'review-entry-geometry' },
    mutationFn: (variables: {
      entryId: number
      geometry: EntryGeometry
      previous: ReturnType<typeof writeGeometryToCache>
    }) =>
      updateReviewEntryFn({
        data: { regionSlug, entryId: variables.entryId, geometry: variables.geometry },
      }),
    onError: (error, variables) => {
      toastError(error, 'Änderung konnte nicht gespeichert werden')
      queryClient.setQueryData(entriesQueryKey, variables.previous)
    },
    onSettled: () => {
      // A refetch while later saves are still running would bring back their old geometry.
      if (queryClient.isMutating({ mutationKey: UPDATE_GEOMETRY_KEY }) > 1) return
      void queryClient.invalidateQueries({ queryKey: ['review-lists', 'getReviewEntriesForList'] })
      void queryClient.invalidateQueries({ queryKey: ['review-lists', 'getReviewEntry'] })
    },
  })

  const handleChange = (next: DrawFeature[]) => {
    const geometry = geometryFromFeatures(next)
    if (session === 'compose') {
      setComposeFeatures(next)
      // After a failed save the next edit tries again; while one is running, it is enough.
      if (geometry && queryClient.isMutating({ mutationKey: CREATE_ENTRY_KEY }) === 0) {
        createEntry.mutate(geometry)
      }
      return
    }
    if (session !== 'edit' || !geometry) return
    const previous = writeGeometryToCache(editingEntryId, geometry)
    updateGeometry.mutate({ entryId: editingEntryId, geometry, previous })
  }

  const draw = useDraw(reviewDrawController, {
    value: session === 'compose' ? composeFeatures : editFeatures,
    onChange: handleChange,
    enabled: session !== 'idle',
    selectSingle: true,
    ...(session === 'compose'
      ? { limits: { total: 1 }, emptyTool: composeType }
      : {
          // Parts may be added and removed, but the entry keeps its type and one part.
          limits: { singleType: true, min: 1 },
          // Matches the ids `featuresFromGeometry` gives the parts after the save.
          createId: () => `part-${editFeatures.length}`,
        }),
  })

  const firstEditFeature = editFeatures[0]

  return {
    draw,
    session,
    /** Changes when another entry is edited, so gesture state does not carry over. */
    sessionKey: session === 'edit' ? `edit-${editingEntryId}` : session,
    editType: firstEditFeature ? shapeTypeOf(firstEditFeature.geometry) : null,
  }
}
