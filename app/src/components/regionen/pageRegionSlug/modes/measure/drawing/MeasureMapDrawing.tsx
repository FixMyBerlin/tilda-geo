import { DrawLayers, DrawLoupe, useDrawDraft } from '@osm-editor-kit/react-map-gl-draw'
import { along, featureCollection, point, pointOnFeature } from '@turf/turf'
import type { LayerProps } from 'react-map-gl/maplibre'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useRegionBackgrounds } from '@/components/regionen/pageRegionSlug/background/useRegionBackgrounds'
import { useBackgroundParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBackgroundParam'
import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import { useBreakpoint } from '@/components/shared/hooks/viewport/useBreakpoint'
import {
  mapOverlayLayerControlsButtonWidthPx,
  mapOverlayLayerControlsSheetWidthPx,
} from '../../../mapOverlayChrome.const'
import { useLayerControlsOpen } from '../../../SidebarLayerControls/layer-controls-store'
import { isMeasureArea, type MeasureShape } from '../measureModeParam'
import { useMeasureShapes } from '../useMeasureShapes'
import { formatLength, formatShapeValue, lineLengthM, measureSegments } from '../utils/measureMath'
import { MeasureDrawingToolbar } from './MeasureDrawingToolbar'
import { MEASURE_DRAW_COLORS, measureDrawStyles } from './measureDrawStyles'
import { useMeasureDraw } from './useMeasureDraw'

type Props = {
  /** The shapes as drawn right now, including a drag that is not in the URL yet. */
  shapes: MeasureShape[]
}

type LabelProperties = { label: string; kind: 'total' | 'side'; belowHandle?: boolean }

/**
 * One label with the value per shape. `withSides` adds the length of every side, for the
 * shape that is selected or being drawn; a line of one side has only its value.
 * `belowHandle` moves the value of the selected area off its move handle.
 */
const labelsOf = (
  shape: GeoJSON.LineString | GeoJSON.Polygon,
  { withSides, belowHandle = false }: { withSides: boolean; belowHandle?: boolean },
) => {
  const position =
    shape.type === 'LineString'
      ? along(shape, lineLengthM(shape) / 2, { units: 'meters' }).geometry.coordinates
      : pointOnFeature(shape).geometry.coordinates
  const total = point<LabelProperties>(position, {
    label: formatShapeValue(shape),
    kind: 'total',
    belowHandle,
  })
  const segments = withSides ? measureSegments(shape) : []
  if (segments.length <= 1) return [total]
  return [
    total,
    ...segments.map(({ middle, lengthM }) =>
      point<LabelProperties>(middle, { label: formatLength(lengthM), kind: 'side' }),
    ),
  ]
}

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
      return labelsOf(shape.geometry, {
        withSides: isSelected,
        belowHandle: isSelected && isMeasureArea(shape),
      })
    }),
    ...(draft ? labelsOf(draft, { withSides: true }) : []),
  ]
  const draftValue = draft ? formatShapeValue(draft) : undefined

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
            data={featureCollection(labelFeatures)}
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
      {/* Not mounted while the map is zoomed out: there is nothing exact to place, and the
          loupe would load tiles of its own. */}
      {background && loupeZoom !== undefined && mapZoom >= LOUPE_MIN_MAP_ZOOM && (
        <DrawLoupe
          draw={draw}
          zoom={loupeZoom}
          size={isSmBreakpointOrAbove ? 168 : 128}
          shapeColor={MEASURE_DRAW_COLORS.active}
          inset={{
            // On a phone below the header buttons.
            top: isSmBreakpointOrAbove ? 12 : 104,
            // On desktop the top left of the map belongs to the layer list.
            left: !isSmBreakpointOrAbove
              ? 12
              : layerControlsOpen
                ? mapOverlayLayerControlsSheetWidthPx
                : mapOverlayLayerControlsButtonWidthPx,
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
