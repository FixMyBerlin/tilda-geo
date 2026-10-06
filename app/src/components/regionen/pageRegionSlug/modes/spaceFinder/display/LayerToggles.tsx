import { Switch } from '@headlessui/react'
import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import { InfoTooltip } from '@/components/shared/InfoTooltip/InfoTooltip'
import { useSpaceFinderBoundaryState } from '../../../hooks/mapState/useSpaceFinderBoundaryState'

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
  </label>
)

export const VegetationToggle = () => {
  const vegetationOn = useSpaceFinderBoundaryState((s) => s.vegetationVisible)
  const setVegetationOn = useSpaceFinderBoundaryState((s) => s.setVegetationVisible)
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
  const carriagewaysOn = useSpaceFinderBoundaryState((s) => s.carriagewaysVisible)
  const setCarriagewaysOn = useSpaceFinderBoundaryState((s) => s.setCarriagewaysVisible)
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
  const censusOn = useSpaceFinderBoundaryState((s) => s.censusVisible)
  const setCensusOn = useSpaceFinderBoundaryState((s) => s.setCensusVisible)
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
  const userObstaclesOn = useSpaceFinderBoundaryState((s) => s.userObstaclesVisible)
  const setUserObstaclesOn = useSpaceFinderBoundaryState((s) => s.setUserObstaclesVisible)
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
