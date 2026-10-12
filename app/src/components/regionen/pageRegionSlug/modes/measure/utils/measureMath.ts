import { area, distance, feature, length, lineString, midpoint } from '@turf/turf'

type Shape = GeoJSON.LineString | GeoJSON.Polygon

// Geodesic, in metres.
export const lineLengthM = (line: GeoJSON.LineString) => length(feature(line), { units: 'meters' })

export const areaM2 = (polygon: GeoJSON.Polygon) => area(polygon)

/** Length of the outer ring. */
export const perimeterM = (polygon: GeoJSON.Polygon) =>
  length(lineString(polygon.coordinates[0] ?? []), { units: 'meters' })

/** The sides of a line or of the outer ring of a polygon, each with its length and middle. */
export const measureSegments = (shape: Shape) => {
  const path = shape.type === 'LineString' ? shape.coordinates : (shape.coordinates[0] ?? [])
  return path.slice(1).map((end, index) => {
    const start = path[index] ?? end
    return {
      lengthM: distance(start, end, { units: 'meters' }),
      middle: midpoint(start, end).geometry.coordinates,
    }
  })
}

const formatter = (fractionDigits: number) =>
  new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  })

const whole = formatter(0)
const oneDecimal = formatter(1)
const twoDecimals = formatter(2)

/** `3,45 m` below 10 m, `12,4 m` below 100 m, `123 m` below 1 km, then `1,23 km`. */
export const formatLength = (metres: number) => {
  if (metres < 10) return `${twoDecimals.format(metres)} m`
  if (metres < 100) return `${oneDecimal.format(metres)} m`
  if (metres < 1000) return `${whole.format(metres)} m`
  return `${twoDecimals.format(metres / 1000)} km`
}

/** `35,2 m²` below 100 m², `1.234 m²` below 1 ha, `1,23 ha` below 1 km², then `1,23 km²`. */
export const formatArea = (squareMetres: number) => {
  if (squareMetres < 100) return `${oneDecimal.format(squareMetres)} m²`
  if (squareMetres < 10_000) return `${whole.format(squareMetres)} m²`
  if (squareMetres < 1_000_000) return `${twoDecimals.format(squareMetres / 10_000)} ha`
  return `${twoDecimals.format(squareMetres / 1_000_000)} km²`
}

/** The value a shape is measured for: the length of a line, the area of a polygon. */
export const formatShapeValue = (shape: Shape) =>
  shape.type === 'LineString' ? formatLength(lineLengthM(shape)) : formatArea(areaM2(shape))
