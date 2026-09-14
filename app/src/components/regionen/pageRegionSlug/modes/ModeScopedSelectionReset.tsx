import { useEffect } from 'react'
import {
  useMapActions,
  useMapInspectorFeatures,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useOsmNotesActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/userMapNotes'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import {
  filterInspectorFeaturesForMode,
  filterUrlFeaturesForMode,
} from '@/components/regionen/pageRegionSlug/modes/modeScopedSelection'
import { useNotesModeParam } from '@/components/regionen/pageRegionSlug/modes/notes/useNotesModeParam'
import { useReviewListsModeParam } from '@/components/regionen/pageRegionSlug/modes/reviewLists/useReviewListsModeParam'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'

/**
 * Clears inspector / URL `f` selections that belong only to another mode, and exits Hinweise
 * compose (`notes.new`) when leaving notes mode, and Prüflisten compose/move
 * (`review.new` / `review.move`) when leaving review lists, so the map returns to normal interaction.
 * Mounted once in `MapInterface`. Uses `replace: true` so it does not add history.
 * Covers ModeSwitcher, deep links, and back/forward.
 */
export const ModeScopedSelectionReset = () => {
  const { mode } = useCurrentMode()
  const inspectorFeatures = useMapInspectorFeatures()
  const { featuresParam, setFeaturesParam } = useFeaturesParam()
  const { replaceInspectorFeatures } = useMapActions()
  const { notesMode, setNotesModeParam } = useNotesModeParam()
  const { setOsmNewNoteFeature } = useOsmNotesActions()
  const { reviewListsMode, setReviewListsModeParam } = useReviewListsModeParam()

  useEffect(
    function resetModeScopedSelectionOnModeChange() {
      const nextInspector = filterInspectorFeaturesForMode(inspectorFeatures, mode)
      const nextUrl = filterUrlFeaturesForMode(featuresParam, mode)

      if (nextInspector.length !== inspectorFeatures.length) {
        replaceInspectorFeatures(nextInspector)
      }
      if (nextUrl.length !== featuresParam.length) {
        setFeaturesParam(nextUrl.length > 0 ? nextUrl : null, { replace: true })
      }
    },
    [mode, inspectorFeatures, featuresParam, replaceInspectorFeatures, setFeaturesParam],
  )

  useEffect(
    function exitNotesComposeWhenLeavingNotesMode() {
      if (mode === 'notes') return
      if (!notesMode.new) return
      setNotesModeParam({ ...notesMode, new: undefined })
      setOsmNewNoteFeature(undefined)
    },
    [mode, notesMode, setNotesModeParam, setOsmNewNoteFeature],
  )

  useEffect(
    function exitReviewComposeWhenLeavingReviewListsMode() {
      if (mode === 'reviewLists') return
      if (!reviewListsMode.new && !reviewListsMode.move) return
      setReviewListsModeParam({ ...reviewListsMode, new: undefined, move: undefined })
    },
    [mode, reviewListsMode, setReviewListsModeParam],
  )

  return null
}
