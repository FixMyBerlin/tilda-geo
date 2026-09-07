import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useControl } from 'react-map-gl/maplibre'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { useModeDetailSelection } from '@/components/regionen/pageRegionSlug/modes/useModeDetailSelection'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
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
 * after the header pencil is toggled. While a real draw session is active (member +
 * compose, or member + move with a selected review entry), `useReviewDrawActive` is
 * true and RegionMap swallows clicks / drops interactive layers. A leftover `rl.move`
 * after delete or for a non-member is not a draw session, so map clicks work again.
 */
export const ReviewMapDrawing = () => {
  const isReviewMode = useCurrentMode() === 'reviewLists'
  const canManage = useHasPermissions()
  const regionSlug = useRegionSlug()
  const queryClient = useQueryClient()
  const { selected } = useModeDetailSelection()
  const { reviewListsMode, setReviewListsModeParam } = useReviewListsModeParam()
  const { key, new: isComposing, move: isMoveArmed } = reviewListsMode

  const { data: lists } = useQuery({
    ...reviewListsQueryOptions(regionSlug),
    enabled: isReviewMode,
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
    enabled: isReviewMode && isEditing && activeListId !== undefined,
  })
  const editingGeometry = entriesData?.featureCollection.features.find(
    (feature) => feature.id === editingEntryId,
  )?.geometry
  const editSplit = editingGeometry
    ? splitGeometryIntoParts(editingGeometry as unknown as GeoJSON.Geometry)
    : null
  const loadedEditEntryIdRef = useRef<number | undefined>(undefined)
  const persistInFlightRef = useRef(false)
  const [editPartsState, setEditPartsState] = useState({
    session: drawSession,
    selectedCount: 0,
    partCount: 0,
  })
  if (editPartsState.session !== drawSession) {
    setEditPartsState({ session: drawSession, selectedCount: 0, partCount: 0 })
  }

  // useControl factory runs once; getters must read live values through this mutable cell.
  const drawCallbacksRef = useRef({
    onGeometryFinish: (_geometry: GeoJSON.Geometry) => {},
    isCreateSession: true,
    onSelectionChange: () => {},
  })

  const control = useControl(
    () =>
      new ReviewMapDrawingControl({
        getOnGeometryFinish: () => drawCallbacksRef.current.onGeometryFinish,
        getIsCreateSession: () => drawCallbacksRef.current.isCreateSession,
        getOnSelectionChange: () => drawCallbacksRef.current.onSelectionChange,
      }),
    { position: 'top-left' },
  )

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
    onSettled: () => {
      persistInFlightRef.current = false
    },
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
        split && split.parts.length > 0 ? control.loadEditFeature(split.parts, split.family) : false
      if (restored) {
        loadedEditEntryIdRef.current = editingEntryId
        return
      }
      setReviewListsModeParam({ ...reviewListsMode, move: undefined })
      void queryClient.invalidateQueries({
        queryKey: ['review-lists', 'getReviewEntriesForList'],
      })
    },
    onSettled: () => {
      persistInFlightRef.current = false
    },
  })

  useEffect(
    function syncDrawCallbacksRef() {
      drawCallbacksRef.current = {
        onGeometryFinish: (geometry) => {
          if (persistInFlightRef.current || createEntry.isPending || updateEntry.isPending) {
            return
          }
          const typed = geometry as Exclude<GeoJSON.Geometry, GeoJSON.GeometryCollection>
          persistInFlightRef.current = true
          if (isEditing) {
            updateEntry.mutate(typed)
            return
          }
          createEntry.mutate(typed)
        },
        isCreateSession: !isEditing,
        onSelectionChange: () => {
          setEditPartsState({
            session: drawSession,
            selectedCount: control.getSelectedIds().length,
            partCount: control.getPartCount(),
          })
        },
      }
    },
    [createEntry, updateEntry, editingEntryId, isEditing, drawSession, control],
  )

  useEffect(
    function syncReviewDrawEnabledWithSession() {
      const enabled =
        isReviewMode && canManage && activeListId !== undefined && drawSession !== 'idle'
      // Session start mode is kind-based, not toolbar state: compose → point, edit → select.
      // Must run before setEnabled so pendingMode is applied instead of a leftover select.
      // Do not depend on `mode` — the edit toolbar calls setMode directly when adding a part.
      if (enabled && sessionKind) {
        control.setMode(reviewDrawStartMode(sessionKind))
      }
      control.setEnabled(enabled)
    },
    [isReviewMode, canManage, activeListId, drawSession, sessionKind, control],
  )

  useEffect(
    function syncComposeDrawMode() {
      if (sessionKind !== 'compose') return
      if (!(isReviewMode && canManage && activeListId !== undefined)) return
      control.setMode(reviewDrawStartMode('compose', mode))
    },
    [isReviewMode, canManage, activeListId, drawSession, sessionKind, mode, control],
  )

  useEffect(
    function loadEntryGeometryForEdit() {
      if (drawSession === 'idle' || drawSession === 'new') {
        loadedEditEntryIdRef.current = undefined
        return
      }
      if (loadedEditEntryIdRef.current === editingEntryId) return
      if (!editingGeometry) return
      // Prisma JsonValue does not overlap GeoJSON.Geometry; double cast required.
      const split = splitGeometryIntoParts(editingGeometry as unknown as GeoJSON.Geometry)
      if (!split || split.parts.length === 0) return
      const loaded = control.loadEditFeature(split.parts, split.family)
      if (loaded) loadedEditEntryIdRef.current = editingEntryId
    },
    [drawSession, editingEntryId, editingGeometry, control],
  )

  if (!isReviewMode || !canManage || activeListId === undefined || drawSession === 'idle') {
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
