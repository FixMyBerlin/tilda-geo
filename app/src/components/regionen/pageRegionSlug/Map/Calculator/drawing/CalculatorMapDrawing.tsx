import { DrawLayers } from '@osm-editor-kit/react-map-gl-draw'
import { pointOnFeature } from '@turf/turf'
import type { LayerProps } from 'react-map-gl/maplibre'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useDrawSession } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useDrawSession'
import { CalculatorDrawingToolbar } from './CalculatorDrawingToolbar'
import { CALCULATOR_DRAW_COLORS, calculatorDrawStyles } from './calculatorDrawStyles'
import type { DrawArea } from './drawAreaTypes'
import { useCalculatorDraw } from './useCalculatorDraw'

type Props = {
  /** The areas as drawn right now, including a drag that is not in the URL yet. */
  areas: DrawArea[]
  getFeatureLabel?: (args: { area: DrawArea; index: number }) => string | undefined
}

export function CalculatorMapDrawing({ areas, getFeatureLabel }: Props) {
  const draw = useCalculatorDraw()
  const { drawAreas, setDrawAreas } = useDrawSession()

  const labelFeatures = areas.flatMap((area, index) => {
    const label = getFeatureLabel?.({ area, index })
    if (!label) return []
    return [
      {
        type: 'Feature',
        geometry: pointOnFeature(area).geometry,
        properties: { label },
      } satisfies GeoJSON.Feature<GeoJSON.Point, { label: string }>,
    ]
  })

  return (
    <>
      <DrawLayers draw={draw} id="calculator-draw" styles={calculatorDrawStyles} />
      {labelFeatures.length > 0 && (
        <>
          <Source
            id="calculator-draw-labels-source"
            type="geojson"
            data={{ type: 'FeatureCollection', features: labelFeatures }}
          />
          <Layer
            {...({
              id: 'calculator-draw-labels',
              source: 'calculator-draw-labels-source',
              type: 'symbol',
              layout: {
                'text-field': ['get', 'label'],
                'text-size': 11,
                'text-allow-overlap': true,
                'text-font': ['Noto Sans Regular'],
                'text-anchor': 'center',
              },
              paint: {
                'text-color': '#ffffff',
                'text-halo-color': CALCULATOR_DRAW_COLORS.unselected,
                'text-halo-width': 1.5,
                'text-halo-blur': 0.5,
              },
            } satisfies LayerProps)}
          />
        </>
      )}
      <CalculatorDrawingToolbar
        isDrawing={draw.isDrawing}
        hasAreas={drawAreas.length > 0}
        canAddArea={draw.tool === 'select' && draw.canAdd('polygon')}
        onAddArea={() => draw.setTool('polygon')}
        onFinish={draw.finish}
        onCancel={draw.cancel}
        // The selected area, or all areas when none is selected.
        onDelete={() => (draw.canDeleteSelected ? draw.deleteSelected() : setDrawAreas([]))}
      />
    </>
  )
}
