import {
  MAPTERHORN_TILE_SIZE,
  MAPTERHORN_TILES_ORIGIN,
} from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/mapterhornDem'
import { lonLatToTileSample, sampleTerrariumPixel } from './terrarium'

const TILE_ZOOM = 13
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

const loadTile = async (zoom: number, tileX: number, tileY: number) => {
  const response = await fetch(`${MAPTERHORN_TILES_ORIGIN}/${zoom}/${tileX}/${tileY}.webp`)
  if (!response.ok) {
    throw new Error(`Mapterhorn-Kachel ${zoom}/${tileX}/${tileY} konnte nicht geladen werden.`)
  }

  const blob = await response.blob()
  const bitmap = await createImageBitmap(blob, { colorSpaceConversion: 'none' })
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new Error('Terrain-Kachel konnte nicht gelesen werden.')
  }

  context.drawImage(bitmap, 0, 0)
  const { width, height } = bitmap
  const imageData = context.getImageData(0, 0, width, height).data
  bitmap.close()

  return {
    size: width,
    imageData,
  }
}

const getTileForCoordinate = async (lng: number, lat: number) => {
  const { tileX, tileY } = lonLatToTileSample(lng, lat, TILE_ZOOM, MAPTERHORN_TILE_SIZE)
  const cacheKey = `${TILE_ZOOM}/${tileX}/${tileY}`
  const cached = tileCache.get(cacheKey)
  if (cached) return cached

  const promise = loadTile(TILE_ZOOM, tileX, tileY).catch((error) => {
    tileCache.delete(cacheKey)
    const cacheIndex = cacheOrder.indexOf(cacheKey)
    if (cacheIndex >= 0) cacheOrder.splice(cacheIndex, 1)
    throw error
  })
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
