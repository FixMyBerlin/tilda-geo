import { ExpressionSpecification } from 'maplibre-gl'
import { Layer, LayerProps } from 'react-map-gl/maplibre'
import { useMapLoaded } from '../../../_hooks/mapState/useMapState'

const createMatchExpression = ({
  valueNone,
  valueHover,
  valueSelected,
  valueHoverSelected,
}: {
  valueNone: string | number
  valueHover: string | number
  valueSelected: string | number
  valueHoverSelected: string | number
}) => {
  return [
    'case',
    [
      'all',
      ['boolean', ['feature-state', 'hover'], false],
      ['boolean', ['feature-state', 'selected'], false],
    ],
    valueHoverSelected,
    ['boolean', ['feature-state', 'hover'], false],
    valueHover,
    ['boolean', ['feature-state', 'selected'], false],
    valueSelected,
    valueNone,
  ] satisfies ExpressionSpecification
}

const opacity = createMatchExpression({
  valueNone: 0,
  valueHover: 0.5,
  valueSelected: 0.8,
  valueHoverSelected: 0.8,
})

const color = createMatchExpression({
  valueNone: 'black',
  valueHover: '#ff9933',
  valueSelected: '#ff0000',
  valueHoverSelected: '#ff0000', // Same as selected when both hover and selected
})

export const LayerHighlight = (props: LayerProps) => {
  const mapLoaded = useMapLoaded()
  if (!mapLoaded) return null

  let layerProps = {
    ...props,
    paint: structuredClone(props.paint),
  } as LayerProps

  if (layerProps.type === 'line') {
    if (!layerProps.paint) layerProps.paint = {}
    delete layerProps.paint['line-blur']
    layerProps.paint = {
      ...layerProps.paint,
      'line-color': color,
      'line-opacity': opacity,
    }
  } else if (layerProps.type === 'fill') {
    // For fill layers, create an inner ring instead of filling the entire area
    layerProps = {
      ...layerProps,
      type: 'line',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': color,
        'line-opacity': opacity,
        'line-width': 10,
        'line-offset': -5, // Creates inner ring effect
      },
    }
  } else if (layerProps.type === 'circle') {
    layerProps.paint = {
      ...layerProps.paint,
      'circle-color': color,
      'circle-opacity': opacity,
      'circle-stroke-opacity': opacity,
      'circle-stroke-color': 'black',
      'circle-stroke-width': 2,
    }
  } else if (layerProps.type === 'symbol') {
    // It is really hard to create a generic highlighting for symbol layers.
    // There are two cases:
    // a. When we use a symbol as the only style.Eg.a bike parking icon. Those will get the the cirle highlight below.
    // b. When we add a symbol on a line or area. In those cases we cannot position the circle properly. Instead we do not highlight anything, ATM.
    // Test-URL: http://127.0.0.1:5173/regionen/bb-sg?map=13.7/52.3679/13.4683&config=gdl8v6.ibc0ia.d1s1&data=&f=12|way/80883641|13.458831|52.364856|13.463069|52.366717&notes=true&v=2
    if (layerProps?.layout && 'symbol-placement' in layerProps.layout) {
      return null
    }
    layerProps = {
      ...layerProps,
      type: 'circle',
      layout: {},
      paint: {
        'circle-color': 'transparent',
        'circle-stroke-opacity': opacity,
        'circle-stroke-color': color,
        'circle-stroke-width': 2,
        'circle-radius': 10,
      },
    }
  } else if (layerProps.type === 'heatmap') {
    // We don't provide a highlight for heatmap for now
    return null
  }

  return <Layer {...layerProps} />
}
