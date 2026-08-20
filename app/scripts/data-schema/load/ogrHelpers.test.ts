import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  gdalVersionMeetsMinimum,
  geometryTypesMatch,
  normalizeOgrGeometryType,
  ogrPgConnectionString,
  parseGdalVersion,
} from './ogrHelpers'

describe('normalizeOgrGeometryType / geometryTypesMatch', () => {
  it('matches ogrinfo "Multi Polygon" with spec MultiPolygon', () => {
    expect(geometryTypesMatch('Multi Polygon', 'MultiPolygon')).toBe(true)
    expect(normalizeOgrGeometryType('Multi Polygon')).toBe('multipolygon')
  })

  it('matches ogrinfo "Multi Point" with spec MultiPoint', () => {
    expect(geometryTypesMatch('Multi Point', 'MultiPoint')).toBe(true)
    expect(geometryTypesMatch('Multi Point', 'Point')).toBe(false)
  })

  it('matches ogrinfo "Line String" with spec LineString', () => {
    expect(geometryTypesMatch('Line String', 'LineString')).toBe(true)
  })

  it('strips a leading 3D qualifier (3D Point ↔ Point)', () => {
    expect(geometryTypesMatch('3D Point', 'Point')).toBe(true)
    expect(geometryTypesMatch('3D Multi Polygon', 'MultiPolygon')).toBe(true)
  })

  it('rejects a genuine geometry type mismatch', () => {
    expect(geometryTypesMatch('Multi Polygon', 'Point')).toBe(false)
    expect(geometryTypesMatch('Line String', 'MultiLineString')).toBe(false)
  })
})

describe('ogrPgConnectionString', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  function stubDatabaseEnv(password: string) {
    vi.stubEnv('DATABASE_HOST', 'localhost')
    vi.stubEnv('DATABASE_PORT', '5432')
    vi.stubEnv('DATABASE_NAME', 'db')
    vi.stubEnv('DATABASE_USER', 'user')
    vi.stubEnv('DATABASE_PASSWORD', password)
  }

  it('single-quotes a password that contains a space', () => {
    stubDatabaseEnv('pass word')
    expect(ogrPgConnectionString()).toContain("password='pass word'")
  })

  it('single-quotes a password that contains =', () => {
    stubDatabaseEnv('a=b')
    expect(ogrPgConnectionString()).toContain("password='a=b'")
  })

  it('backslash-escapes a single quote inside the password', () => {
    stubDatabaseEnv("p'ass")
    expect(ogrPgConnectionString()).toContain("password='p\\'ass'")
  })
})

describe('parseGdalVersion / gdalVersionMeetsMinimum', () => {
  it('parses ogr2ogr --version output', () => {
    expect(parseGdalVersion('GDAL 3.11.3, released 2025/07/12')).toEqual({
      major: 3,
      minor: 11,
      patch: 3,
    })
  })

  it('accepts 3.8 and newer', () => {
    expect(gdalVersionMeetsMinimum({ major: 3, minor: 8 })).toBe(true)
    expect(gdalVersionMeetsMinimum({ major: 3, minor: 11 })).toBe(true)
    expect(gdalVersionMeetsMinimum({ major: 4, minor: 0 })).toBe(true)
  })

  it('rejects below 3.8', () => {
    expect(gdalVersionMeetsMinimum({ major: 3, minor: 6 })).toBe(false)
    expect(parseGdalVersion('not a version')).toBeNull()
  })
})
