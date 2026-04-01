import { describe, expect, test } from 'vitest'
import { getRenderStrategy } from './processLocalSource'

describe('getRenderStrategy()', () => {
  test('auto + small file renders geojson but still generates pmtiles', () => {
    const result = getRenderStrategy('auto', true)
    expect(result).toEqual({ renderFormat: 'geojson', shouldGeneratePmtiles: true })
  })

  test('auto + large file renders pmtiles and generates pmtiles', () => {
    const result = getRenderStrategy('auto', false)
    expect(result).toEqual({ renderFormat: 'pmtiles', shouldGeneratePmtiles: true })
  })

  test('explicit geojson skips pmtiles generation', () => {
    const result = getRenderStrategy('geojson', false)
    expect(result).toEqual({ renderFormat: 'geojson', shouldGeneratePmtiles: false })
  })
})
