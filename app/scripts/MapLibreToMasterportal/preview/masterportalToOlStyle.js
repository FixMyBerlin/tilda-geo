/** @global ol */
const matchesProperty = (featureProps, key, expected) => {
  const value = featureProps[key]
  if (value === undefined || value === null) return false

  if (typeof expected === 'object' && expected !== null && 'name' in expected) {
    const str = String(value)
    if (expected.condition === 'contains') return str.includes(expected.name)
    if (expected.condition === 'startsWith') return str.startsWith(expected.name)
    if (expected.condition === 'endsWith') return str.endsWith(expected.name)
    return false
  }

  return String(value) === String(expected)
}

const matchesConditions = (featureProps, conditions) => {
  if (!conditions?.properties) return true

  return Object.entries(conditions.properties).every(([key, expected]) =>
    matchesProperty(featureProps, key, expected),
  )
}

const rgbaToOl = (rgba) => `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`

const findMatchingRule = (rules, featureProps) => {
  for (const rule of rules) {
    if (matchesConditions(featureProps, rule.conditions)) {
      return rule
    }
  }
  return null
}

const createOlStyles = (rule, geometryType, featureProps) => {
  if (!rule?.style) return null

  const { style } = rule
  const styles = []

  if (geometryType === 'Polygon') {
    styles.push(
      new ol.style.Style({
        fill: style.polygonFillColor
          ? new ol.style.Fill({ color: rgbaToOl(style.polygonFillColor) })
          : undefined,
        stroke: style.polygonStrokeColor
          ? new ol.style.Stroke({
              color: rgbaToOl(style.polygonStrokeColor),
              width: style.polygonStrokeWidth ?? 1,
              lineDash: style.polygonStrokeDash,
            })
          : undefined,
      }),
    )
  }

  if (geometryType === 'LineString' && style.lineStrokeColor) {
    styles.push(
      new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: rgbaToOl(style.lineStrokeColor),
          width: style.lineStrokeWidth ?? 2,
          lineDash: style.lineStrokeDash,
        }),
      }),
    )
  }

  if (geometryType === 'Point') {
    if (style.type === 'circle' && style.circleFillColor) {
      styles.push(
        new ol.style.Style({
          image: new ol.style.Circle({
            radius: style.circleRadius ?? 6,
            fill: new ol.style.Fill({ color: rgbaToOl(style.circleFillColor) }),
            stroke: style.circleStrokeColor
              ? new ol.style.Stroke({
                  color: rgbaToOl(style.circleStrokeColor),
                  width: style.circleStrokeWidth ?? 1,
                })
              : undefined,
          }),
        }),
      )
    }

    if (style.labelField) {
      const label = featureProps[style.labelField]
      if (label !== undefined && label !== null) {
        styles.push(
          new ol.style.Style({
            text: new ol.style.Text({
              text: String(label),
              font: `${Math.round((style.textScale ?? 1) * 12)}px sans-serif`,
              fill: new ol.style.Fill({ color: rgbaToOl(style.textFillColor ?? [60, 60, 60, 1]) }),
              stroke: new ol.style.Stroke({
                color: rgbaToOl(style.textStrokeColor ?? [255, 255, 255, 1]),
                width: style.textStrokeWidth ?? 2,
              }),
            }),
          }),
        )
      }
    }
  }

  return styles.length ? styles : null
}

window.createStyleFunction = (rules, geometryType) => {
  return (feature) => {
    const props = { ...feature.getProperties() }
    delete props.geometry

    if (geometryType === 'LineString' && props.capacity === undefined) {
      return null
    }

    const rule = findMatchingRule(rules, props)
    if (!rule) return null

    return createOlStyles(rule, geometryType, props)
  }
}
