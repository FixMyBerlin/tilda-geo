import { describe, expect, it } from 'vitest'
import { DEFAULT_DATABASE_PORT } from './envDefaultPorts'
import { databaseEnvSchema } from './envSchema'

const requiredDb = {
  DATABASE_HOST: 'localhost',
  DATABASE_USER: 'user',
  DATABASE_PASSWORD: 'secret',
  DATABASE_NAME: 'db',
}

describe('databaseEnvSchema', () => {
  it('defaults DATABASE_PORT when unset', () => {
    expect(databaseEnvSchema.parse(requiredDb).DATABASE_PORT).toBe(DEFAULT_DATABASE_PORT)
  })

  it('keeps an explicit DATABASE_PORT', () => {
    expect(databaseEnvSchema.parse({ ...requiredDb, DATABASE_PORT: '5433' }).DATABASE_PORT).toBe(
      '5433',
    )
  })
})
