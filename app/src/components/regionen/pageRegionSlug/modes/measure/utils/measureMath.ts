import { area as turfArea, length as turfLength, lineString } from '@turf/turf'

type Position = GeoJSON.Position

const lineLengthM = (coordinates: Position[]) =>
  coordinates.length < 2 ? 0 : turfLength(lineString(coordinates), { units: 'kilometers' }) * 1000

export type Measurement =
  | { kind: 'line'; lengthM: number }
  | { kind: 'area'; areaM2: number; perimeterM: number }

/** Length of a line; area and perimeter (outer ring) of a polygon. Geodesic, in metres. */
export const measureGeometry = (geometry: GeoJSON.LineString | GeoJSON.Polygon) => {
  if (geometry.type === 'LineString') {
    return { kind: 'line', lengthM: lineLengthM(geometry.coordinates) } satisfies Measurement
  }
  return {
    kind: 'area',
    areaM2: turfArea(geometry),
    perimeterM: lineLengthM(geometry.coordinates[0] ?? []),
  } satisfies Measurement
}

/** The sides of a line or of the outer ring of a polygon, each with its length and middle. */
export const measureSegments = (geometry: GeoJSON.LineString | GeoJSON.Polygon) => {
  const path =
    geometry.type === 'LineString' ? geometry.coordinates : (geometry.coordinates[0] ?? [])
  return path.flatMap((start, index) => {
    const end = path[index + 1]
    if (!end) return []
    const [startLng = 0, startLat = 0] = start
    const [endLng = 0, endLat = 0] = end
    return [
      {
        lengthM: lineLengthM([start, end]),
        // Sides are short, so the middle of the two corners is the middle of the side.
        middle: [(startLng + endLng) / 2, (startLat + endLat) / 2] satisfies Position,
      },
    ]
  })
}

const formatter = (maximumFractionDigits: number, minimumFractionDigits = 0) =>
  new Intl.NumberFormat('de-DE', { maximumFractionDigits, minimumFractionDigits })

const oneDecimal = formatter(1, 1)
const twoDecimals = formatter(2, 2)
const whole = formatter(0)

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

export const formatMeasurement = (measurement: Measurement) =>
  measurement.kind === 'line' ? formatLength(measurement.lengthM) : formatArea(measurement.areaM2)
