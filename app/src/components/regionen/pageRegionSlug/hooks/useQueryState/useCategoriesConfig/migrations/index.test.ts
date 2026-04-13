import { describe, expect, test } from 'vitest'
import { migrations } from '.'

const versions = Object.keys(migrations).map((key) => Number(key))
const currentVersion = Math.max(...versions)

describe('Test migrations', () => {
  test('First migration exists', () => {
    expect(versions).toContain(1)
    expect(Math.min(...versions)).toBeGreaterThanOrEqual(1)
  })
  test('No migration is missing', () => {
    for (let version = 1; version < currentVersion; version++) {
      expect(versions).toContain(version)
    }
  })
})
