import { describe, expect, test } from 'vitest'
import { migrateUrl } from './migrateUrl'
import { migrations } from './migrations'
import type { UrlMigrationContext } from './migrations/types'

const ctx = { categories: ['bikelanes'] } satisfies UrlMigrationContext
const currentVersion = Math.max(...Object.keys(migrations).map((key) => Number(key)))

describe('migrateUrl unknown versions', () => {
  test('v=abc does not throw and runs migrations', () => {
    const result = new URL(migrateUrl('https://example.com/regionen/foo?v=abc', ctx))
    expect(result.searchParams.get('v')).toBe(String(currentVersion))
  })

  test('v=-1 does not throw and runs migrations', () => {
    const result = new URL(migrateUrl('https://example.com/regionen/foo?v=-1', ctx))
    expect(result.searchParams.get('v')).toBe(String(currentVersion))
  })

  test('v=999 does not throw and skips migrations', () => {
    const result = new URL(migrateUrl('https://example.com/regionen/foo?v=999', ctx))
    expect(result.searchParams.get('v')).toBe(String(currentVersion))
  })
})
