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
import { ToggleSwitch } from './LayerToggles'

/**
 * Target size filter of the area search. The square meters belong to the variant
 * (`factorConfig.min_area_m2`, prefilled from the Planungsgebiet's size on creation) and are
 * saved on blur.
 * `space.minArea: true` only switches the filter on (missing = off). The store draft applies
 * while typing, so the map reacts before saving and a cleared number does not fall back to the
 * saved value. Local state keeps the number visible while the filter is switched off.
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
  // Switch on but no number > 0 yet: the filter does not apply yet, but the field must still be
  // enabled — otherwise without a saved value you could never enter it, and the field would lock
  // as soon as you clear the number to retype it.
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
    <div className="space-y-2 rounded border border-gray-200 px-2.5 py-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 font-medium text-gray-800">
          {MIN_AREA_FILTER_LABEL}
          <InfoTooltip>
            Hebt zusammenhängende Flächen hervor, die mindestens so groß sind wie angegeben. Als
            zusammenhängend zählen benachbarte Hexagone ab dem „{MIN_SCORE_THRESHOLD_LABEL}“
            {clusterMinScore != null ? ` (${clusterMinScore})` : ''} aus den Faktoren. Alle anderen
            Hexagone werden abgedunkelt. Nur eine Anzeige in der Karte — die Berechnung ändert sich
            dadurch nicht.
          </InfoTooltip>
        </span>
        <ToggleSwitch checked={checked} onChange={setFilterOn} onColorClass="bg-gray-800" />
      </div>
      {checked && (
        <>
          <label className="flex items-center justify-between gap-2 text-xs text-gray-600">
            Mindestgröße in m²
            <input
              type="number"
              min={0}
              step={5}
              placeholder="m²"
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
          </label>
          {clusterMinScore != null && (
            <p className="text-xs text-gray-500">
              Gesucht wird ab einem Score von{' '}
              <span className="font-semibold text-gray-800">{clusterMinScore}</span>. Ändern lässt
              sich das in den Faktoren der Variante unter Allgemein ›{' '}
              {`„${MIN_SCORE_THRESHOLD_LABEL}“`} — wirksam nach der nächsten Berechnung.
            </p>
          )}
        </>
      )}
    </div>
  )
}

export const MinAreaFilter = (props: {
  variantId: number
  savedMinArea: number
  clusterMinScore: number | undefined
}) => <MinAreaFilterForm key={props.variantId} {...props} />
