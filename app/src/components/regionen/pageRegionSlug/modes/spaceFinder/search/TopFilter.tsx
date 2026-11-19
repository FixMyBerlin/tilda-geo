import { useEffect } from 'react'
import {
  useSpaceFinderFactorDraftActions,
  useSpaceFinderTopDraft,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/space-finder-factor-draft-store'
import { InfoTooltip } from '@/components/shared/InfoTooltip/InfoTooltip'
import { SegmentedChoice } from '@/components/shared/SegmentedChoice/SegmentedChoice'
import {
  SPACE_FINDER_TOP_DEFAULT,
  SPACE_FINDER_TOP_MAX,
  type SpaceFinderTopBy,
} from '@/shared/regionen/spaceFinderTop.const'
import { ToggleSwitch } from '../display/LayerToggles'
import {
  MIN_AREA_FILTER_LABEL,
  MIN_SCORE_THRESHOLD_LABEL,
  TOP_FILTER_LABEL,
} from '../factors/spaceFinderDefaults'
import { clampTopCount } from '../spaceFinderModeParam'
import { spaceFinderNumberInputClass } from '../spaceFinderPanelStyles'
import { useSpaceFinderModeParam } from '../useSpaceFinderModeParam'
import { useSpaceFinderTopHexagons } from './useSpaceFinderTopHexagons'

const TOP_BY_OPTIONS = [
  ['area', 'je Fläche'],
  ['hexagon', 'einzeln'],
] as const satisfies readonly (readonly [SpaceFinderTopBy, string])[]

// Like »Mindestgröße«: the map follows the draft while typing, the URL is written on blur.
export const TopFilter = () => {
  const { spaceFinderMode, setSpaceFinderModeParam } = useSpaceFinderModeParam()
  const { topHexagons, topRequest, isFetching } = useSpaceFinderTopHexagons()
  const draft = useSpaceFinderTopDraft()
  const { setTopDraft } = useSpaceFinderFactorDraftActions()
  const filterOn = spaceFinderMode.top != null
  const count = draft ?? spaceFinderMode.top ?? SPACE_FINDER_TOP_DEFAULT
  const topBy = spaceFinderMode.topBy ?? 'area'

  useEffect(
    function clearTopDraftWhenFormUnmounts() {
      return function clearTopDraft() {
        setTopDraft(null)
      }
    },
    [setTopDraft],
  )

  const setFilterOn = (on: boolean) => {
    setTopDraft(null)
    setSpaceFinderModeParam({
      ...spaceFinderMode,
      top: on ? clampTopCount(count > 0 ? count : SPACE_FINDER_TOP_DEFAULT) : undefined,
      topBy: on ? spaceFinderMode.topBy : undefined,
    })
  }

  const save = () => {
    if (draft == null) return
    setTopDraft(null)
    const value = draft > 0 ? clampTopCount(draft) : spaceFinderMode.top
    if (value !== spaceFinderMode.top) setSpaceFinderModeParam({ ...spaceFinderMode, top: value })
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 font-medium text-gray-800">
          {TOP_FILTER_LABEL}
          <InfoTooltip>
            Hebt die Hexagone mit dem höchsten Gesamtscore hervor, alle anderen werden abgedunkelt.
            „je Fläche“ nimmt aus jeder zusammenhängenden Fläche (ab dem „
            {MIN_SCORE_THRESHOLD_LABEL}
            “) nur das beste Hexagon, „einzeln“ die besten Hexagone, egal wo sie liegen. Bei
            gleichem Score kommt die größere Fläche zuerst. Ist „{MIN_AREA_FILTER_LABEL}“ an, zählen
            nur Flächen ab dieser Größe. Nur eine Anzeige in der Karte — die Berechnung ändert sich
            dadurch nicht.
          </InfoTooltip>
        </span>
        <ToggleSwitch checked={filterOn} onChange={setFilterOn} onColorClass="bg-gray-800" />
      </div>
      {filterOn && (
        <>
          <label className="flex items-center justify-between gap-2 text-xs text-gray-600">
            Anzahl
            <input
              type="number"
              min={1}
              max={SPACE_FINDER_TOP_MAX}
              step={1}
              value={count > 0 ? count : ''}
              onChange={(e) =>
                setTopDraft(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))
              }
              onBlur={save}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
              }}
              className={spaceFinderNumberInputClass}
            />
          </label>
          <SegmentedChoice
            options={TOP_BY_OPTIONS}
            value={topBy}
            onChange={(value) => setSpaceFinderModeParam({ ...spaceFinderMode, topBy: value })}
          />
          <p className="text-xs text-gray-500" aria-live="polite">
            {isFetching && <span className="sr-only">Berechnung läuft…</span>}
            {topHexagons && topRequest && topHexagons.length < topRequest.count && (
              <>
                Nur {topHexagons.length} {topRequest.by === 'area' ? 'Flächen' : 'Hexagone'}{' '}
                gefunden.
              </>
            )}
          </p>
        </>
      )}
    </div>
  )
}
