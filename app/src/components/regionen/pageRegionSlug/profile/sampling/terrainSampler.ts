import { lonLatToTileSample, sampleTerrariumPixel } from './terrarium'

const TILE_ZOOM = 13
const TILE_SIZE = 512
const TILE_ENDPOINT = 'https://tiles.mapterhorn.com'
const TILE_CACHE_LIMIT = 64

type TerrainTile = {
  size: number
  imageData: Uint8ClampedArray
}

const tileCache = new Map<string, Promise<TerrainTile>>()
const cacheOrder: string[] = []

const rememberCacheKey = (key: string) => {
  const existingIndex = cacheOrder.indexOf(key)
  if (existingIndex >= 0) cacheOrder.splice(existingIndex, 1)
  cacheOrder.push(key)
  while (cacheOrder.length > TILE_CACHE_LIMIT) {
    const oldest = cacheOrder.shift()
    if (oldest) tileCache.delete(oldest)
  }
}

const createBitmap = async (blob: Blob) => {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(blob, { colorSpaceConversion: 'none' })
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Tile-Bitmap konnte nicht dekodiert werden.'))
    image.src = URL.createObjectURL(blob)
  })
}

const createRasterCanvas = (width: number, height: number) => {
  if (typeof OffscreenCanvas === 'function') {
    return new OffscreenCanvas(width, height)
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

const loadTile = async (zoom: number, tileX: number, tileY: number) => {
  const response = await fetch(`${TILE_ENDPOINT}/${zoom}/${tileX}/${tileY}.webp`)
  if (!response.ok) {
    throw new Error(`Mapterhorn-Kachel ${zoom}/${tileX}/${tileY} konnte nicht geladen werden.`)
  }

  const blob = await response.blob()
  const bitmap = await createBitmap(blob)
  const canvas = createRasterCanvas(bitmap.width, bitmap.height)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new Error('Terrain-Kachel konnte nicht gelesen werden.')
  }

  context.drawImage(bitmap, 0, 0)
  const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height).data

  return {
    size: bitmap.width,
    imageData,
  }
}

const getTileForCoordinate = async (lng: number, lat: number) => {
  const { tileX, tileY } = lonLatToTileSample(lng, lat, TILE_ZOOM, TILE_SIZE)
  const cacheKey = `${TILE_ZOOM}/${tileX}/${tileY}`
  const cached = tileCache.get(cacheKey)
  if (cached) return cached

  const promise = loadTile(TILE_ZOOM, tileX, tileY)
  tileCache.set(cacheKey, promise)
  rememberCacheKey(cacheKey)
  return promise
}

const sampleTerrainElevationAtPoint = async (lng: number, lat: number) => {
  const tile = await getTileForCoordinate(lng, lat)
  const { pixelX, pixelY } = lonLatToTileSample(lng, lat, TILE_ZOOM, tile.size)
  return sampleTerrariumPixel(tile.imageData, tile.size, pixelX, pixelY)
}

export type TerrainPathSampleInput = {
  lng: number
  lat: number
  distanceMeters: number
}

export const sampleTerrainElevations = async (samples: TerrainPathSampleInput[]) => {
  const elevations = await Promise.all(
    samples.map((sample) => sampleTerrainElevationAtPoint(sample.lng, sample.lat)),
  )
  return elevations
}
