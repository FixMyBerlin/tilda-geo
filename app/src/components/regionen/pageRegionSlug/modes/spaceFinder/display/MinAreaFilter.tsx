import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import {
  useSpaceFinderBoundaryActions,
  useSpaceFinderMinAreaDraft,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/space-finder-boundary-store'
import { InfoTooltip } from '@/components/shared/InfoTooltip/InfoTooltip'
import { updatePlanningVariantFn } from '@/server/planning/planning.functions'
import { planningVariantQueryOptions } from '@/server/planning/planningQueryOptions'
import { MIN_AREA_FILTER_LABEL, MIN_SCORE_THRESHOLD_LABEL } from '../factors/spaceFinderDefaults'
import { spaceFinderNumberInputClass } from '../spaceFinderPanelStyles'
import { useSpaceFinderModeParam } from '../useSpaceFinderModeParam'

/**
 * Zielgrößen-Filter der Flächensuche. Die Quadratmeter gehören zur Variante
 * (`factorConfig.min_area_m2`, beim Anlegen des Planungsgebiets aus dessen Flächengröße
 * vorbelegt) und werden beim Verlassen des Felds gespeichert.
 * `space.minArea: true` schaltet den Filter nur an (fehlend = aus). Der Entwurf im Store
 * gilt, solange getippt wird, damit die Karte vor dem Speichern reagiert und eine geleerte
 * Zahl nicht auf den gespeicherten Wert zurückfällt. Der lokale Zustand hält die Zahl auch
 * sichtbar, während der Filter per Checkbox ausgeschaltet ist.
 */
const MinAreaFilterForm = ({
  variantId,
  savedMinArea,
  clusterMinScore,
}: {
  variantId: number
  savedMinArea: number
  /** Score from which hexagons form a cluster in the shown run (`min_score_threshold`). */
  clusterMinScore: number | undefined
}) => {
  const queryClient = useQueryClient()
  const { spaceFinderMode, setSpaceFinderModeParam } = useSpaceFinderModeParam()
  const draft = useSpaceFinderMinAreaDraft()
  const { setMinAreaDraft } = useSpaceFinderBoundaryActions()
  const filterOn = spaceFinderMode.minArea === true
  const [minArea, setLocalMinArea] = useState(savedMinArea)
  // Checkbox an, aber noch keine Zahl > 0: der Filter gilt noch nicht, das Feld muss trotzdem
  // freigegeben sein — sonst kommt man ohne gespeicherten Wert nie hinein und das Feld sperrt
  // sich, sobald man die Zahl zum Neueintippen löscht.
  const [awaitingValue, setAwaitingValue] = useState(() => filterOn && savedMinArea <= 0)
  const checked = filterOn || awaitingValue
  const lastSaved = useRef(savedMinArea)

  useEffect(
    function clearMinAreaDraftOnceSaved() {
      if (draft != null && draft === savedMinArea) setMinAreaDraft(null)
    },
    [draft, savedMinArea, setMinAreaDraft],
  )

  useEffect(
    function clearMinAreaDraftWhenFormUnmounts() {
      return function clearMinAreaDraft() {
        setMinAreaDraft(null)
      }
    },
    [setMinAreaDraft],
  )

  const mutation = useMutation({
    mutationFn: (value: number) =>
      updatePlanningVariantFn({ data: { variantId, minAreaM2: value } }),
    onSuccess: (_, value) => {
      lastSaved.current = value
      queryClient.invalidateQueries(planningVariantQueryOptions(variantId))
    },
  })

  const save = () => {
    if (minArea !== lastSaved.current) mutation.mutate(minArea)
  }

  const publishDraft = (value: number) => {
    setMinAreaDraft(value === savedMinArea ? null : value)
  }

  const setFilterOn = (on: boolean) => {
    setAwaitingValue(on && minArea <= 0)
    // Draft stays while the URL flag is still on, so the map does not fall back to the saved
    // number for one navigation. `appliedMinAreaM2` ignores the draft once the flag is off.
    if (on) publishDraft(minArea)
    setSpaceFinderModeParam({
      ...spaceFinderMode,
      minArea: on ? true : undefined,
    })
  }

  const setMinArea = (value: number) => {
    setLocalMinArea(value)
    setAwaitingValue(value <= 0)
    publishDraft(value)
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded border border-gray-200 px-2.5 py-2 text-sm">
      <span className="flex items-center gap-1">
        <label className="flex items-center gap-2 font-medium text-gray-800">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setFilterOn(e.target.checked)}
            className="rounded border-gray-300"
          />
          {MIN_AREA_FILTER_LABEL}
        </label>
        {/* Outside the label so opening the tooltip does not toggle the checkbox. */}
        <InfoTooltip>
          Hebt zusammenhängende Flächen hervor, die mindestens so groß sind wie angegeben. Als
          zusammenhängend zählen benachbarte Hexagone ab dem „{MIN_SCORE_THRESHOLD_LABEL}“
          {clusterMinScore != null ? ` (${clusterMinScore})` : ''} aus den Faktoren. Alle anderen
          Hexagone werden abgedunkelt. Nur eine Anzeige in der Karte — die Berechnung ändert sich
          dadurch nicht.
        </InfoTooltip>
      </span>
      <input
        type="number"
        min={0}
        step={5}
        placeholder={checked ? 'm²' : 'aus'}
        disabled={!checked}
        value={minArea > 0 ? minArea : ''}
        onChange={(e) =>
          setMinArea(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))
        }
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
        className={spaceFinderNumberInputClass}
      />
    </div>
  )
}

export const MinAreaFilter = (props: {
  variantId: number
  savedMinArea: number
  clusterMinScore: number | undefined
}) => <MinAreaFilterForm key={props.variantId} {...props} />
