import {
  booleanValid,
  center,
  centerOfMass,
  feature,
  length,
  lineSliceAlong,
  lineString,
  polygon,
} from '@turf/turf'

type ReturnPosition = [number, number]

// Case: When the geometry array is empty, we fall back to a place near Helgoland.
const fallback = [8.1441836, 54.09762] as const satisfies ReturnPosition

const truncate = (lng: number, lat: number) => {
  const truncateToSixDigits = (num: number) => Math.floor(num * 1e6) / 1e6
  return [truncateToSixDigits(lng), truncateToSixDigits(lat)] satisfies ReturnPosition
}

const pointOnMiddleOfLinestring = (geometry: GeoJSON.LineString) => {
  try {
    const halfLength = length(feature(geometry), { units: 'meters' }) / 2

    // Handle the edge case when a linestring start and end are the same
    // See https://github.com/Turfjs/turf/issues/1577#issuecomment-2646550413
    if (halfLength === 0) {
      const lng = geometry.coordinates.at(0)?.at(0) || fallback[0]
      const lat = geometry.coordinates.at(0)?.at(1) || fallback[1]
      return truncate(lng, lat)
    }

    const wayToHalf = lineSliceAlong(geometry, 0, halfLength, {
      units: 'meters',
    })

    const lng = wayToHalf.geometry.coordinates.at(-1)?.at(0) || fallback[0]
    const lat = wayToHalf.geometry.coordinates.at(-1)?.at(1) || fallback[1]
    return truncate(lng, lat)
  } catch (error) {
    console.log('ERROR pointOnMiddleOfLinestring', error)
    return truncate(fallback[0], fallback[1])
  }
}

// TS Note: For some reason I need to add the return type once I add the recursion at the end.
export const pointFromGeometry = (geometry: GeoJSON.Feature['geometry']) => {
  if (!booleanValid(geometry)) {
    // UseCase: We had a wrong maxzoom setting wich returned an invalid Polygon
    const firstGeometry =
      geometry.type === 'GeometryCollection' ? geometry.geometries[0] : undefined
    const fallbackFirstPoint =
      firstGeometry !== undefined
        ? pointFromGeometry(firstGeometry)
        : geometry.type === 'GeometryCollection'
          ? fallback
          : geometry.coordinates.flat(2).at(0) || fallback
    const lng = fallbackFirstPoint[0] || fallback[0]
    const lat = fallbackFirstPoint[1] || fallback[1]
    console.log('ERROR', 'Geometry invalid, using fallback', {
      geometry,
      fallbackFirstPoint,
      point: [lng, lat],
    })
    return truncate(lng, lat)
  }

  switch (geometry.type) {
    case 'Point': {
      const lng = geometry.coordinates[0] || fallback[0]
      const lat = geometry.coordinates[1] || fallback[1]
      return truncate(lng, lat)
    }
    case 'MultiPoint': {
      // Never happens, so we just force the first point
      const lng = geometry.coordinates[0]?.[0] || fallback[0]
      const lat = geometry.coordinates[0]?.[1] || fallback[1]
      return truncate(lng, lat)
    }
    case 'LineString': {
      return pointOnMiddleOfLinestring(geometry)
    }
    case 'MultiLineString': {
      const coords = geometry.coordinates
      const first = coords[0]
      if (!first) return truncate(fallback[0], fallback[1])
      let longestLine = first
      let maxLength = length(lineString(longestLine))
      for (const line of geometry.coordinates) {
        const innerLength = length(lineString(line))
        if (innerLength > maxLength) {
          longestLine = line
          maxLength = innerLength
        }
      }

      const longestLineLinestring = lineString(longestLine).geometry
      return pointOnMiddleOfLinestring(longestLineLinestring)
    }
    case 'Polygon': {
      const centerFeature = centerOfMass(polygon(geometry.coordinates))
      const lng = centerFeature.geometry.coordinates[0] || fallback[0]
      const lat = centerFeature.geometry.coordinates[1] || fallback[1]
      return truncate(lng, lat)
    }
    case 'MultiPolygon': {
      // This is not the best point. But we can always improve it to take the center of the largest Polygon
      const centerFeature = center(geometry)
      const lng = centerFeature.geometry.coordinates[0] || fallback[0]
      const lat = centerFeature.geometry.coordinates[1] || fallback[1]
      return truncate(lng, lat)
    }
    case 'GeometryCollection': {
      // `GeometryCollection` are an array of Point|LineString|Polygon|….
      // This should never happen for our data, so we just pick the first to create a center.
      const firstCollectionItem = geometry.geometries[0]
      if (!firstCollectionItem || !booleanValid(firstCollectionItem)) {
        return fallback
      }
      return pointFromGeometry(firstCollectionItem)
    }
  }
}
