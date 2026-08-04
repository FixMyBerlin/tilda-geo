import { SquaresPlusIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'
import { twMerge } from 'tailwind-merge'
import { useMapActions } from '../../hooks/mapState/useMapState'
import { usePlanningBoundaryState } from '../../hooks/mapState/usePlanningBoundaryState'
import { usePlanningCandidatesState } from '../../hooks/mapState/usePlanningCandidatesState'
import { useFeaturesParam } from '../../hooks/useQueryState/useFeaturesParam/useFeaturesParam'
import {
  usePlanningModeParam,
  usePlanningRunParam,
} from '../../hooks/useQueryState/usePlanningParams'
import {
  mobileControlButtonActiveClassName,
  mobileControlButtonClassName,
} from '../../mobile/mobileControlButton.const'

type Props = {
  /** Extra classes for positioning (the desktop overlay, left of the search button). */
  className?: string
}

/**
 * Werkzeug „Kandidaten auswählen": schaltet die Karte in einen Auswahlmodus, in dem
 * ein Klick auf ein Ergebnis-Hexagon dieses der Kandidatenliste hinzufügt bzw. wieder
 * entfernt (RegionMap `handleClick`), statt den Feature-Inspector zu öffnen. Die
 * Auswahl selbst zeigt `PlanningCandidatePanel` in der Sidebar.
 *
 * Sichtbar nur im Planungsmodus mit angezeigtem Lauf – ohne Ergebnis-Hexagone gäbe
 * es nichts auszuwählen. Optik bewusst identisch zum Suchknopf daneben.
 */
export const PlanningCandidateToggle = ({ className }: Props) => {
  const [planningMode] = usePlanningModeParam()
  const [runId] = usePlanningRunParam()
  const selectActive = usePlanningCandidatesState((s) => s.selectActive)
  const setSelectActive = usePlanningCandidatesState((s) => s.setSelectActive)
  const clearCandidates = usePlanningCandidatesState((s) => s.clearCandidates)
  const setPanelCollapsed = usePlanningBoundaryState((s) => s.setPanelCollapsed)
  const { clearInspectorFeatures } = useMapActions()
  const { setFeaturesParam } = useFeaturesParam()

  // Beim Verlassen des Planungsmodus (oder wenn kein Lauf mehr angezeigt wird) Werkzeug
  // und Auswahl zurücksetzen – die Kandidaten gehören zu genau diesem Ergebnis.
  useEffect(
    function resetCandidateSelectionOutsidePlanningResult() {
      if (planningMode && runId != null) return
      setSelectActive(false)
      clearCandidates()
    },
    [planningMode, runId, setSelectActive, clearCandidates],
  )

  if (!planningMode || runId == null) return null

  const handleClick = () => {
    const next = !selectActive
    setSelectActive(next)
    if (!next) return
    // Beim Aktivieren Platz schaffen: Planungspanel einklappen und einen offenen
    // Inspector schließen (dessen Sidebar-Platz übernimmt die Kandidatenliste).
    setPanelCollapsed(true)
    clearInspectorFeatures()
    setFeaturesParam(null)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Kandidaten auswählen"
      aria-pressed={selectActive}
      title="Kandidaten auswählen"
      className={twMerge(
        mobileControlButtonClassName,
        'size-10',
        selectActive && mobileControlButtonActiveClassName,
        className,
      )}
    >
      <SquaresPlusIcon className="size-6" aria-hidden="true" />
    </button>
  )
}
