import { useEffect, useRef, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import type maplibregl from 'maplibre-gl'
import { along, length, flatten, lineString } from '@turf/turf'
import type { LineString, MultiLineString, Position } from 'geojson'

type ElevationPoint = {
  distanceM: number
  elevation: number
  coord: Position
}

// --- Mapterhorn Client & Bilinear DEM Sampler ---
const TILE_ZOOM = 13
const TILE_ENDPOINT = 'https://tiles.mapterhorn.com'
const TILE_SIZE = 512

let sharedCanvas: OffscreenCanvas | HTMLCanvasElement | null = null
let sharedCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null

function getSharedContext(width: number, height: number) {
  if (!sharedCanvas) {
    if (typeof OffscreenCanvas === 'function') {
      sharedCanvas = new OffscreenCanvas(width, height)
    } else {
      sharedCanvas = document.createElement('canvas')
      sharedCanvas.width = width
      sharedCanvas.height = height
    }
    sharedCtx = sharedCanvas.getContext('2d', { willReadFrequently: true }) as any
  } else {
    if (sharedCanvas.width !== width || sharedCanvas.height !== height) {
      sharedCanvas.width = width
      sharedCanvas.height = height
    }
  }
  return sharedCtx
}

function decodeTerrariumElevation(r: number, g: number, b: number): number {
  return r * 256 + g + b / 256 - 32768
}

function lonLatToTileSample(lng: number, lat: number, zoom: number) {
  const latitudeRadians = (lat * Math.PI) / 180
  const scale = 2 ** zoom
  const normalizedX = ((lng + 180) / 360) * scale
  const normalizedY =
    ((1 - Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) / 2) * scale

  const tileX = Math.floor(normalizedX)
  const tileY = Math.floor(normalizedY)

  return { tileX, tileY, normalizedX, normalizedY }
}

const tileCache = new Map<string, Promise<Float32Array>>()
const MAX_CACHE_SIZE = 64

function getTileData(tileX: number, tileY: number): Promise<Float32Array> {
  const key = `${tileX}/${tileY}`
  let promise = tileCache.get(key)
  if (!promise) {
    promise = loadTile(tileX, tileY).catch((err) => {
      tileCache.delete(key) // Evict on failure so we can retry later
      throw err
    })
    tileCache.set(key, promise)

    // FIFO Eviction
    if (tileCache.size > MAX_CACHE_SIZE) {
      const firstKey = tileCache.keys().next().value
      if (firstKey !== undefined) {
        tileCache.delete(firstKey)
      }
    }
  }
  return promise
}

async function loadTile(tileX: number, tileY: number): Promise<Float32Array> {
  const response = await fetch(`${TILE_ENDPOINT}/${TILE_ZOOM}/${tileX}/${tileY}.webp`)
  if (!response.ok) {
    throw new Error(`Failed to load tile: ${TILE_ZOOM}/${tileX}/${tileY} (Status: ${response.status})`)
  }
  const blob = await response.blob()

  let bitmap: ImageBitmap | HTMLImageElement
  if (typeof createImageBitmap === 'function') {
    // colorSpaceConversion: 'none' is crucial to prevent browser sRGB adjustments from altering raw pixels
    bitmap = await createImageBitmap(blob, { colorSpaceConversion: 'none' })
  } else {
    bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to decode tile image fallback'))
      img.src = URL.createObjectURL(blob)
    })
  }

  const width = bitmap.width
  const height = bitmap.height
  const ctx = getSharedContext(width, height)
  if (!ctx) {
    throw new Error('Failed to obtain shared canvas context')
  }

  // Draw & read are synchronous, executing atomically in the JS event loop
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(bitmap, 0, 0)
  const imgData = ctx.getImageData(0, 0, width, height).data

  // Release bitmap memory immediately
  if (typeof (bitmap as any).close === 'function') {
    ;(bitmap as ImageBitmap).close()
  } else if ('src' in bitmap) {
    URL.revokeObjectURL(bitmap.src)
  }

  // Pre-decode RGB raw bytes into Float32Array elevations to optimize CPU usage on queries/hovers
  const elevations = new Float32Array(width * height)
  for (let i = 0; i < elevations.length; i++) {
    const offset = i * 4
    const r = imgData[offset] ?? 0
    const g = imgData[offset + 1] ?? 0
    const b = imgData[offset + 2] ?? 0
    elevations[i] = decodeTerrariumElevation(r, g, b)
  }

  return elevations
}

function sampleBilinear(
  elevations: Float32Array,
  size: number,
  normalizedX: number,
  normalizedY: number,
  tileX: number,
  tileY: number
): number {
  const x = (normalizedX - tileX) * size
  const y = (normalizedY - tileY) * size

  const x0 = Math.floor(x)
  const y0 = Math.floor(y)

  const x1 = x0 + 1
  const y1 = y0 + 1

  // Clamp indices to [0, size - 1] to prevent out-of-bounds access at tile boundaries
  const cx0 = Math.max(0, Math.min(size - 1, x0))
  const cy0 = Math.max(0, Math.min(size - 1, y0))
  const cx1 = Math.max(0, Math.min(size - 1, x1))
  const cy1 = Math.max(0, Math.min(size - 1, y1))

  const dx = x - x0
  const dy = y - y0

  const e00 = elevations[cy0 * size + cx0] ?? 0
  const e10 = elevations[cy0 * size + cx1] ?? 0
  const e01 = elevations[cy1 * size + cx0] ?? 0
  const e11 = elevations[cy1 * size + cx1] ?? 0

  const top = e00 * (1 - dx) + e10 * dx
  const bottom = e01 * (1 - dx) + e11 * dx
  return top * (1 - dy) + bottom * dy
}

async function fetchElevationsFromMapterhorn(coords: Position[]): Promise<(number | null)[]> {
  try {
    const tileKeys = new Set<string>()
    const coordTiles = coords.map((c) => {
      const { tileX, tileY, normalizedX, normalizedY } = lonLatToTileSample(c[0]!, c[1]!, TILE_ZOOM)
      tileKeys.add(`${tileX}/${tileY}`)
      return { tileX, tileY, normalizedX, normalizedY }
    })

    // Load all required tiles concurrently. Any load failure triggers path-wide fallback.
    const tilePromises = Array.from(tileKeys).map(async (key) => {
      const [tx, ty] = key.split('/').map(Number)
      const elevations = await getTileData(tx!, ty!)
      return { key, elevations }
    })

    const loadedTiles = await Promise.all(tilePromises)
    const tileMap = new Map<string, Float32Array>()
    for (const tile of loadedTiles) {
      tileMap.set(tile.key, tile.elevations)
    }

    const results: number[] = []
    for (const item of coordTiles) {
      const elevations = tileMap.get(`${item.tileX}/${item.tileY}`)
      if (!elevations) {
        throw new Error('Tile elevations not available in map')
      }
      const val = sampleBilinear(elevations, TILE_SIZE, item.normalizedX, item.normalizedY, item.tileX, item.tileY)
      // Void value check
      if (val <= -500) {
        throw new Error(`Invalid/extreme elevation value encountered: ${val}`)
      }
      results.push(val)
    }

    return results
  } catch (err) {
    console.warn('Mapterhorn sampling failed, falling back to Open-Meteo:', err)
    throw err
  }
}

// Extract and merge coordinates sequentially for LineString and MultiLineString
function extractCoordinates(geometry: LineString | MultiLineString): Position[] {
  if (geometry.type === 'LineString') {
    return geometry.coordinates
  }

  if (geometry.type === 'MultiLineString') {
    const flattened = flatten(geometry)
    const coordinatesList: Position[][] = []

    for (const feat of flattened.features) {
      if (feat.geometry.type === 'LineString') {
        coordinatesList.push(feat.geometry.coordinates)
      }
    }

    return coordinatesList.flat()
  }

  return []
}

// Gaussian smoothing to reduce DEM artifacts (buildings, bridges, infrastructure)
// The Open-Meteo API uses SRTM/Copernicus DEM (~30m resolution) which produces
// noise and artifacts, especially in urban areas with elevated structures.
function smoothElevations(elevations: number[], passes: number = 3): number[] {
  if (elevations.length < 3) return elevations

  let smoothed = [...elevations]

  for (let pass = 0; pass < passes; pass++) {
    const next = [...smoothed]
    for (let i = 1; i < smoothed.length - 1; i++) {
      const prev = smoothed[i - 1]!
      const curr = smoothed[i]!
      const nxt = smoothed[i + 1]!
      // Weighted average: 25% prev, 50% current, 25% next
      next[i] = prev * 0.25 + curr * 0.5 + nxt * 0.25
    }
    smoothed = next
  }

  return smoothed
}

// Chunked parallel requests to prevent HTTP 414 URI Too Long
async function fetchElevationsFromApi(coords: Position[]): Promise<(number | null)[]> {
  const chunkSize = 80
  const chunks: Position[][] = []
  for (let i = 0; i < coords.length; i += chunkSize) {
    chunks.push(coords.slice(i, i + chunkSize))
  }

  try {
    const requests = chunks.map(async (chunk) => {
      const lats = chunk.map((c) => c[1]).join(',')
      const lngs = chunk.map((c) => c[0]).join(',')
      const response = await fetch(
        `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`,
      )
      if (!response.ok) {
        throw new Error(`Open-Meteo API returned status ${response.status}`)
      }
      const data = await response.json()
      return data.elevation as number[]
    })

    const results = await Promise.all(requests)
    return results.flat()
  } catch (error) {
    console.error('Error fetching elevations from fallback API:', error)
    return coords.map(() => null)
  }
}

export const InspectorFeatureElevationProfile = ({ feature }: { feature: maplibregl.MapGeoJSONFeature }) => {
  const { mainMap } = useMap()
  const containerRef = useRef<HTMLDivElement>(null)

  const [dimensions, setDimensions] = useState({ width: 300, height: 140 })
  const [elevationData, setElevationData] = useState<ElevationPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [hoveredPoint, setHoveredPoint] = useState<ElevationPoint | null>(null)

  const { geometry } = feature
  const isLine = geometry && (geometry.type === 'LineString' || geometry.type === 'MultiLineString')

  // 1. Setup ResizeObserver for responsive SVG dimensions
  useEffect(() => {
    if (!isLine || !containerRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return
      const { width, height } = entries[0].contentRect
      setDimensions({ width: width || 300, height: height || 140 })
    })
    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [isLine])

  // 2. Process geometry, perform dynamic sampling, and fetch elevation values
  // Strategy: Always use Open-Meteo API as primary source because
  // queryTerrainElevation returns 0 (not null) for off-viewport coordinates,
  // making it unreliable for paths that extend beyond the visible map area.
  useEffect(() => {
    if (!isLine || !mainMap) return

    let active = true
    const coordinates = extractCoordinates(geometry)
    if (coordinates.length < 2) return

    setLoading(true)

    // Build consolidated Turf LineString
    const line = lineString(coordinates)
    const totalLengthKm = length(line, { units: 'kilometers' })
    const totalLengthM = totalLengthKm * 1000

    // Dynamic distance-based step sampling (min 10m, max 100m, target ~150 points)
    const stepM = Math.max(10, Math.min(100, totalLengthM / 150))
    const stepKm = stepM / 1000

    const sampled: ElevationPoint[] = []
    let currentDistKm = 0

    while (currentDistKm < totalLengthKm) {
      const p = along(line, currentDistKm, { units: 'kilometers' })
      sampled.push({
        distanceM: Math.round(currentDistKm * 1000),
        elevation: 0,
        coord: p.geometry.coordinates,
      })
      currentDistKm += stepKm
    }

    // Always add the precise end vertex of the line
    const endPoint = along(line, totalLengthKm, { units: 'kilometers' })
    sampled.push({
      distanceM: Math.round(totalLengthM),
      elevation: 0,
      coord: endPoint.geometry.coordinates,
    })

    // Primary: Fetch elevations from Mapterhorn client-side tiles
    const coords = sampled.map((s) => s.coord)
    fetchElevationsFromMapterhorn(coords)
      .then((maptElevations) => {
        if (!active) return

        // Apply Gaussian smoothing to round off pixel grid boundaries
        const smoothed = smoothElevations(maptElevations as number[])

        const finalData = sampled.map((s, idx) => ({
          ...s,
          elevation: smoothed[idx] ?? 0,
        }))
        setElevationData(finalData)
        setLoading(false)
      })
      .catch((err) => {
        // Fallback: Fetch ALL coordinates from Open-Meteo API for relative path continuity
        console.warn('Mapterhorn sampling failed, using Open-Meteo fallback:', err)
        if (!active) return

        fetchElevationsFromApi(coords)
          .then((apiElevations) => {
            if (!active) return

            const hasValidApiData = apiElevations.some((el) => el !== null)
            const rawElevations = sampled.map((_, idx) => apiElevations[idx] ?? 0)
            const smoothed = smoothElevations(rawElevations)

            const finalData = sampled.map((s, idx) => ({
              ...s,
              elevation: smoothed[idx] ?? 0,
            }))
            setElevationData(finalData)
            setLoading(false)
          })
          .catch((err2) => {
            console.error('All elevation sources failed, falling back to local terrain:', err2)
            if (!active) return

            // Last resort: local terrain
            const mapInstance = mainMap.getMap()
            const localElevations = sampled.map((s) => {
              if (mapInstance && typeof mapInstance.queryTerrainElevation === 'function') {
                const el = mapInstance.queryTerrainElevation(s.coord as [number, number])
                return el !== null && el !== undefined ? el : 0
              }
              return 0
            })

            const smoothed = smoothElevations(localElevations as number[])
            const finalData = sampled.map((s, idx) => ({
              ...s,
              elevation: smoothed[idx] ?? 0,
            }))
            setElevationData(finalData)
            setLoading(false)
          })
      })

    return () => {
      active = false
    }
  }, [isLine, mainMap, geometry])

  if (!isLine) {
    return null
  }

  if (elevationData.length === 0) {
    return loading ? (
      <div className="flex h-32 items-center justify-center rounded-lg border border-gray-100 bg-gray-50/50">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <span className="ml-2 text-xs text-gray-500">Lade Höhenmodell...</span>
      </div>
    ) : null
  }

  // --- SVG Scaling & Math ---
  const padLeft = 32
  const padRight = 12
  const padTop = 16
  const padBottom = 20

  const width = dimensions.width
  const height = dimensions.height

  const chartW = width - padLeft - padRight
  const chartH = height - padTop - padBottom

  const distances = elevationData.map((d) => d.distanceM)
  const elevationsList = elevationData.map((d) => d.elevation)

  const _minX = 0
  const maxX = Math.max(...distances, 1)

  const minElev = Math.min(...elevationsList)
  const maxElev = Math.max(...elevationsList)

  const diffY = maxElev - minElev
  const paddingY = Math.max(4, diffY * 0.1)
  const minY = Math.max(0, minElev - paddingY)
  const maxY = maxElev + paddingY

  const scaleX = (val: number) => padLeft + (val / maxX) * chartW
  const scaleY = (val: number) => height - padBottom - ((val - minY) / (maxY - minY)) * chartH

  // Build line & area path strings
  const linePath = elevationData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.distanceM)} ${scaleY(d.elevation)}`)
    .join(' ')

  const bottomY = height - padBottom
  const areaPath = `
    M ${scaleX(0)} ${bottomY}
    ${elevationData.map((d) => `L ${scaleX(d.distanceM)} ${scaleY(d.elevation)}`).join(' ')}
    L ${scaleX(maxX)} ${bottomY}
    Z
  `

  // Statistics calculation
  let climb = 0
  let descent = 0
  for (let i = 1; i < elevationData.length; i++) {
    const current = elevationData[i]
    const prev = elevationData[i - 1]
    if (current && prev) {
      const diff = current.elevation - prev.elevation
      if (diff > 0) climb += diff
      else descent += Math.abs(diff)
    }
  }

  // Mouse & Touch interaction (chart-only, no map marker)
  const handleMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || elevationData.length === 0) return

    const rect = containerRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0]?.clientX : (e as React.MouseEvent).clientX
    if (clientX === undefined) return
    const xRel = clientX - rect.left

    const pct = (xRel - padLeft) / chartW
    const targetDistance = Math.max(0, Math.min(1, pct)) * maxX

    const firstPoint = elevationData[0]
    if (!firstPoint) return

    let closest: ElevationPoint = firstPoint
    let minDiff = Math.abs(firstPoint.distanceM - targetDistance)

    for (const pt of elevationData) {
      const diff = Math.abs(pt.distanceM - targetDistance)
      if (diff < minDiff) {
        minDiff = diff
        closest = pt
      }
    }

    setHoveredPoint(closest)
  }

  const handleLeave = () => {
    setHoveredPoint(null)
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-gray-200 bg-gray-50/30 p-3">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Hover tracking on container */}
      <div
        ref={containerRef}
        className="relative h-[140px] w-full cursor-crosshair select-none"
        onMouseMove={handleMove}
        onTouchMove={handleMove}
        onMouseLeave={handleLeave}
        onTouchEnd={handleLeave}
      >
        <svg width={width} height={height} className="overflow-visible" role="img" aria-label="Höhenprofil Grafik">
          <title>Höhenprofil des ausgewählten Weges</title>
          <defs>
            <linearGradient id="elevation-area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[minY + (maxY - minY) * 0.25, minY + (maxY - minY) * 0.75].map((yVal) => (
            <line
              key={`grid-line-${yVal}`}
              x1={padLeft}
              y1={scaleY(yVal)}
              x2={width - padRight}
              y2={scaleY(yVal)}
              className="stroke-gray-200/60"
              strokeDasharray="2 3"
            />
          ))}

          {/* Y Axis Labels */}
          <text
            x={padLeft - 6}
            y={scaleY(minElev) + 4}
            className="fill-gray-400 text-[10px]"
            textAnchor="end"
          >
            {Math.round(minElev)} m
          </text>
          <text
            x={padLeft - 6}
            y={scaleY(maxElev) + 4}
            className="fill-gray-400 text-[10px]"
            textAnchor="end"
          >
            {Math.round(maxElev)} m
          </text>

          {/* Area Path */}
          <path d={areaPath} fill="url(#elevation-area-gradient)" />

          {/* Line Path */}
          <path d={linePath} fill="none" className="stroke-blue-500" strokeWidth="2" />

          {/* X Axis Labels */}
          <text
            x={scaleX(0)}
            y={height - 4}
            className="fill-gray-400 text-[10px]"
            textAnchor="start"
          >
            0 m
          </text>
          <text
            x={scaleX(maxX)}
            y={height - 4}
            className="fill-gray-400 text-[10px]"
            textAnchor="end"
          >
            {maxX >= 1000 ? `${(maxX / 1000).toFixed(1)} km` : `${Math.round(maxX)} m`}
          </text>

          {/* Hover Guides */}
          {hoveredPoint && (
            <>
              <line
                x1={scaleX(hoveredPoint.distanceM)}
                y1={padTop}
                x2={scaleX(hoveredPoint.distanceM)}
                y2={height - padBottom}
                className="stroke-blue-400"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={scaleX(hoveredPoint.distanceM)}
                cy={scaleY(hoveredPoint.elevation)}
                r="4"
                className="fill-blue-600 stroke-white"
                strokeWidth="1.5"
              />
            </>
          )}
        </svg>

        {/* Hover info tooltip */}
        {hoveredPoint && (
          <div className="pointer-events-none absolute top-1.5 left-9 rounded bg-gray-900/95 px-2 py-1 text-[10px] font-medium text-white shadow-md">
            Distanz:{' '}
            {hoveredPoint.distanceM >= 1000
              ? `${(hoveredPoint.distanceM / 1000).toFixed(2)} km`
              : `${hoveredPoint.distanceM} m`}{' '}
            | Höhe: {hoveredPoint.elevation.toFixed(1)} m
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-gray-100 pt-2.5 text-[11px] text-gray-500">
        <div className="flex justify-between">
          <span>Min. Höhe:</span>
          <span className="font-semibold text-gray-700">{minElev.toFixed(1)} m</span>
        </div>
        <div className="flex justify-between">
          <span>Max. Höhe:</span>
          <span className="font-semibold text-gray-700">{maxElev.toFixed(1)} m</span>
        </div>
        <div className="flex justify-between">
          <span>Steigung (Aufstieg):</span>
          <span className="font-semibold text-green-600">+{climb.toFixed(1)} m</span>
        </div>
        <div className="flex justify-between">
          <span>Gefälle (Abstieg):</span>
          <span className="font-semibold text-red-500">-{descent.toFixed(1)} m</span>
        </div>
      </div>
    </div>
  )
}
