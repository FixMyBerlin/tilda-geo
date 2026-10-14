import { Switch } from '@headlessui/react'
import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import { InfoTooltip } from '@/components/shared/InfoTooltip/InfoTooltip'
import {
  useSpaceFinderBoundaryActions,
  useSpaceFinderCarriagewaysVisible,
  useSpaceFinderCensusVisible,
  useSpaceFinderUserObstaclesVisible,
  useSpaceFinderVegetationVisible,
} from '../../../hooks/mapState/space-finder-boundary-store'

/** Schalter-Optik der Anzeige-Zeilen; `onColorClass` färbt ihn im eingeschalteten Zustand. */
export const ToggleSwitch = ({
  checked,
  onChange,
  onColorClass,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  onColorClass: string
}) => (
  <Switch
    checked={checked}
    onChange={onChange}
    className={twJoin(
      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors',
      checked ? onColorClass : 'bg-gray-300',
    )}
  >
    <span
      className={twJoin(
        'inline-block size-4 translate-y-0.5 rounded-full bg-white transition-transform',
        checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
      )}
    />
  </Switch>
)

/**
 * Ein/Aus-Schalter für einen der Kontroll-Layer der Karte (Vegetation, Fahrbahnen,
 * Eigene Daten). Die Schalterfarbe entspricht der Layer-Farbe in der Karte,
 * siehe SourcesLayersSpaceFinder.
 */
const LayerToggle = ({
  label,
  checked,
  onChange,
  onColorClass,
  info,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  onColorClass: string
  info?: ReactNode
}) => (
  <label className="flex items-center justify-between gap-2 rounded border border-gray-200 px-2.5 py-2 text-sm">
    <span className="flex items-center gap-1 font-medium text-gray-800">
      {label}
      {info && <InfoTooltip>{info}</InfoTooltip>}
    </span>
    <ToggleSwitch checked={checked} onChange={onChange} onColorClass={onColorClass} />
  </label>
)

export const VegetationToggle = () => {
  const vegetationOn = useSpaceFinderVegetationVisible()
  const { setVegetationVisible: setVegetationOn } = useSpaceFinderBoundaryActions()
  return (
    <LayerToggle
      label="Vegetationsflächen"
      checked={vegetationOn}
      onChange={setVegetationOn}
      onColorClass="bg-green-700"
    />
  )
}

export const CarriagewaysToggle = () => {
  const carriagewaysOn = useSpaceFinderCarriagewaysVisible()
  const { setCarriagewaysVisible: setCarriagewaysOn } = useSpaceFinderBoundaryActions()
  return (
    <LayerToggle
      label="Fahrbahnen"
      checked={carriagewaysOn}
      onChange={setCarriagewaysOn}
      onColorClass="bg-amber-700"
      info="Die Fahrbahnbreiten sind Schätzungen auf Basis der in OpenStreetMap erfassten Straßen und können von der tatsächlichen Breite abweichen. Sofern die tatsächliche Breite in den Daten enthalten ist, wird diese verwendet."
    />
  )
}

export const CensusToggle = () => {
  const censusOn = useSpaceFinderCensusVisible()
  const { setCensusVisible: setCensusOn } = useSpaceFinderBoundaryActions()
  return (
    <LayerToggle
      label="Zensus-Einwohner"
      checked={censusOn}
      onChange={setCensusOn}
      onColorClass="bg-blue-700"
      info="Die Einwohnerpunkte aus dem Zensus 2022 (Destatis, auf Gebäude verteilt), die in den Faktor „Bewohnerbedarf“ eingehen. Punktgröße und -farbe zeigen die Einwohnerzahl, ab Zoom 17 auch als Zahl. Nur eine Anzeige in der Karte — das Ausblenden ändert die Berechnung nicht."
    />
  )
}

export const UserObstaclesToggle = () => {
  const userObstaclesOn = useSpaceFinderUserObstaclesVisible()
  const { setUserObstaclesVisible: setUserObstaclesOn } = useSpaceFinderBoundaryActions()
  return (
    <LayerToggle
      label="Eigene Daten"
      checked={userObstaclesOn}
      onChange={setUserObstaclesOn}
      onColorClass="bg-violet-700"
      info="Die für diese Variante hochgeladene GeoJSON-Datei. Nur eine Anzeige in der Karte — das Ausblenden ändert die Berechnung nicht."
    />
  )
}
