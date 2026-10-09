import { DrawLayers, DrawLoupe, useDrawDraft } from '@osm-editor-kit/react-map-gl-draw'
import { along, lineString, pointOnFeature } from '@turf/turf'
import type { LayerProps } from 'react-map-gl/maplibre'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useRegionBackgrounds } from '@/components/regionen/pageRegionSlug/background/useRegionBackgrounds'
import { useBackgroundParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBackgroundParam'
import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import { useLayerControlsOpen } from '../../../SidebarLayerControls/layer-controls-store'
import type { MeasureShape } from '../measureModeParam'
import { useMeasureShapes } from '../useMeasureShapes'
import {
  formatLength,
  formatMeasurement,
  measureGeometry,
  measureSegments,
} from '../utils/measureMath'
import { MeasureDrawingToolbar } from './MeasureDrawingToolbar'
import { MEASURE_DRAW_COLORS, measureDrawStyles } from './measureDrawStyles'
import { useMeasureDraw } from './useMeasureDraw'

type Props = {
  /** The shapes as drawn right now, including a drag that is not in the URL yet. */
  shapes: MeasureShape[]
}

type LabelFeature = GeoJSON.Feature<
  GeoJSON.Point,
  { label: string; kind: 'total' | 'side'; belowHandle?: boolean }
>

const labelPoint = (geometry: GeoJSON.LineString | GeoJSON.Polygon, lengthM: number) =>
  geometry.type === 'LineString'
    ? along(lineString(geometry.coordinates), lengthM / 2, { units: 'meters' }).geometry
    : pointOnFeature(geometry).geometry

/**
 * One label with the value per shape. `withSides` adds the length of every side, for the
 * shape that is selected or being drawn; a line of one side has only its value.
 */
const labelsOf = (
  geometry: GeoJSON.LineString | GeoJSON.Polygon,
  withSides: boolean,
  isSelected = false,
) => {
  const measurement = measureGeometry(geometry)
  const segments = measureSegments(geometry)
  const labels: LabelFeature[] = [
    {
      type: 'Feature',
      geometry: labelPoint(geometry, measurement.kind === 'line' ? measurement.lengthM : 0),
      properties: {
        label: formatMeasurement(measurement),
        kind: 'total',
        // The selected area shows its move handle on this spot.
        belowHandle: isSelected && geometry.type === 'Polygon',
      },
    },
  ]
  if (withSides && segments.length > 1) {
    for (const segment of segments) {
      labels.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: segment.middle },
        properties: { label: formatLength(segment.lengthM), kind: 'side' },
      })
    }
  }
  return labels
}

// On desktop the top left of the map belongs to the layer list: its button while it is
// closed, the list (`w-54` plus its inset) while it is open. The loupe docks beside it.
// On a phone it docks below the header buttons.
const LAYER_CONTROLS_BUTTON_WIDTH_PX = 64
const LAYER_CONTROLS_WIDTH_PX = 228
const LOUPE_MIN_MAP_ZOOM = 15
const LOUPE_EXTRA_ZOOM = 2.5

export function MeasureMapDrawing({ shapes }: Props) {
  const draw = useMeasureDraw()
  const draft = useDrawDraft(draw)
  const { shapes: storedShapes } = useMeasureShapes()
  const { backgroundParam } = useBackgroundParam()
  const regionBackgrounds = useRegionBackgrounds()
  const { mapParam } = useMapParam()
  const layerControlsOpen = useLayerControlsOpen()
  const isSmBreakpointOrAbove = useBreakpoint('sm')

  const labelFeatures = [
    ...shapes.flatMap((shape) => {
      const isSelected = shape.id === draw.selectedId
      return labelsOf(shape.geometry, isSelected, isSelected)
    }),
    ...(draft ? labelsOf(draft, true) : []),
  ]
  const draftValue = draft ? formatMeasurement(measureGeometry(draft)) : undefined

  const background = regionBackgrounds.find((source) => source.id === backgroundParam)
  // At least the zoom the image has its sharpest tiles for (one less for the 512 px tiles of
  // the satellite mosaics, which hold the next zoom already), and always clearly closer than
  // the map. Beyond two levels of enlarging the pixels nothing more is to be seen.
  const nativeZoom = background
    ? Math.min(background.maxzoom ?? 19, 20) - (background.tileSize === 512 ? 1 : 0)
    : undefined
  const mapZoom = mapParam?.zoom ?? 0
  const loupeZoom =
    nativeZoom === undefined
      ? undefined
      : Math.min(Math.max(nativeZoom, mapZoom + LOUPE_EXTRA_ZOOM), nativeZoom + 2)

  return (
    <>
      <DrawLayers draw={draw} id="measure-draw" styles={measureDrawStyles} />
      {labelFeatures.length > 0 && (
        <>
          <Source
            id="measure-draw-labels-source"
            type="geojson"
            data={{ type: 'FeatureCollection', features: labelFeatures }}
          />
          <Layer
            {...({
              id: 'measure-draw-labels',
              source: 'measure-draw-labels-source',
              type: 'symbol',
              layout: {
                'text-field': ['get', 'label'],
                'text-size': ['case', ['==', ['get', 'kind'], 'total'], 13, 11],
                'text-font': ['Noto Sans Bold'],
                'text-anchor': 'center',
                'text-offset': [
                  'case',
                  ['boolean', ['get', 'belowHandle'], false],
                  ['literal', [0, 1.9]],
                  ['literal', [0, 0]],
                ],
                'text-allow-overlap': true,
                'symbol-sort-key': ['case', ['==', ['get', 'kind'], 'total'], 0, 1],
              },
              paint: {
                'text-color': '#ffffff',
                'text-halo-color': MEASURE_DRAW_COLORS.shape,
                'text-halo-width': 2,
              },
            } satisfies LayerProps)}
          />
        </>
      )}
      {background && loupeZoom !== undefined && (
        <DrawLoupe
          draw={draw}
          zoom={loupeZoom}
          size={isSmBreakpointOrAbove ? 168 : 128}
          hidden={mapZoom < LOUPE_MIN_MAP_ZOOM}
          shapeColor={MEASURE_DRAW_COLORS.active}
          inset={{
            top: isSmBreakpointOrAbove ? 12 : 104,
            left: !isSmBreakpointOrAbove
              ? 12
              : (layerControlsOpen ? LAYER_CONTROLS_WIDTH_PX : LAYER_CONTROLS_BUTTON_WIDTH_PX) + 12,
          }}
        >
          <Source
            id="measure-loupe-background"
            type="raster"
            tiles={[background.tilesUrl]}
            {...(background.maxzoom ? { maxzoom: background.maxzoom } : {})}
            {...(background.minzoom ? { minzoom: background.minzoom } : {})}
            {...(background.tileSize ? { tileSize: background.tileSize } : {})}
            {...(background.scheme ? { scheme: background.scheme } : {})}
          />
          <Layer id="measure-loupe-background" type="raster" source="measure-loupe-background" />
        </DrawLoupe>
      )}
      <MeasureDrawingToolbar
        draw={draw}
        isDrawing={draw.isDrawing}
        hasShapes={storedShapes.length > 0}
        armedTool={draw.tool === 'line' || draw.tool === 'polygon' ? draw.tool : null}
        draftValue={draftValue}
        onFinish={draw.finish}
        onCancel={draw.cancel}
      />
    </>
  )
}
