import { describe, expect, it } from 'vitest'
import type { TerrainProfileSample } from '../types'
import {
  applyStructureElevationInterpolation,
  isStructureFeature,
} from './applyStructureElevationInterpolation'

const valleySamples = [
  { lng: 13.0, lat: 52.5, distanceMeters: 0, elevationMeters: 100 },
  { lng: 13.01, lat: 52.5, distanceMeters: 50, elevationMeters: 40 },
  { lng: 13.02, lat: 52.5, distanceMeters: 100, elevationMeters: 30 },
  { lng: 13.03, lat: 52.5, distanceMeters: 150, elevationMeters: 45 },
  { lng: 13.04, lat: 52.5, distanceMeters: 200, elevationMeters: 110 },
] satisfies TerrainProfileSample[]

describe('isStructureFeature()', () => {
  it('detects bridge=yes and tunnel=yes', () => {
    expect(isStructureFeature({ bridge: 'yes' })).toBe(true)
    expect(isStructureFeature({ tunnel: 'yes' })).toBe(true)
    expect(isStructureFeature({ bridge: 'yes', tunnel: 'yes' })).toBe(true)
  })

  it('ignores covered and other values', () => {
    expect(isStructureFeature({ covered: 'covered' })).toBe(false)
    expect(isStructureFeature({ bridge: 'viaduct' })).toBe(false)
    expect(isStructureFeature({})).toBe(false)
    expect(isStructureFeature(null)).toBe(false)
  })
})

describe('applyStructureElevationInterpolation()', () => {
  it('leaves untagged features on DEM with source dem', () => {
    const result = applyStructureElevationInterpolation(valleySamples, {})
    expect(result.map((sample) => sample.elevationMeters)).toStrictEqual(
      valleySamples.map((sample) => sample.elevationMeters),
    )
    expect(result.every((sample) => sample.source === 'dem')).toBe(true)
  })

  it('linearly interpolates interior samples on a bridge between endpoints', () => {
    const result = applyStructureElevationInterpolation(valleySamples, { bridge: 'yes' })

    expect(result[0]?.elevationMeters).toBe(100)
    expect(result[0]?.source).toBe('dem')
    expect(result[4]?.elevationMeters).toBe(110)
    expect(result[4]?.source).toBe('dem')

    // Midpoint at 100 m of 200 m span: 100 + (110-100)*0.5 = 105
    expect(result[2]?.elevationMeters).toBeCloseTo(105)
    expect(result[2]?.source).toBe('interpolated')

    // At 50 m: 100 + 10*0.25 = 102.5
    expect(result[1]?.elevationMeters).toBeCloseTo(102.5)
    expect(result[1]?.source).toBe('interpolated')
  })

  it('applies the same interpolation for tunnels', () => {
    const result = applyStructureElevationInterpolation(valleySamples, { tunnel: 'yes' })
    expect(result[2]?.elevationMeters).toBeCloseTo(105)
    expect(result[2]?.source).toBe('interpolated')
  })

  it('removes the synthetic valley from ascent/descent when stats use interpolated samples', () => {
    const result = applyStructureElevationInterpolation(valleySamples, { bridge: 'yes' })

    let ascentMeters = 0
    let descentMeters = 0
    for (let index = 1; index < result.length; index += 1) {
      const delta = result[index]!.elevationMeters - result[index - 1]!.elevationMeters
      if (delta > 0) ascentMeters += delta
      if (delta < 0) descentMeters += Math.abs(delta)
    }

    // Chord from 100 → 110: only +10 m ascent, no valley descent
    expect(ascentMeters).toBeCloseTo(10)
    expect(descentMeters).toBeCloseTo(0)

    const demAscent = valleySamples.reduce((sum, sample, index) => {
      if (index === 0) return sum
      const delta = sample.elevationMeters - valleySamples[index - 1]!.elevationMeters
      return delta > 0 ? sum + delta : sum
    }, 0)
    expect(demAscent).toBeGreaterThan(10)
  })
})
