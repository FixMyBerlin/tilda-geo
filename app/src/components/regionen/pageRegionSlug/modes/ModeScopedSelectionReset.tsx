import { useEffect } from 'react'
import {
  useMapActions,
  useMapInspectorFeatures,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useOsmNotesActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/userMapNotes'
import { useFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { useNewInternalNoteMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesAtlasParams'
import { useNewOsmNoteMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesOsmParams'
import {
  filterInspectorFeaturesForMode,
  filterUrlFeaturesForMode,
} from '@/components/regionen/pageRegionSlug/modes/modeScopedSelection'
import { useReviewListsModeParam } from '@/components/regionen/pageRegionSlug/modes/reviewLists/useReviewListsModeParam'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'

/**
 * Clears inspector / URL `f` selections that belong only to another mode, and exits Hinweise
 * compose (`osmNote` / `internalNote`) when leaving notes mode, and Prüflisten compose/move
 * (`rl.new` / `rl.move`) when leaving review lists, so the map returns to normal interaction.
 * Mounted once in `MapInterface`. Uses `replace: true` so it does not add history.
 * Covers ModeSwitcher, deep links, and back/forward.
 */
export const ModeScopedSelectionReset = () => {
  const mode = useCurrentMode()
  const inspectorFeatures = useMapInspectorFeatures()
  const { featuresParam, setFeaturesParam } = useFeaturesParam()
  const { replaceInspectorFeatures } = useMapActions()
  const { newOsmNoteMapParam, setNewOsmNoteMapParam } = useNewOsmNoteMapParam()
  const { newInternalNoteMapParam, setNewInternalNoteMapParam } = useNewInternalNoteMapParam()
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
      if (!newOsmNoteMapParam && !newInternalNoteMapParam) return
      if (newOsmNoteMapParam) setNewOsmNoteMapParam(null)
      if (newInternalNoteMapParam) setNewInternalNoteMapParam(null)
      setOsmNewNoteFeature(undefined)
    },
    [
      mode,
      newOsmNoteMapParam,
      newInternalNoteMapParam,
      setNewOsmNoteMapParam,
      setNewInternalNoteMapParam,
      setOsmNewNoteFeature,
    ],
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
