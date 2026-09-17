import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useEffectEvent, useState } from 'react'
import { useControl } from 'react-map-gl/maplibre'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { useModeDetailSelection } from '@/components/regionen/pageRegionSlug/modes/useModeDetailSelection'
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
import { reviewEditingEntryId } from '../useReviewDrawActive'
import { useReviewListsModeParam } from '../useReviewListsModeParam'
import { ReviewDrawingToolbar } from './ReviewDrawingToolbar'
import { reviewDrawSessionKind, reviewDrawStartMode } from './reviewDrawSessionMode'
import { ReviewEditToolbar } from './ReviewEditToolbar'
import { splitGeometryIntoParts } from './reviewGeometryParts'
import { ReviewMapDrawingControl } from './ReviewMapDrawingControl'
import { type ReviewDrawMode } from './reviewTerraDrawConfig'

/**
 * Map drawing for Prüflisten: compose toolbar (`rl.new`) or geometry-edit (`rl.move`)
 * after the header pencil is toggled. While a real draw session is active (compose,
 * or move with a selected review entry), `useReviewDrawActive` is true and RegionMap
 * swallows clicks / drops interactive layers. A leftover `rl.move` after delete is
 * not a draw session, so map clicks work again.
 */
export const ReviewMapDrawing = () => {
  const currentMode = useCurrentMode()
  const regionSlug = useRegionSlug()
  const queryClient = useQueryClient()
  const { selected } = useModeDetailSelection()
  const { reviewListsMode, setReviewListsModeParam } = useReviewListsModeParam()
  const { key, new: isComposing, move: isMoveArmed } = reviewListsMode

  const { data: lists } = useQuery({
    ...reviewListsQueryOptions(regionSlug),
    enabled: currentMode.isReviewLists,
  })
  const activeListId = key ?? lists?.lists[0]?.id

  const editingEntryId = reviewEditingEntryId(selected, isComposing === true, isMoveArmed === true)
  const isEditing = !Number.isNaN(editingEntryId)
  const drawSession = isComposing ? 'new' : isEditing ? `edit-${editingEntryId}` : 'idle'
  const sessionKind = reviewDrawSessionKind(drawSession)
  const sessionDefaultMode = reviewDrawStartMode(sessionKind === 'edit' ? 'edit' : 'compose')
  const [modeState, setModeState] = useState<{
    session: string
    mode: ReviewDrawMode
  }>({
    session: drawSession,
    mode: sessionDefaultMode,
  })
  if (modeState.session !== drawSession) {
    setModeState({ session: drawSession, mode: sessionDefaultMode })
  }
  // Prefer the reset value on the session-transition render; modeState.mode is still the previous session.
  const mode = modeState.session === drawSession ? modeState.mode : sessionDefaultMode
  const setMode = (next: ReviewDrawMode) => setModeState({ session: drawSession, mode: next })

  const { data: entriesData } = useQuery({
    ...reviewEntriesQueryOptions(regionSlug, activeListId),
    enabled: currentMode.isReviewLists && isEditing && activeListId !== undefined,
  })
  const editingGeometry = entriesData?.featureCollection.features.find(
    (feature) => feature.id === editingEntryId,
  )?.geometry
  const editSplit = editingGeometry
    ? splitGeometryIntoParts(editingGeometry as unknown as GeoJSON.Geometry)
    : null
  const [editPartsState, setEditPartsState] = useState({
    session: drawSession,
    selectedCount: 0,
    partCount: 0,
  })
  if (editPartsState.session !== drawSession) {
    setEditPartsState({ session: drawSession, selectedCount: 0, partCount: 0 })
  }

  const createEntry = useMutation({
    mutationFn: (geometry: Exclude<GeoJSON.Geometry, GeoJSON.GeometryCollection>) => {
      if (activeListId === undefined) throw new Error('No review list selected')
      return createReviewEntryFn({
        data: { regionSlug, listId: activeListId, geometry },
      })
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
      setReviewListsModeParam({ ...reviewListsMode, new: undefined })
    },
    onError: (error) => toastError(error, 'Eintrag konnte nicht gespeichert werden'),
  })

  const updateEntry = useMutation({
    mutationFn: (geometry: Exclude<GeoJSON.Geometry, GeoJSON.GeometryCollection>) => {
      if (!isEditing) throw new Error('No review entry selected')
      return updateReviewEntryFn({
        data: { regionSlug, entryId: editingEntryId, geometry },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['review-lists', 'getReviewEntriesForList'],
      })
      queryClient.invalidateQueries({
        queryKey: ['review-lists', 'getReviewEntry'],
      })
    },
    onError: (error) => {
      toastError(error, 'Änderung konnte nicht gespeichert werden')
      const cached = queryClient.getQueryData(
        reviewEntriesQueryOptions(regionSlug, activeListId).queryKey,
      )
      const geometry = cached?.featureCollection.features.find(
        (feature) => feature.id === editingEntryId,
      )?.geometry
      const split = geometry
        ? splitGeometryIntoParts(geometry as unknown as GeoJSON.Geometry)
        : null
      const restored =
        split && split.parts.length > 0
          ? control.loadEditFeature(editingEntryId, split.parts, split.family, { force: true })
          : false
      if (restored) {
        return
      }
      setReviewListsModeParam({ ...reviewListsMode, move: undefined })
      void queryClient.invalidateQueries({
        queryKey: ['review-lists', 'getReviewEntriesForList'],
      })
    },
  })

  const onGeometryFinish = useEffectEvent((geometry: GeoJSON.Geometry) => {
    if (createEntry.isPending || updateEntry.isPending) return
    const typed = geometry as Exclude<GeoJSON.Geometry, GeoJSON.GeometryCollection>
    if (isEditing) {
      return updateEntry.mutateAsync(typed)
    }
    return createEntry.mutateAsync(typed)
  })
  const onSelectionChange = useEffectEvent((selectedCount: number, partCount: number) => {
    setEditPartsState({
      session: drawSession,
      selectedCount,
      partCount,
    })
  })
  const isCreateSession = useEffectEvent(() => !isEditing)

  const control = useControl(
    () =>
      new ReviewMapDrawingControl({
        onGeometryFinish,
        isCreateSession,
        onSelectionChange,
      }),
    { position: 'top-left' },
  )

  useEffect(
    function syncReviewDrawEnabledWithSession() {
      const enabled =
        currentMode.isReviewLists && activeListId !== undefined && drawSession !== 'idle'
      // Session start mode is kind-based, not toolbar state: compose → point, edit → select.
      // Must run before setEnabled so pendingMode is applied instead of a leftover select.
      // Do not depend on `mode` — the edit toolbar calls setMode directly when adding a part.
      if (enabled && sessionKind) {
        control.setMode(reviewDrawStartMode(sessionKind))
      }
      control.setEnabled(enabled)
      return function disableReviewDrawOnCleanup() {
        control.setEnabled(false)
      }
    },
    [currentMode.isReviewLists, activeListId, drawSession, sessionKind, control],
  )

  useEffect(
    function loadEntryGeometryForEdit() {
      if (sessionKind !== 'edit') return
      if (!editingGeometry) return
      // Prisma JsonValue does not overlap GeoJSON.Geometry; double cast required.
      const split = splitGeometryIntoParts(editingGeometry as unknown as GeoJSON.Geometry)
      if (!split || split.parts.length === 0) return
      control.loadEditFeature(editingEntryId, split.parts, split.family)
    },
    [sessionKind, editingEntryId, editingGeometry, control],
  )

  if (!currentMode.isReviewLists || activeListId === undefined || drawSession === 'idle') {
    return null
  }

  if (drawSession === 'new') {
    return (
      <ReviewDrawingToolbar
        mode={mode}
        onModeChange={(next) => {
          setMode(next)
          control.setMode(next)
        }}
      />
    )
  }

  return (
    <ReviewEditToolbar
      mode={mode}
      family={editSplit?.family ?? null}
      canDeletePart={
        editPartsState.selectedCount > 0 &&
        editPartsState.partCount - editPartsState.selectedCount >= 1
      }
      onModeChange={(next) => {
        setMode(next)
        control.setMode(next)
      }}
      onDeletePart={() => control.deleteSelectedPart()}
    />
  )
}
