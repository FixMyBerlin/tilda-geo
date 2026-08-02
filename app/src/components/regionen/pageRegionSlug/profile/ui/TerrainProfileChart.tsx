import { useRef } from 'react'
import { useTerrainProfileHoverActions } from '../state/terrain-profile-hover-store'
import type { TerrainProfileData } from '../types'

type Props = {
  profile: TerrainProfileData
}

const CHART_HEIGHT = 120
const CHART_PADDING = { top: 8, right: 8, bottom: 20, left: 36 }

export const TerrainProfileChart = ({ profile }: Props) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const { setHoverSampleIndex, clearHoverSampleIndex } = useTerrainProfileHoverActions()
  const { samples, stats } = profile

  if (samples.length < 2) return null

  const width = 320
  const innerWidth = width - CHART_PADDING.left - CHART_PADDING.right
  const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom
  const elevationRange = Math.max(1, stats.maxElevationMeters - stats.minElevationMeters)
  const maxDistance = samples[samples.length - 1]?.distanceMeters ?? 1

  const points = samples
    .map((sample) => {
      const x = CHART_PADDING.left + (sample.distanceMeters / maxDistance) * innerWidth
      const y =
        CHART_PADDING.top +
        innerHeight -
        ((sample.elevationMeters - stats.minElevationMeters) / elevationRange) * innerHeight
      return `${x},${y}`
    })
    .join(' ')

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const relativeX = event.clientX - rect.left - CHART_PADDING.left
    const ratio = Math.min(1, Math.max(0, relativeX / innerWidth))
    const targetDistance = ratio * maxDistance

    let closestIndex = 0
    let closestDistance = Number.POSITIVE_INFINITY
    for (const [index, sample] of samples.entries()) {
      const delta = Math.abs(sample.distanceMeters - targetDistance)
      if (delta < closestDistance) {
        closestDistance = delta
        closestIndex = index
      }
    }

    setHoverSampleIndex(closestIndex)
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
      className="h-32 w-full touch-none"
      role="img"
      aria-label="Höhenprofil"
      onPointerMove={handlePointerMove}
      onPointerLeave={clearHoverSampleIndex}
    >
      <polyline fill="none" stroke="#ca8a04" strokeWidth="2" points={points} />
      <line
        x1={CHART_PADDING.left}
        y1={CHART_PADDING.top + innerHeight}
        x2={CHART_PADDING.left + innerWidth}
        y2={CHART_PADDING.top + innerHeight}
        stroke="#d1d5db"
      />
      <text x={CHART_PADDING.left} y={CHART_HEIGHT - 4} className="fill-gray-500 text-[10px]">
        0 m
      </text>
      <text
        x={CHART_PADDING.left + innerWidth}
        y={CHART_HEIGHT - 4}
        textAnchor="end"
        className="fill-gray-500 text-[10px]"
      >
        {stats.distanceMeters.toFixed(0)} m
      </text>
      <text x={4} y={CHART_PADDING.top + 8} className="fill-gray-500 text-[10px]">
        {stats.maxElevationMeters.toFixed(0)} m
      </text>
      <text x={4} y={CHART_PADDING.top + innerHeight} className="fill-gray-500 text-[10px]">
        {stats.minElevationMeters.toFixed(0)} m
      </text>
    </svg>
  )
}
