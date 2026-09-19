import { SquaresPlusIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'
import { twJoin } from 'tailwind-merge'
import { useMapActions } from '../../hooks/mapState/useMapState'
import { usePlanningCandidatesState } from '../../hooks/mapState/usePlanningCandidatesState'
import { useFeaturesParam } from '../../hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import {
  usePlanningModeParam,
  usePlanningRunParam,
} from '../../hooks/useQueryState/usePlanningParams'

/**
 * Setzt Werkzeug und Auswahl zurück, sobald der Planungsmodus verlassen wird oder kein
 * Lauf mehr angezeigt wird – die Kandidaten gehören zu genau diesem Ergebnis.
 *
 * Bewusst getrennt vom Knopf: der lebt im Planungspanel und ist dort nur bei einem
 * fertigen Lauf gemountet; das Zurücksetzen muss aber gerade dann laufen, wenn dieser
 * Zustand endet. Diese Komponente rendert nichts und hängt im MapInterface.
 */
export const PlanningCandidateSelectionReset = () => {
  const [planningMode] = usePlanningModeParam()
  const [runId] = usePlanningRunParam()
  const setSelectActive = usePlanningCandidatesState((s) => s.setSelectActive)
  const clearCandidates = usePlanningCandidatesState((s) => s.clearCandidates)

  useEffect(
    function resetCandidateSelectionOutsidePlanningResult() {
      if (planningMode && runId != null) return
      setSelectActive(false)
      clearCandidates()
    },
    [planningMode, runId, setSelectActive, clearCandidates],
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
  const [planningMode] = usePlanningModeParam()
  const [runId] = usePlanningRunParam()
  const selectActive = usePlanningCandidatesState((s) => s.selectActive)
  const setSelectActive = usePlanningCandidatesState((s) => s.setSelectActive)
  const { clearInspectorFeatures } = useMapActions()
  const { setFeaturesParam } = useFeaturesParam()

  if (!planningMode || runId == null) return null

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
