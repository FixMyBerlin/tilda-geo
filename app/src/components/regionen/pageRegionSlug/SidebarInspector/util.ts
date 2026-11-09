import {
  bbox,
  booleanIntersects,
  coordEach,
  difference,
  featureCollection,
  point,
  polygon,
} from '@turf/turf'
import type { Feature, FeatureCollection } from 'geojson'
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { UrlFeature } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/types'

type Bounds = [number, number, number, number]
type Points = [[number, number], [number, number]]
type MapPanelSize = { width: number; height: number }
type MapInstance = Pick<MapLibreMap, 'getCanvas' | 'unproject' | 'fitBounds'>

function boundsToPoints(bounds: Bounds) {
  const [x0, y0, x1, y1] = bounds
  return [
    [x0, y0],
    [x1, y1],
  ] satisfies Points
}

function createBox(points: Points) {
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

function getMapSize(mapInstance: { getCanvas(): HTMLCanvasElement }) {
  const canvas = mapInstance.getCanvas()
  return { width: canvas.offsetWidth, height: canvas.offsetHeight }
}

export function createBoundingPolygon(
  mapInstance: MapInstance,
  sidebarSize: MapPanelSize,
  inspectorSize: MapPanelSize,
) {
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
    const { lng, lat } = mapInstance.unproject([coord[0]!, coord[1]!])
    coord[0] = lng
    coord[1] = lat
  })
  return poly
}

function geojsonFromCoordinates(coordinates: [number, number] | [number, number, number, number]) {
  return coordinates.length === 2 ? point(coordinates) : createBox(boundsToPoints(coordinates))
}

function createFeatureCollection(urlFeatures: UrlFeature[]) {
  return featureCollection(
    // @ts-expect-error - probably a bug
    urlFeatures.map(({ coordinates }) => geojsonFromCoordinates(coordinates)),
  ) as FeatureCollection
}

// A feature is in bounds when it touches the visible map area without covering all of it; a bbox
// that covers the whole area still needs a zoom-out to show its extent.
function isUrlFeatureInBounds({ coordinates }: UrlFeature, boundingPolygon: Feature) {
  if (!booleanIntersects(boundingPolygon, geojsonFromCoordinates(coordinates))) return false
  if (coordinates.length === 2) return true

  const [west, south, east, north] = coordinates
  let coversBoundingPolygon = true
  coordEach(boundingPolygon, ([lng = 0, lat = 0]) => {
    if (lng < west || lng > east || lat < south || lat > north) coversBoundingPolygon = false
  })
  return !coversBoundingPolygon
}

export function allUrlFeaturesInBounds(urlFeatures: UrlFeature[], boundingPolygon: Feature) {
  return urlFeatures.every((urlFeature) => isUrlFeatureInBounds(urlFeature, boundingPolygon))
}

export function fitBounds(
  mapInstance: MapInstance,
  urlFeatures: UrlFeature[],
  sidebarSize: MapPanelSize,
  inspectorSize: MapPanelSize,
) {
  const map = getMapSize(mapInstance)
  const [side, ins] = [sidebarSize, inspectorSize]

  const pad = Math.floor(Math.min(map.width - ins.width - side.width, map.height) / 10)

  const nwp = [side.width + pad, pad]
  const sep = {
    x: map.width - ins.width - pad,
    y: map.height - pad,
  }
  const nwc = mapInstance.unproject([nwp[0]!, nwp[1]!])
  const sec = mapInstance.unproject([sep.x, sep.y])

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
      top: nwp[1]!,
      left: nwp[0]!,
      bottom: pad,
      right: ins.width + pad,
    },
  })
}
