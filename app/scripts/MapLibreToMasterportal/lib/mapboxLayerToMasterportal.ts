import { hexToRgba, multiplyAlpha, parseColorToRgba } from './hexToRgba'
import { interpolateZoom } from './interpolateZoom'
import { parseConditionCategoryCase } from './parseConditionCategoryCase'
import type {
  MasterportalDisplayStyle,
  MasterportalRule,
  MasterportalStyleDefinition,
  Rgba,
} from './types'

type ConvertOptions = {
  zoom: number
  operatorTypeFilter?: string
  extraConditions?: Record<string, string>
  labels?: Record<string, string>
}

const publicOperatorType = 'public'

const conditionForToken = (token: string, extra?: Record<string, string>) => ({
  properties: {
    condition_category: { name: token, condition: 'contains' as const },
    ...extra,
    ...(extra?.operator_type ? {} : { operator_type: publicOperatorType }),
  },
})

const buildConditionCategoryLineRules = (
  paint: Record<string, unknown>,
  zoom: number,
  lineOpacity = 1,
  labels?: Record<string, string>,
) => {
  const lineColorExpr = paint['line-color']
  const { rules, fallback } = parseConditionCategoryCase(lineColorExpr)
  const lineWidthExpr = paint['line-width']
  const lineWidth =
    Array.isArray(lineWidthExpr) && lineWidthExpr[0] === 'interpolate'
      ? Math.round(interpolateZoom(lineWidthExpr.slice(3) as number[], zoom) * 10) / 10
      : 2

  const masterportalRules: MasterportalRule[] = []
  const fallbackLegend = labels?.unspecified ?? labels?.default ?? 'Unbestimmt'

  const pushRulesForOpacity = (opacityFactor: number, extraConditions?: Record<string, string>) => {
    for (const { token, color } of rules) {
      const rgba = multiplyAlpha(parseColorToRgba(color), lineOpacity * opacityFactor)
      masterportalRules.push({
        conditions: conditionForToken(token, extraConditions),
        style: {
          lineStrokeColor: rgba,
          lineStrokeWidth: lineWidth,
          ...(labels ? { legendValue: labels[token] } : {}),
        },
      })
    }

    masterportalRules.push({
      ...(extraConditions
        ? { conditions: { properties: { ...extraConditions, operator_type: publicOperatorType } } }
        : {}),
      style: {
        lineStrokeColor: multiplyAlpha(parseColorToRgba(fallback), lineOpacity * opacityFactor),
        lineStrokeWidth: lineWidth,
        ...(labels ? { legendValue: fallbackLegend } : {}),
      },
    })
  }

  pushRulesForOpacity(0.5, { staggered: 'yes' })
  pushRulesForOpacity(0.5, { informal: 'yes' })
  pushRulesForOpacity(1)

  return masterportalRules
}

const buildConditionCategoryPolygonRules = (
  fillPaint: Record<string, unknown>,
  outlinePaint: Record<string, unknown>,
  zoom: number,
  labels?: Record<string, string>,
) => {
  const fillColorExpr = fillPaint['fill-color']
  const { rules, fallback } = parseConditionCategoryCase(fillColorExpr)
  const fillOpacity = typeof fillPaint['fill-opacity'] === 'number' ? fillPaint['fill-opacity'] : 1
  const outlineWidthExpr = outlinePaint['line-width']
  const outlineWidth =
    Array.isArray(outlineWidthExpr) && outlineWidthExpr[0] === 'interpolate'
      ? Math.round(interpolateZoom(outlineWidthExpr.slice(3) as number[], zoom) * 100) / 100
      : 1

  const masterportalRules: MasterportalRule[] = []
  const fallbackLegend = labels?.unspecified ?? labels?.default ?? 'Unbestimmt'

  for (const { token, color } of rules) {
    const fillRgba = multiplyAlpha(parseColorToRgba(color), fillOpacity)
    masterportalRules.push({
      conditions: conditionForToken(token),
      style: {
        polygonFillColor: fillRgba,
        polygonStrokeColor: parseColorToRgba(color),
        polygonStrokeWidth: outlineWidth,
        ...(labels ? { legendValue: labels[token] } : {}),
      },
    })
  }

  masterportalRules.push({
    style: {
      polygonFillColor: multiplyAlpha(parseColorToRgba(fallback), fillOpacity),
      polygonStrokeColor: parseColorToRgba(fallback),
      polygonStrokeWidth: outlineWidth,
      ...(labels ? { legendValue: fallbackLegend } : {}),
    },
  })

  return masterportalRules
}

const buildStaticFillAndOutlineRules = (
  fillPaint: Record<string, unknown>,
  outlinePaint: Record<string, unknown>,
) => {
  const fillColor = String(fillPaint['fill-color'] ?? 'rgba(0,0,0,0)')
  const fillOpacity = typeof fillPaint['fill-opacity'] === 'number' ? fillPaint['fill-opacity'] : 1
  const outlineColor = String(outlinePaint['line-color'] ?? 'rgba(0,0,0,1)')
  const outlineOpacity =
    typeof outlinePaint['line-opacity'] === 'number' ? outlinePaint['line-opacity'] : 1
  const dash = outlinePaint['line-dasharray']

  const style: MasterportalDisplayStyle = {
    polygonFillColor: parseColorToRgba(fillColor, fillOpacity),
    polygonStrokeColor: multiplyAlpha(parseColorToRgba(outlineColor), outlineOpacity),
    polygonStrokeWidth: 1,
    ...(Array.isArray(dash) ? { polygonStrokeDash: dash as number[] } : {}),
  }

  return [{ style }] satisfies MasterportalRule[]
}

const buildParallelPatternRules = (paint: Record<string, unknown>, zoom: number) => {
  const lineWidth =
    Array.isArray(paint['line-width']) && paint['line-width'][0] === 'interpolate'
      ? Math.round(interpolateZoom((paint['line-width'] as number[]).slice(3), zoom) * 10) / 10
      : 1
  const baseColor = parseColorToRgba(String(paint['line-color'] ?? 'rgb(237, 237, 237)'))
  const opacity = typeof paint['line-opacity'] === 'number' ? paint['line-opacity'] : 1

  const normalDash: number[] = [4, 2]
  const staggeredDash: number[] = [4, 2, 4, 2, 0, 12]

  const staggeredRule: MasterportalRule = {
    conditions: {
      properties: {
        orientation: 'parallel',
        staggered: 'yes',
        operator_type: publicOperatorType,
      },
    },
    style: {
      lineStrokeColor: multiplyAlpha(baseColor, opacity),
      lineStrokeWidth: lineWidth,
      lineStrokeDash: staggeredDash,
    },
  }

  const normalRule: MasterportalRule = {
    conditions: {
      properties: {
        orientation: 'parallel',
        operator_type: publicOperatorType,
      },
    },
    style: {
      lineStrokeColor: multiplyAlpha(baseColor, opacity),
      lineStrokeWidth: lineWidth,
      lineStrokeDash: normalDash,
    },
  }

  return [staggeredRule, normalRule]
}

type CircleMatchRule = { properties: Record<string, string | string[]>; color: string }

const parseCircleColorCase = (expression: unknown) => {
  if (!Array.isArray(expression) || expression[0] !== 'case') {
    throw new Error('Expected circle-color case expression')
  }

  const rules: CircleMatchRule[] = []
  let fallback = 'rgb(48, 159, 219)'

  for (let i = 1; i < expression.length; i += 2) {
    const condition = expression[i]
    const color = expression[i + 1]

    if (typeof color !== 'string') continue

    if (i + 1 === expression.length - 1 && !Array.isArray(condition)) {
      fallback = color
      break
    }

    if (!Array.isArray(condition) || condition[0] !== 'match') continue

    const attribute = condition[1]
    if (!Array.isArray(attribute) || attribute[0] !== 'get' || typeof attribute[1] !== 'string') {
      continue
    }

    const attrName = attribute[1]
    const values = condition[2]
    const valueList = Array.isArray(values) ? values.map(String) : [String(values)]

    for (const value of valueList) {
      rules.push({
        properties: { [attrName]: value },
        color,
      })
    }
  }

  return { rules, fallback }
}

const buildCircleRules = (paint: Record<string, unknown>) => {
  const { rules, fallback } = parseCircleColorCase(paint['circle-color'])
  const strokeColor = parseColorToRgba(String(paint['circle-stroke-color'] ?? 'rgb(0,0,0)'))

  const masterportalRules: MasterportalRule[] = rules.map(({ properties, color }) => ({
    conditions: {
      properties: {
        ...properties,
        operator_type: publicOperatorType,
      },
    },
    style: {
      type: 'circle',
      circleFillColor: parseColorToRgba(color),
      circleStrokeColor: strokeColor,
      circleStrokeWidth: 1,
      circleRadius: 6,
    },
  }))

  masterportalRules.push({
    conditions: { properties: { operator_type: publicOperatorType } },
    style: {
      type: 'circle',
      circleFillColor: parseColorToRgba(fallback),
      circleStrokeColor: strokeColor,
      circleStrokeWidth: 1,
      circleRadius: 6,
    },
  })

  return masterportalRules
}

const buildLabelRules = (
  layer: Record<string, unknown>,
  zoom: number,
  isPrivateVariant: boolean,
) => {
  const paint = (layer.paint ?? {}) as Record<string, unknown>
  const textColorExpr = paint['text-color']
  const textHaloColorExpr = paint['text-halo-color']
  const textHaloWidthExpr = paint['text-halo-width']

  let textColor: Rgba = hexToRgba('#3c3c3c')
  if (Array.isArray(textColorExpr) && textColorExpr[0] === 'match') {
    const privateColor = textColorExpr[3]
    const publicColor = textColorExpr[4]
    textColor = parseColorToRgba(String(isPrivateVariant ? privateColor : publicColor))
  }

  let textHaloColor: Rgba = parseColorToRgba('rgb(255, 255, 255)')
  if (Array.isArray(textHaloColorExpr) && textHaloColorExpr[0] === 'match') {
    const privateColor = textHaloColorExpr[3]
    const publicColor = textHaloColorExpr[4]
    textHaloColor = parseColorToRgba(String(isPrivateVariant ? privateColor : publicColor))
  }

  const textHaloWidth =
    Array.isArray(textHaloWidthExpr) && textHaloWidthExpr[0] === 'interpolate'
      ? Math.round(interpolateZoom(textHaloWidthExpr.slice(3) as number[], zoom) * 10) / 10
      : 2

  const layout = (layer.layout ?? {}) as Record<string, unknown>
  const textSizeExpr = layout['text-size']
  const textScale =
    Array.isArray(textSizeExpr) && textSizeExpr[0] === 'interpolate'
      ? Math.round((interpolateZoom(textSizeExpr.slice(3) as number[], zoom) / 10) * 10) / 10
      : 1

  return {
    conditions: isPrivateVariant
      ? { properties: { operator_type: 'private' } }
      : { properties: { operator_type: publicOperatorType } },
    style: {
      labelField: 'capacity',
      textFillColor: textColor,
      textStrokeColor: textHaloColor,
      textStrokeWidth: textHaloWidth,
      textScale: Math.max(textScale, 0.8),
    },
  } satisfies MasterportalRule
}

export const convertStreetDefaultLine = (
  styleId: string,
  layer: Record<string, unknown>,
  options: ConvertOptions,
) =>
  ({
    styleId,
    rules: buildConditionCategoryLineRules(
      (layer.paint ?? {}) as Record<string, unknown>,
      options.zoom,
      1,
      options.labels,
    ),
  }) satisfies MasterportalStyleDefinition

export const convertOffStreetArea = (
  styleId: string,
  fillLayer: Record<string, unknown>,
  outlineLayer: Record<string, unknown>,
  options: ConvertOptions,
) =>
  ({
    styleId,
    rules: buildConditionCategoryPolygonRules(
      (fillLayer.paint ?? {}) as Record<string, unknown>,
      (outlineLayer.paint ?? {}) as Record<string, unknown>,
      options.zoom,
      options.labels,
    ),
  }) satisfies MasterportalStyleDefinition

export const convertShadowArea = (
  styleId: string,
  fillLayer: Record<string, unknown>,
  outlineLayer: Record<string, unknown>,
) =>
  ({
    styleId,
    rules: buildStaticFillAndOutlineRules(
      (fillLayer.paint ?? {}) as Record<string, unknown>,
      (outlineLayer.paint ?? {}) as Record<string, unknown>,
    ),
  }) satisfies MasterportalStyleDefinition

export const convertParallelPattern = (
  styleId: string,
  layer: Record<string, unknown>,
  options: ConvertOptions,
) =>
  ({
    styleId,
    rules: buildParallelPatternRules((layer.paint ?? {}) as Record<string, unknown>, options.zoom),
  }) satisfies MasterportalStyleDefinition

export const convertCirclePoints = (styleId: string, layer: Record<string, unknown>) =>
  ({
    styleId,
    rules: buildCircleRules((layer.paint ?? {}) as Record<string, unknown>),
  }) satisfies MasterportalStyleDefinition

export const convertLabels = (styleId: string, layer: Record<string, unknown>, zoom: number) =>
  ({
    styleId,
    rules: [buildLabelRules(layer, zoom, false)],
  }) satisfies MasterportalStyleDefinition

export const convertParkingNo = (
  styleId: string,
  layer: Record<string, unknown>,
  options: ConvertOptions,
) => {
  const paint = (layer.paint ?? {}) as Record<string, unknown>
  const lineWidthExpr = paint['line-width']
  const lineWidth =
    Array.isArray(lineWidthExpr) && lineWidthExpr[0] === 'interpolate'
      ? Math.round(interpolateZoom(lineWidthExpr.slice(3) as number[], options.zoom) * 10) / 10
      : 2
  const dash = Array.isArray(paint['line-dasharray'])
    ? (paint['line-dasharray'] as number[])
    : [1, 0.75]

  return {
    styleId,
    rules: [
      {
        conditions: { properties: { parking: 'no_parking' } },
        style: {
          lineStrokeColor: parseColorToRgba('rgb(249, 115, 22)'),
          lineStrokeWidth: lineWidth,
          lineStrokeDash: dash,
        },
      },
      {
        conditions: { properties: { parking: 'no_stopping' } },
        style: {
          lineStrokeColor: parseColorToRgba('rgb(235, 0, 0)'),
          lineStrokeWidth: lineWidth,
          lineStrokeDash: dash,
        },
      },
      {
        style: {
          lineStrokeColor: parseColorToRgba('rgb(189, 189, 189)'),
          lineStrokeWidth: lineWidth,
          lineStrokeDash: dash,
        },
      },
    ],
  } satisfies MasterportalStyleDefinition
}
