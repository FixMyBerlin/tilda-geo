import { EyeSlashIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'
import {
  type PlanningScoreMode,
  usePlanningHexagonsOpacityParam,
  usePlanningHexagonsVisibleParam,
  usePlanningScoreParam,
} from '../hooks/useQueryState/usePlanningParams'
import { planningRadioButtonClass } from './planningPanelStyles'

// Tab-like switcher for the three display modes (Issue #3415): the demand
// probability, the buildability probability, or their combination. Colors the
// hexagon layer by the corresponding tile property (see PLANNING_SCORE_PROPERTY).
// A fourth icon-only state switches the hexagon layer off entirely; the color
// mode is preserved so re-selecting a mode restores the previous display.
const MODES: [PlanningScoreMode, string][] = [
  ['bedarf', 'Bedarf'],
  ['bebauung', 'Bebauung'],
  ['kombination', 'Kombination'],
]

// Regler-Wert, auf den beim Wiedereinblenden zurückgesprungen wird (z.B. Klick auf
// einen Modus-Button, während der Regler noch bei 0% steht). 100% entspricht der
// ursprünglichen, vollen Layer-Deckkraft vor Einführung des Reglers.
const DEFAULT_OPACITY = 100

// `compact`: nur die Modus-Buttons (für die eingeklappte Panel-Breadcrumb-Zeile) —
// ohne "Anzeige"-Überschrift und ohne Transparenz-Regler.
export const ScoreModeSwitcher = ({ compact = false }: { compact?: boolean }) => {
  const [mode, setMode] = usePlanningScoreParam()
  const [visible, setVisible] = usePlanningHexagonsVisibleParam()
  const [opacity, setOpacity] = usePlanningHexagonsOpacityParam()

  // Regler und "ausgeblendet"-Button bleiben synchron: 0% Deckkraft bedeutet
  // dasselbe wie visible=false, damit beide Bedienwege zum selben Zustand führen.
  const show = () => {
    setVisible(true)
    if (opacity === 0) setOpacity(DEFAULT_OPACITY)
  }
  const hide = () => {
    setVisible(false)
    setOpacity(0)
  }
  const handleOpacityChange = (next: number) => {
    setOpacity(next)
    if (next === 0) setVisible(false)
    else if (!visible) setVisible(true)
  }

  return (
    <div className={twJoin('flex flex-col gap-1', !compact && 'mt-1')}>
      {!compact && <span className="py-0.5 text-xs font-medium text-gray-500">Anzeige</span>}
      <div className="flex gap-1.5">
        {MODES.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value)
              show()
            }}
            className={twJoin(
              'flex-1',
              planningRadioButtonClass(visible && mode === value, 'green'),
            )}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={hide}
          title="Hexagone ausblenden"
          aria-label="Hexagone ausblenden"
          aria-pressed={!visible}
          className={planningRadioButtonClass(!visible, 'green')}
        >
          <EyeSlashIcon className="h-4 w-4" />
        </button>
      </div>
      {!compact && (
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 py-0.5 text-xs text-gray-500">Transparenz</span>
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={visible ? opacity : 0}
            aria-label="Transparenz der Hexagone in Prozent — bei 0 % werden sie ausgeblendet"
            onChange={(e) => handleOpacityChange(Number(e.target.value))}
            className="w-full accent-green-700"
          />
          <span className="w-9 shrink-0 text-right text-xs text-gray-500 tabular-nums">
            {visible ? opacity : 0}%
          </span>
        </div>
      )}
    </div>
  )
}
