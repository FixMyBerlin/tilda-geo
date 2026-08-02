import { describe, expect, it } from 'vitest'
import type { TerrainProfileLine } from '../types'
import {
  lineAxisProjection,
  pointAxisMeters,
  resolveTerrainProfileOrientation,
  shouldReverseLineForChartAxis,
} from './orderTerrainProfileLines'

const westEastLine = {
  type: 'LineString',
  coordinates: [
    [13.0, 52.5],
    [13.2, 52.51],
  ],
} satisfies TerrainProfileLine

const southNorthLine = {
  type: 'LineString',
  coordinates: [
    [13.1, 52.4],
    [13.11, 52.6],
  ],
} satisfies TerrainProfileLine

const eastToWestLine = {
  type: 'LineString',
  coordinates: [
    [13.2, 52.5],
    [13.0, 52.5],
  ],
} satisfies TerrainProfileLine

const northToSouthLine = {
  type: 'LineString',
  coordinates: [
    [13.1, 52.6],
    [13.11, 52.4],
  ],
} satisfies TerrainProfileLine

describe('orderTerrainProfileLines', () => {
  it('picks west-east when ways travel mostly east-west', () => {
    expect(resolveTerrainProfileOrientation([westEastLine])).toBe('west-east')
  })

  it('picks south-north when ways travel mostly north-south', () => {
    expect(resolveTerrainProfileOrientation([southNorthLine])).toBe('south-north')
  })

  it('keeps along-street axis for parallel ways even when bbox is wider than tall', () => {
    // ~44 m north run, ~54 m lateral offset → bbox would prefer west-east
    const left = {
      type: 'LineString',
      coordinates: [
        [13.0, 52.5],
        [13.0, 52.5004],
      ],
    } satisfies TerrainProfileLine
    const right = {
      type: 'LineString',
      coordinates: [
        [13.0008, 52.5],
        [13.0008, 52.5004],
      ],
    } satisfies TerrainProfileLine
    expect(resolveTerrainProfileOrientation([left, right])).toBe('south-north')
  })

  it('orders mid projection west to east', () => {
    const western = {
      type: 'LineString',
      coordinates: [
        [13.0, 52.5],
        [13.05, 52.5],
      ],
    } satisfies TerrainProfileLine
    const eastern = {
      type: 'LineString',
      coordinates: [
        [13.2, 52.5],
        [13.25, 52.5],
      ],
    } satisfies TerrainProfileLine
    expect(lineAxisProjection(western, 'west-east').mid).toBeLessThan(
      lineAxisProjection(eastern, 'west-east').mid,
    )
  })

  it('reverses ways that run against west→east chart direction', () => {
    expect(shouldReverseLineForChartAxis(westEastLine, 'west-east')).toBe(false)
    expect(shouldReverseLineForChartAxis(eastToWestLine, 'west-east')).toBe(true)
  })

  it('reverses ways that run against south→north chart direction', () => {
    expect(shouldReverseLineForChartAxis(southNorthLine, 'south-north')).toBe(false)
    expect(shouldReverseLineForChartAxis(northToSouthLine, 'south-north')).toBe(true)
  })

  it('places western points left of eastern points on the chart axis', () => {
    const referenceLat = 52.5
    const west = pointAxisMeters(13.0, 52.5, 'west-east', referenceLat)
    const east = pointAxisMeters(13.2, 52.5, 'west-east', referenceLat)
    expect(west).toBeLessThan(east)
  })
})
