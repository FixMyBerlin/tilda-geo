import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { InfoTooltip } from '@/components/shared/InfoTooltip/InfoTooltip'
import { updatePlanningVariantFn } from '@/server/planning/planning.functions'
import { planningVariantQueryOptions } from '@/server/planning/planningQueryOptions'
import { MIN_AREA_FILTER_LABEL, MIN_SCORE_THRESHOLD_LABEL } from '../factors/spaceFinderDefaults'
import { spaceFinderNumberInputClass } from '../spaceFinderPanelStyles'
import { useSpaceFinderModeParam } from '../useSpaceFinderModeParam'

/**
 * Zielgrößen-Filter der Flächensuche. Der gespeicherte Wert gehört zur Variante
 * (`factorConfig.min_area_m2`, beim Anlegen des Planungsgebiets aus dessen Flächengröße
 * vorbelegt) und wird beim Verlassen des Felds gespeichert.
 * `ff.minArea` hält den in der Karte wirksamen Wert (0/fehlend = Filter aus, D7), damit sie
 * schon beim Tippen reagiert; der lokale Zustand hält die Zahl auch sichtbar, während der
 * Filter per Checkbox ausgeschaltet ist (das leert `ff.minArea`, nicht das Eingabefeld).
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
  const urlMinArea = spaceFinderMode.minArea ?? 0
  const filterOn = urlMinArea > 0
  const [minArea, setLocalMinArea] = useState(savedMinArea)
  // Checkbox an, aber noch keine Zahl > 0: `ff.minArea` bleibt leer (Filter wirkt noch nicht),
  // das Feld muss trotzdem freigegeben sein — sonst kommt man ohne gespeicherten Wert nie hinein
  // und das Feld sperrt sich, sobald man die Zahl zum Neueintippen löscht.
  const [awaitingValue, setAwaitingValue] = useState(false)
  const checked = filterOn || awaitingValue
  const lastSaved = useRef(savedMinArea)

  // Beim Öffnen einer Variante deren gespeicherten Wert einmalig in die Karte übernehmen
  // (die Komponente ist je Variante gekeyed); spätere Tipp-Eingaben bleiben unangetastet.
  const initialized = useRef(false)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    if (savedMinArea !== urlMinArea) {
      setSpaceFinderModeParam({ ...spaceFinderMode, minArea: savedMinArea || undefined })
    }
  }, [savedMinArea, urlMinArea, spaceFinderMode, setSpaceFinderModeParam])

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

  const setFilterOn = (on: boolean) => {
    setAwaitingValue(on && minArea <= 0)
    setSpaceFinderModeParam({
      ...spaceFinderMode,
      minArea: on && minArea > 0 ? minArea : undefined,
    })
  }

  const setMinArea = (value: number) => {
    setLocalMinArea(value)
    setAwaitingValue(value <= 0)
    setSpaceFinderModeParam({ ...spaceFinderMode, minArea: value > 0 ? value : undefined })
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
