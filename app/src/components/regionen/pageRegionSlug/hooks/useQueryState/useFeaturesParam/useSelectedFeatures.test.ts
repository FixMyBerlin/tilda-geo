import { describe, expect, test } from 'vitest'
import { featureIdsEqual } from './useSelectedFeatures'

describe('featureIdsEqual', () => {
  test('matches string and number forms of the same id', () => {
    expect(featureIdsEqual('10205', 10205)).toBe(true)
    expect(featureIdsEqual(10205, '10205')).toBe(true)
    expect(featureIdsEqual(10205, 10205)).toBe(true)
    expect(featureIdsEqual('10205', '10205')).toBe(true)
  })

  test('rejects different ids and nullish values', () => {
    expect(featureIdsEqual('10205', 10206)).toBe(false)
    expect(featureIdsEqual(null, 10205)).toBe(false)
    expect(featureIdsEqual('10205', undefined)).toBe(false)
  })
})
