import { bbox, coordEach, difference, featureCollection, point, polygon } from '@turf/turf'
import type { FeatureCollection } from 'geojson'
import GeoJSONReader from 'jsts/org/locationtech/jts/io/GeoJSONReader'
import OverlayOp from 'jsts/org/locationtech/jts/operation/overlay/OverlayOp'
import type { UrlFeature } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/types'

type Bounds = [number, number, number, number]
type Points = [[number, number], [number, number]]

export function boundsToPoints(bounds: Bounds) {
  const [x0, y0, x1, y1] = bounds
  return [
    [x0, y0],
    [x1, y1],
  ] satisfies Points
}

export function createBox(points: Points) {
  const [[x0, y0], [x1, y1]] = points
  return polygon([
    [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
      [x0, y0],
    ],
  ])
}

export function getMapSize(mapInstance: { getCanvas(): HTMLCanvasElement }) {
  const canvas = mapInstance.getCanvas()
  return { width: canvas.offsetWidth, height: canvas.offsetHeight }
}

export function createBoundingPolygon(mapInstance, sidebarSize, inspectorSize) {
  const map = getMapSize(mapInstance)
  const side = sidebarSize
  const ins = inspectorSize
  const mapBox = createBox([
    [0, 0],
    [map.width, map.height],
  ])
  const layersBox = createBox([
    [0, 0],
    [side.width, side.height],
  ])
  const inspectorBox = createBox([
    [map.width - ins.width, 0],
    [map.width, map.height],
  ])

  // On Mobile, the Inspector is a layer above the Map. In this case, we use the whole mapBox
  if (map.width <= ins.width) {
    return mapBox
  }

  const diff1 = difference(featureCollection([mapBox, layersBox]))
  const poly = diff1 && difference(featureCollection([diff1, inspectorBox]))
  if (!poly) return mapBox
  coordEach(poly, (coord) => {
    const { lng, lat } = mapInstance.unproject(coord)
    coord[0] = lng
    coord[1] = lat
  })
  return poly
}

export function compareFeatures(feature1, feature2) {
  // @ts-expect-error, see https://github.com/bjornharrtell/jsts/issues/532
  const geojsonReader = new GeoJSONReader()
  const f1 = geojsonReader.read(feature1.geometry)
  const f2 = geojsonReader.read(feature2.geometry)
  const intersected = !OverlayOp.intersection(f1, f2).isEmpty()
  if (intersected) {
    const d12 = !OverlayOp.difference(f1, f2).isEmpty()
    const d21 = !OverlayOp.difference(f2, f1).isEmpty()
    if (!d12 && !d21) {
      // feature1 and feature2 are equal
      return '=' as const
    } else if (d12 && !d21) {
      // feature2 is completely contained in feature1
      return '>' as const
    } else if (!d12 && d21) {
      // feature1 is completely contained in feature2
      return '<' as const
    } else {
      // feature1 and feature2 intersect
      return '~' as const
    }
  } else {
    // feature1 and feature2 do not intersect
    return '!=' as const
  }
}

function geojsonFromCoordinates(coordinates: [number, number] | [number, number, number, number]) {
  return coordinates.length === 2 ? point(coordinates) : createBox(boundsToPoints(coordinates))
}

export function createFeatureCollection(urlFeatures: UrlFeature[]) {
  return featureCollection(
    // @ts-expect-error - probably a bug
    urlFeatures.map(({ coordinates }) => geojsonFromCoordinates(coordinates)),
  ) as FeatureCollection
}

export function allUrlFeaturesInBounds(urlFeatures, boundingPolygon) {
  return urlFeatures
    .map(({ coordinates }) => compareFeatures(boundingPolygon, geojsonFromCoordinates(coordinates)))
    .every((r) => ['~', '>'].includes(r))
}

export function fitBounds(mapInstance, urlFeatures, sidebarSize, inspectorSize) {
  const map = getMapSize(mapInstance)
  const [side, ins] = [sidebarSize, inspectorSize]

  const pad = Math.floor(Math.min(map.width - ins.width - side.width, map.height) / 10)

  const nwp = [side.width + pad, pad]
  const sep = {
    x: map.width - ins.width - pad,
    y: map.height - pad,
  }
  const [nwc, sec] = [nwp, sep].map((p) => mapInstance.unproject(p))

  const fc = createFeatureCollection(urlFeatures)
  fc.features = [
    ...fc.features,
    createBox([
      [nwc.lng, nwc.lat],
      [sec.lng, sec.lat],
    ]),
  ]

  mapInstance.fitBounds(boundsToPoints(bbox(fc) as Bounds), {
    padding: {
      top: nwp[1],
      left: nwp[0],
      bottom: pad,
      right: ins.width + pad,
    },
  })
}
