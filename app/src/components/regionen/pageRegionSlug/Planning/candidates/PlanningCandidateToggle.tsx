import { SquaresPlusIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'
import { twJoin } from 'tailwind-merge'
import { useMapActions } from '../../hooks/mapState/useMapState'
import { usePlanningCandidatesState } from '../../hooks/mapState/usePlanningCandidatesState'
import { useFeaturesParam } from '../../hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import { useSpaceFinderSelection } from '../../modes/spaceFinder/useSpaceFinderSelection'

/**
 * Setzt Werkzeug und Auswahl zurück, sobald kein Lauf mehr angezeigt wird – die Kandidaten
 * gehören zu genau diesem Ergebnis. Auch beim Verlassen des Modus (Unmount, siehe Cleanup unten):
 * die Kandidaten sind nicht persistiert (D6).
 *
 * Bewusst getrennt vom Knopf: der lebt im Flächenfinder-Panel und ist dort nur bei einem
 * fertigen Lauf gemountet; das Zurücksetzen muss aber gerade dann laufen, wenn dieser
 * Zustand endet. Diese Komponente rendert nichts und hängt in `PageModeSpaceFinder`.
 */
export const PlanningCandidateSelectionReset = () => {
  const { runId } = useSpaceFinderSelection()
  const setSelectActive = usePlanningCandidatesState((s) => s.setSelectActive)
  const clearCandidates = usePlanningCandidatesState((s) => s.clearCandidates)

  useEffect(
    function resetCandidateSelectionOutsidePlanningResult() {
      if (runId != null) return
      setSelectActive(false)
      clearCandidates()
    },
    [runId, setSelectActive, clearCandidates],
  )

  // Leaving the mode unmounts this component — clear the selection then too.
  useEffect(
    () => () => {
      setSelectActive(false)
      clearCandidates()
    },
    [setSelectActive, clearCandidates],
  )

  return null
}

/**
 * Werkzeug „Kandidaten auswählen": schaltet die Karte in einen Auswahlmodus, in dem
 * ein Klick auf ein Ergebnis-Hexagon dieses der Kandidatenliste hinzufügt bzw. wieder
 * entfernt (RegionMap `handleClick`), statt den Feature-Inspector zu öffnen. Die
 * Auswahl selbst zeigt `PlanningCandidatePanel` in der Sidebar.
 *
 * Sitzt im Planungspanel unter dem Flächenfilter. Optik bewusst sekundär (grün,
 * umrandet), damit er sich vom blauen „Neu berechnen“ abhebt.
 */
export const PlanningCandidateToggle = () => {
  const { runId } = useSpaceFinderSelection()
  const selectActive = usePlanningCandidatesState((s) => s.selectActive)
  const setSelectActive = usePlanningCandidatesState((s) => s.setSelectActive)
  const { clearInspectorFeatures } = useMapActions()
  const { setFeaturesParam } = useFeaturesParam()

  if (runId == null) return null

  const handleClick = () => {
    const next = !selectActive
    setSelectActive(next)
    if (!next) return
    // Beim Aktivieren einen offenen Inspector schließen – dessen Sidebar-Platz
    // übernimmt die Kandidatenliste.
    clearInspectorFeatures()
    setFeaturesParam(null)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={selectActive}
      className={twJoin(
        'flex w-full items-center justify-center gap-1.5 rounded border px-3 py-1.5 text-sm font-medium',
        selectActive
          ? 'border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800'
          : 'border-emerald-700 bg-white text-emerald-800 hover:bg-emerald-50',
      )}
    >
      <SquaresPlusIcon className="size-4" aria-hidden="true" />
      {selectActive ? 'Auswahl beenden' : 'Kandidaten auswählen'}
    </button>
  )
}
