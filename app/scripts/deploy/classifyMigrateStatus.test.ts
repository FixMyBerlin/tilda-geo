import { describe, expect, test } from 'vitest'
import { classifyMigrateStatus } from './classifyMigrateStatus'

describe('classifyMigrateStatus', () => {
  test('pending with Prisma exit 1 -> 10', () => {
    const output = `48 migrations found in prisma/migrations
Following migrations have not yet been applied:
20230925153118_blitz_scaffolding`
    expect(classifyMigrateStatus(output, 1)).toBe(10)
  })

  test('up-to-date -> 0', () => {
    const output = `48 migrations found in prisma/migrations

Database schema is up to date!`
    expect(classifyMigrateStatus(output, 0)).toBe(0)
  })

  test('P1001 error with exit 1 -> 1', () => {
    const output = `Datasource "db": PostgreSQL database "postgres" at "invalid:5432"
Error: P1001: Can't reach database server at \`invalid:5432\``
    expect(classifyMigrateStatus(output, 1)).toBe(1)
  })

  test('empty output with exit 0 -> 1 (fail-closed)', () => {
    expect(classifyMigrateStatus('', 0)).toBe(1)
    expect(classifyMigrateStatus('   \n', 0)).toBe(1)
  })
})
