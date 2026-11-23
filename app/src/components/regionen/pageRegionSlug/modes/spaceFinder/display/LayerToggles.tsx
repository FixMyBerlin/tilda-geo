import { Switch } from '@headlessui/react'
import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import { InfoTooltip } from '@/components/shared/InfoTooltip/InfoTooltip'
import {
  useSpaceFinderCarriagewaysVisible,
  useSpaceFinderCensusVisible,
  useSpaceFinderLayersActions,
  useSpaceFinderUserObstaclesVisible,
  useSpaceFinderVegetationVisible,
} from '../../../hooks/mapState/space-finder-layers-store'

/** Switch look of the display rows; `onColorClass` colours it when on. */
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
 * On/off switch for one of the map's control layers (Vegetation, Fahrbahnen,
 * Eigene Daten). The switch colour matches the layer colour on the map,
 * see SourcesLayersSpaceFinder.
 */
const LayerToggle = ({
  label,
  checked,
  onChange,
  onColorClass,
  info,
  legend,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  onColorClass: string
  info?: ReactNode
  /** Shown below the switch while the layer is on. */
  legend?: ReactNode
}) => (
  <div className="rounded border border-gray-200 px-2.5 py-2 text-sm">
    <label className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1 font-medium text-gray-800">
        {label}
        {info && <InfoTooltip>{info}</InfoTooltip>}
      </span>
      <ToggleSwitch checked={checked} onChange={onChange} onColorClass={onColorClass} />
    </label>
    {checked && legend}
  </div>
)

// Same colors as the census circles (`censusLayerProps` in SourcesLayersSpaceFinder.tsx); the
// size only hints at the scale, the real radius also depends on the zoom.
const CENSUS_LEGEND_STEPS = [
  { label: '1', color: '#bfdbfe', size: 'size-2' },
  { label: '25', color: '#60a5fa', size: 'size-2.5' },
  { label: '100+', color: '#1d4ed8', size: 'size-3.5' },
]

const CensusLegend = () => (
  <div className="mt-1.5 text-xs text-gray-600">
    <div className="flex items-center gap-3">
      <span>Einwohner je Gebäude:</span>
      {CENSUS_LEGEND_STEPS.map(({ label, color, size }) => (
        <span key={label} className="flex items-center gap-1">
          <span
            className={twJoin(size, 'inline-block rounded-full border border-blue-900/70')}
            style={{ backgroundColor: color }}
          />
          {label}
        </span>
      ))}
    </div>
    <p className="mt-0.5 text-gray-500">Ab Zoom 17 steht die Zahl am Punkt.</p>
  </div>
)

export const VegetationToggle = () => {
  const vegetationOn = useSpaceFinderVegetationVisible()
  const { setVegetationVisible: setVegetationOn } = useSpaceFinderLayersActions()
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
  const { setCarriagewaysVisible: setCarriagewaysOn } = useSpaceFinderLayersActions()
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
  const { setCensusVisible: setCensusOn } = useSpaceFinderLayersActions()
  return (
    <LayerToggle
      label="Zensus-Einwohner"
      checked={censusOn}
      onChange={setCensusOn}
      onColorClass="bg-blue-700"
      legend={<CensusLegend />}
      info="Die Einwohnerpunkte aus dem Zensus 2022 (Destatis, auf Gebäude verteilt). Sie gehen in den Faktor „Bewohnerbedarf“ ein, wenn er gewichtet ist. Punktgröße und -farbe zeigen die Einwohnerzahl, ab Zoom 17 auch als Zahl. Nur eine Anzeige in der Karte — das Ausblenden ändert die Berechnung nicht."
    />
  )
}

export const UserObstaclesToggle = () => {
  const userObstaclesOn = useSpaceFinderUserObstaclesVisible()
  const { setUserObstaclesVisible: setUserObstaclesOn } = useSpaceFinderLayersActions()
  return (
    <LayerToggle
      label="Eigene Daten"
      checked={userObstaclesOn}
      onChange={setUserObstaclesOn}
      onColorClass="bg-orange-600"
      info="Die für diese Variante hochgeladene GeoJSON-Datei. Nur eine Anzeige in der Karte — das Ausblenden ändert die Berechnung nicht."
    />
  )
}
