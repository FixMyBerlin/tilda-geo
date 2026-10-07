import { TrashIcon } from '@heroicons/react/20/solid'
import bbox from '@turf/bbox'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import { useRegionBackgrounds } from '@/components/regionen/pageRegionSlug/background/useRegionBackgrounds'
import { useBackgroundParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBackgroundParam'
import { ModePanel } from '../ModePanel'
import {
  modePanelFooterClassName,
  modePanelListMetaClassName,
  modePanelMutedClassName,
  modePanelTintHairlineTopClassName,
} from '../modePanel.const'
import { useMeasureDraw, useMeasureLiveShapes } from './drawing/useMeasureDraw'
import { isMeasureArea, isMeasureLine, type MeasureShape } from './measureModeParam'
import { MeasurePanelActions } from './MeasurePanelActions'
import { useMeasureShapes } from './useMeasureShapes'
import { formatArea, formatLength, measureGeometry } from './utils/measureMath'

const BackgroundLine = () => {
  const { backgroundParam, automaticBackground, setBackgroundParam } = useBackgroundParam()
  const regionBackgrounds = useRegionBackgrounds()
  const name = regionBackgrounds.find((source) => source.id === backgroundParam)?.name
  const isAutomatic = backgroundParam === automaticBackground

  return (
    <p className={modePanelFooterClassName}>
      {isAutomatic ? 'Luftbild' : 'Hintergrund'}: {name ?? 'Standardkarte'}
      {isAutomatic ? ' (automatisch gewählt)' : null}
      {!isAutomatic && automaticBackground && (
        <>
          {' · '}
          <button
            type="button"
            className="underline hover:text-gray-700"
            onClick={() => setBackgroundParam(automaticBackground)}
          >
            Luftbild zeigen
          </button>
        </>
      )}
    </p>
  )
}

/**
 * Messen mode: measure lines and areas on the map (`MeasureMap`) and read the values here.
 * Nothing is stored; the measurements live in the URL (`measure`), so a measurement is
 * shared by its link.
 */
export const PageModeMeasure = () => {
  const { mainMap } = useMap()
  const draw = useMeasureDraw()
  const { shapes } = useMeasureShapes()
  // Includes a drag in progress, so the values follow the pointer.
  const liveShapes = useMeasureLiveShapes()

  const lines = liveShapes.filter(isMeasureLine)
  const areas = liveShapes.filter(isMeasureArea)
  const totalLengthM = lines.reduce((sum, line) => {
    const measurement = measureGeometry(line.geometry)
    return sum + (measurement.kind === 'line' ? measurement.lengthM : 0)
  }, 0)
  const totalAreaM2 = areas.reduce((sum, area) => {
    const measurement = measureGeometry(area.geometry)
    return sum + (measurement.kind === 'area' ? measurement.areaM2 : 0)
  }, 0)

  const showShape = (shape: MeasureShape) => {
    draw.select(shape.id)
    if (!mainMap) return
    const [minLng, minLat, maxLng, maxLat] = bbox(shape)
    // The camera padding of the mode panel is already set on the map (`modeMapCameraPadding`).
    mainMap.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { duration: 900, padding: 80, maxZoom: 20 },
    )
  }

  const rows = [
    ...lines.map((shape, index) => ({ shape, label: `Linie ${index + 1}` })),
    ...areas.map((shape, index) => ({ shape, label: `Fläche ${index + 1}` })),
  ]

  return (
    <ModePanel title="Messen" actions={<MeasurePanelActions />}>
      {rows.length === 0 ? (
        <p className={`px-4 py-3 ${modePanelMutedClassName}`}>
          Messen Sie eine Länge oder eine Fläche auf der Karte. Die Werte stehen dann hier.
        </p>
      ) : (
        <ul>
          {rows.map(({ shape, label }) => {
            const measurement = measureGeometry(shape.geometry)
            const selected = draw.selectedId === shape.id
            return (
              <li
                key={shape.id}
                className={twJoin(
                  'flex items-center justify-between gap-2 px-4 py-2',
                  modePanelTintHairlineTopClassName,
                  selected && 'bg-white',
                )}
              >
                <div className="flex min-w-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => showShape(shape)}
                    title="Auf der Karte zeigen"
                    className="truncate text-sm font-semibold hover:underline"
                  >
                    {label}
                  </button>
                  <button
                    type="button"
                    // Through the drawing surface, so deleting can be undone.
                    onClick={() => draw.replace(shapes.filter(({ id }) => id !== shape.id))}
                    aria-label={`${label} löschen`}
                    title={`${label} löschen`}
                  >
                    <TrashIcon className="size-4 text-gray-400 hover:text-gray-700" />
                  </button>
                </div>
                <div className="text-right tabular-nums">
                  <strong className="text-sm">
                    {measurement.kind === 'line'
                      ? formatLength(measurement.lengthM)
                      : formatArea(measurement.areaM2)}
                  </strong>
                  {measurement.kind === 'area' && (
                    <div className={modePanelListMetaClassName}>
                      Umfang {formatLength(measurement.perimeterM)}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
          {(lines.length > 1 || areas.length > 1) && (
            <li
              className={twJoin(
                'space-y-0.5 px-4 py-2 text-sm tabular-nums',
                modePanelTintHairlineTopClassName,
              )}
            >
              {lines.length > 1 && (
                <div className="flex justify-between gap-2">
                  <span>Alle Linien</span>
                  <strong>{formatLength(totalLengthM)}</strong>
                </div>
              )}
              {areas.length > 1 && (
                <div className="flex justify-between gap-2">
                  <span>Alle Flächen</span>
                  <strong>{formatArea(totalAreaM2)}</strong>
                </div>
              )}
            </li>
          )}
        </ul>
      )}
      <BackgroundLine />
    </ModePanel>
  )
}
