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

    // Primary: Fetch elevations from Open-Meteo API (always reliable)
    const coords = sampled.map((s) => s.coord)
    fetchElevationsFromApi(coords)
      .then((apiElevations) => {
        if (!active) return

        // Check if API returned valid (non-null) values
        const hasValidApiData = apiElevations.some((el) => el !== null)

        if (hasValidApiData) {
          // Apply Gaussian smoothing to reduce DEM artifacts
          const rawElevations = sampled.map((_, idx) => apiElevations[idx] ?? 0)
          const smoothed = smoothElevations(rawElevations)

          const finalData = sampled.map((s, idx) => ({
            ...s,
            elevation: smoothed[idx] ?? 0,
          }))
          setElevationData(finalData)
          setLoading(false)
        } else {
          // Fallback: Try local terrain if API completely failed
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
        }
      })
      .catch((err) => {
        console.error('Elevation API failed, falling back to local terrain:', err)
        if (!active) return

        // Fallback: Use local terrain
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
          <span className="font-semibold text-gray-700">{Math.round(minElev)} m</span>
        </div>
        <div className="flex justify-between">
          <span>Max. Höhe:</span>
          <span className="font-semibold text-gray-700">{Math.round(maxElev)} m</span>
        </div>
        <div className="flex justify-between">
          <span>Steigung (Aufstieg):</span>
          <span className="font-semibold text-green-600">+{Math.round(climb)} m</span>
        </div>
        <div className="flex justify-between">
          <span>Gefälle (Abstieg):</span>
          <span className="font-semibold text-red-500">-{Math.round(descent)} m</span>
        </div>
      </div>
    </div>
  )
}
