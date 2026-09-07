import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { chartAxisDirectionLabel } from '../compose/orderTerrainProfileLines'
import {
  useTerrainProfileHoverActions,
  useTerrainProfileHoverActiveFeatureKeys,
  useTerrainProfileHoverChartDistanceMeters,
  useTerrainProfileHoverPoints,
} from '../state/terrain-profile-hover-store'
import type { CombinedTerrainProfileData, TerrainProfileChartSample } from '../types'

/** Split samples into solid (DEM) vs dashed (bridge/tunnel) polyline runs. */
const splitProfilePolylineRuns = (samples: TerrainProfileChartSample[]) => {
  if (samples.length < 2) return []

  type Run = { dashed: boolean; samples: TerrainProfileChartSample[] }
  const runs: Run[] = []
  let current: Run | null = null

  for (let index = 0; index < samples.length - 1; index += 1) {
    const left = samples[index]!
    const right = samples[index + 1]!
    const dashed = left.source === 'interpolated' || right.source === 'interpolated'

    if (!current || current.dashed !== dashed) {
      current = { dashed, samples: [left, right] }
      runs.push(current)
      continue
    }
    current.samples.push(right)
  }

  return runs
}

type Props = {
  profile: CombinedTerrainProfileData
}

const CHART_HEIGHT = 160
const CHART_PADDING = { top: 28, right: 14, bottom: 32, left: 40 }
const AXIS_STROKE = '#d1d5db' // gray-300 — same as Höhenprofil disclosure border
const GRID_STROKE = '#e5e7eb' // gray-200
/** Ways within this axis distance count as parallel at the cursor. */
const PARALLEL_AXIS_TOLERANCE_METERS = 15

const formatMeters = (meters: number) =>
  meters >= 10 ? `${meters.toFixed(0)} m` : `${meters.toFixed(1)} m`

const formatElevationRange = (elevations: number[]) => {
  const min = Math.min(...elevations)
  const max = Math.max(...elevations)
  if (Math.abs(max - min) < 0.05) return formatMeters(min)
  return `${formatMeters(min)}–${formatMeters(max)}`
}

const niceStep = (range: number, targetTicks: number) => {
  if (range <= 0) return 1
  const rough = range / targetTicks
  const power = 10 ** Math.floor(Math.log10(rough))
  const normalized = rough / power
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * power
}

const buildTicks = (min: number, max: number, targetTicks: number) => {
  const step = niceStep(max - min, targetTicks)
  const first = Math.ceil(min / step) * step
  const ticks: number[] = []
  for (let value = first; value <= max + step * 0.001; value += step) {
    ticks.push(value)
  }
  if (ticks.length === 0) ticks.push(min, max)
  return ticks
}

const closestSampleOnSeries = (samples: TerrainProfileChartSample[], targetDistance: number) => {
  let closestIndex = 0
  let closestDistance = Number.POSITIVE_INFINITY
  for (const [index, sample] of samples.entries()) {
    const delta = Math.abs(sample.chartDistanceMeters - targetDistance)
    if (delta < closestDistance) {
      closestDistance = delta
      closestIndex = index
    }
  }
  return { index: closestIndex, sample: samples[closestIndex]!, delta: closestDistance }
}

/** Linear interpolate lng/lat/elevation at an exact chart-axis position (no sample snap). */
const interpolateSeriesAtChartDistance = (
  samples: TerrainProfileChartSample[],
  targetDistance: number,
) => {
  const first = samples[0]
  const last = samples[samples.length - 1]
  if (!first || !last) return null

  if (targetDistance <= first.chartDistanceMeters) {
    return {
      index: 0,
      lng: first.lng,
      lat: first.lat,
      elevationMeters: first.elevationMeters,
      chartDistanceMeters: targetDistance,
    }
  }
  if (targetDistance >= last.chartDistanceMeters) {
    return {
      index: samples.length - 1,
      lng: last.lng,
      lat: last.lat,
      elevationMeters: last.elevationMeters,
      chartDistanceMeters: targetDistance,
    }
  }

  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]!
    const next = samples[index]!
    if (targetDistance > next.chartDistanceMeters) continue
    const span = next.chartDistanceMeters - previous.chartDistanceMeters
    const t = span <= 0 ? 0 : (targetDistance - previous.chartDistanceMeters) / span
    return {
      index,
      lng: previous.lng + (next.lng - previous.lng) * t,
      lat: previous.lat + (next.lat - previous.lat) * t,
      elevationMeters:
        previous.elevationMeters + (next.elevationMeters - previous.elevationMeters) * t,
      chartDistanceMeters: targetDistance,
    }
  }

  return null
}

export const TerrainProfileChart = ({ profile }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [width, setWidth] = useState(0)
  const hoverPoints = useTerrainProfileHoverPoints()
  const hoverChartDistanceMeters = useTerrainProfileHoverChartDistanceMeters()
  const activeFeatureKeys = useTerrainProfileHoverActiveFeatureKeys()
  const { setHoverSamples, clearHoverSample } = useTerrainProfileHoverActions()
  const { series, stats, totalChartDistanceMeters, orientation } = profile
  const activeKeySet = new Set(activeFeatureKeys)
  const hasHover = hoverPoints.length > 0

  useEffect(function observeChartWidth() {
    const container = containerRef.current
    if (!container) return

    const updateWidth = () => {
      setWidth(Math.floor(container.clientWidth))
    }
    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const hasDrawableSeries = series.some((entry) => entry.samples.length >= 2)
  const minChartWidth = CHART_PADDING.left + CHART_PADDING.right + 1
  if (!hasDrawableSeries || width < minChartWidth) {
    return <div ref={containerRef} className="w-full" />
  }

  const plotLeft = CHART_PADDING.left
  const plotTop = CHART_PADDING.top
  const plotRight = width - CHART_PADDING.right
  const plotBottom = CHART_HEIGHT - CHART_PADDING.bottom
  const innerWidth = plotRight - plotLeft
  const innerHeight = plotBottom - plotTop
  const elevationMin = stats.minElevationMeters
  const elevationMax = stats.maxElevationMeters
  const elevationRange = Math.max(1, elevationMax - elevationMin)
  const yPadding = elevationRange * 0.08
  const yMin = elevationMin - yPadding
  const yMax = elevationMax + yPadding
  const yRange = Math.max(1, yMax - yMin)
  const maxDistance = Math.max(1, totalChartDistanceMeters)

  const chartDistanceToPoint = (chartDistanceMeters: number, elevationMeters: number) => {
    const x = plotLeft + (chartDistanceMeters / maxDistance) * innerWidth
    const y = plotBottom - ((elevationMeters - yMin) / yRange) * innerHeight
    return { x, y }
  }

  const xTicks = buildTicks(0, maxDistance, 4)
  const yTicks = buildTicks(yMin, yMax, 3)

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const scaleX = width / rect.width
    const xInViewBox = (event.clientX - rect.left) * scaleX
    const relativeX = xInViewBox - plotLeft
    const ratio = Math.min(1, Math.max(0, relativeX / innerWidth))
    const targetDistance = ratio * maxDistance

    const perSeries = series.flatMap((entry) => {
      if (entry.samples.length === 0) return []
      const first = entry.samples[0]!
      const last = entry.samples[entry.samples.length - 1]!
      const spanMin = first.chartDistanceMeters - PARALLEL_AXIS_TOLERANCE_METERS
      const spanMax = last.chartDistanceMeters + PARALLEL_AXIS_TOLERANCE_METERS
      if (targetDistance < spanMin || targetDistance > spanMax) return []

      const interpolated = interpolateSeriesAtChartDistance(entry.samples, targetDistance)
      if (!interpolated) return []
      return [{ featureKey: entry.featureKey, ...interpolated }]
    })
    if (perSeries.length === 0) {
      // Still allow a read-out when the cursor is only near a short stub: fall back to closest.
      const fallback = series.flatMap((entry) => {
        if (entry.samples.length === 0) return []
        const closest = closestSampleOnSeries(entry.samples, targetDistance)
        if (closest.delta > PARALLEL_AXIS_TOLERANCE_METERS) return []
        const interpolated = interpolateSeriesAtChartDistance(entry.samples, targetDistance)
        if (!interpolated) return []
        return [{ featureKey: entry.featureKey, ...interpolated }]
      })
      if (fallback.length === 0) {
        clearHoverSample()
        return
      }
      setHoverSamples({
        chartDistanceMeters: targetDistance,
        points: fallback,
      })
      return
    }

    setHoverSamples({
      chartDistanceMeters: targetDistance,
      points: perSeries,
    })
  }

  const hoverGuideX =
    hoverChartDistanceMeters === null
      ? null
      : plotLeft + (hoverChartDistanceMeters / maxDistance) * innerWidth

  return (
    <div ref={containerRef} className="w-full space-y-2">
      {series.length > 1 && (
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600">
          {series.map((entry) => {
            const isDimmed = hasHover && !activeKeySet.has(entry.featureKey)
            return (
              <li
                key={entry.featureKey}
                className={`inline-flex items-center gap-1.5 transition-opacity ${isDimmed ? 'opacity-35' : 'opacity-100'}`}
              >
                <span
                  className="inline-block h-0.5 w-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                  aria-hidden
                />
                <span className="truncate">{entry.label}</span>
              </li>
            )
          })}
        </ul>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
        width="100%"
        height={CHART_HEIGHT}
        className="touch-none"
        role="img"
        aria-label="Höhenprofil"
        onPointerMove={handlePointerMove}
        onPointerLeave={clearHoverSample}
      >
        <text x={plotRight} y={12} textAnchor="end" className="fill-gray-600 text-[10px]">
          ↑ {formatMeters(stats.ascentMeters)} · ↓ {formatMeters(stats.descentMeters)}
        </text>

        {xTicks.map((tick) => {
          const x = plotLeft + (tick / maxDistance) * innerWidth
          return (
            <g key={`x-${tick}`}>
              <line
                x1={x}
                y1={plotTop}
                x2={x}
                y2={plotBottom}
                stroke={GRID_STROKE}
                strokeWidth="1"
              />
              <text
                x={x}
                y={CHART_HEIGHT - 6}
                textAnchor="middle"
                className="fill-gray-500 text-[9px]"
              >
                {formatMeters(tick)}
              </text>
            </g>
          )
        })}

        {yTicks.map((tick) => {
          const y = plotBottom - ((tick - yMin) / yRange) * innerHeight
          return (
            <g key={`y-${tick}`}>
              <line
                x1={plotLeft}
                y1={y}
                x2={plotRight}
                y2={y}
                stroke={GRID_STROKE}
                strokeWidth="1"
              />
              <text
                x={plotLeft - 4}
                y={y + 3}
                textAnchor="end"
                className="fill-gray-500 text-[9px]"
              >
                {formatMeters(tick)}
              </text>
            </g>
          )
        })}

        <rect
          x={plotLeft}
          y={plotTop}
          width={innerWidth}
          height={innerHeight}
          fill="none"
          stroke={AXIS_STROKE}
          strokeWidth="1"
        />

        {[...series]
          .sort((left, right) => {
            if (!hasHover) return 0
            const leftActive = activeKeySet.has(left.featureKey)
            const rightActive = activeKeySet.has(right.featureKey)
            if (leftActive === rightActive) return 0
            return leftActive ? 1 : -1
          })
          .map((entry) => {
            if (entry.samples.length < 2) return null
            const isDimmed = hasHover && !activeKeySet.has(entry.featureKey)
            const stroke = isDimmed ? '#d1d5db' : entry.color
            const opacity = isDimmed ? 0.55 : 1
            const plotPoints = entry.samples.map((sample) =>
              chartDistanceToPoint(sample.chartDistanceMeters, sample.elevationMeters),
            )
            const runs = splitProfilePolylineRuns(entry.samples)
            const maxMidDots = 18
            const midStep = Math.max(1, Math.ceil((plotPoints.length - 2) / maxMidDots))
            const dotIndexes = new Set<number>([0, plotPoints.length - 1])
            for (let index = midStep; index < plotPoints.length - 1; index += midStep) {
              dotIndexes.add(index)
            }

            return (
              <g key={entry.featureKey} opacity={opacity}>
                {runs.map((run, runIndex) => {
                  const points = run.samples
                    .map((sample) =>
                      chartDistanceToPoint(sample.chartDistanceMeters, sample.elevationMeters),
                    )
                    .map(({ x, y }) => `${x},${y}`)
                    .join(' ')
                  return (
                    <polyline
                      key={`${entry.featureKey}-run-${runIndex}`}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={isDimmed ? 1.5 : 2.5}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeDasharray={run.dashed ? '5 4' : undefined}
                      points={points}
                    />
                  )
                })}
                {[...dotIndexes].map((index) => {
                  const point = plotPoints[index]
                  if (!point) return null
                  const isEnd = index === 0 || index === plotPoints.length - 1
                  return (
                    <circle
                      key={`${entry.featureKey}-dot-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r={isEnd ? 3 : 2}
                      fill={stroke}
                      stroke="#ffffff"
                      strokeWidth={isEnd ? 1.5 : 1}
                    />
                  )
                })}
              </g>
            )
          })}

        <text
          x={(plotLeft + plotRight) / 2}
          y={CHART_HEIGHT - 18}
          textAnchor="middle"
          className="fill-gray-500 text-[9px]"
        >
          {chartAxisDirectionLabel(orientation)}
        </text>

        {hasHover && hoverGuideX !== null && (
          <>
            <line
              x1={hoverGuideX}
              y1={plotTop}
              x2={hoverGuideX}
              y2={plotBottom}
              stroke={AXIS_STROKE}
              strokeWidth="1"
              strokeOpacity="0.55"
            />
            {hoverPoints.map((point) => {
              // X follows the cursor; Y follows the interpolated elevation on that way.
              const y = chartDistanceToPoint(
                hoverChartDistanceMeters ?? point.chartDistanceMeters,
                point.elevationMeters,
              ).y
              return (
                <g key={`hover-${point.featureKey}`}>
                  <line
                    x1={plotLeft}
                    y1={y}
                    x2={plotRight}
                    y2={y}
                    stroke={AXIS_STROKE}
                    strokeWidth="1"
                    strokeOpacity="0.25"
                    strokeDasharray="3 3"
                  />
                  {/* Same as sample dots: dark fill + white border */}
                  <circle
                    cx={hoverGuideX}
                    cy={y}
                    r="2.5"
                    fill="#111827"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  {/* Active position ring */}
                  <circle
                    cx={hoverGuideX}
                    cy={y}
                    r="5"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="1.5"
                  />
                </g>
              )
            })}
            <text
              x={Math.min(plotRight - 4, hoverGuideX + 6)}
              y={plotTop + 12}
              className="fill-gray-900 text-[10px] font-medium"
            >
              {formatElevationRange(hoverPoints.map((point) => point.elevationMeters))}
            </text>
          </>
        )}
      </svg>
    </div>
  )
}
