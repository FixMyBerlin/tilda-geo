import { describe, expect, it } from 'vitest'
import {
  databaseUrlToOgrPg,
  gdalVersionMeetsMinimum,
  geometryTypesMatch,
  normalizeOgrGeometryType,
  parseGdalVersion,
} from './ogrHelpers'

describe('normalizeOgrGeometryType / geometryTypesMatch', () => {
  it('matches ogrinfo "Multi Polygon" with spec MultiPolygon', () => {
    expect(geometryTypesMatch('Multi Polygon', 'MultiPolygon')).toBe(true)
    expect(normalizeOgrGeometryType('Multi Polygon')).toBe('multipolygon')
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

describe('databaseUrlToOgrPg', () => {
  it('single-quotes a password that contains a space', () => {
    const pg = databaseUrlToOgrPg('postgresql://user:pass%20word@localhost:5432/db')
    expect(pg).toContain("password='pass word'")
  })

  it('single-quotes a password that contains =', () => {
    const pg = databaseUrlToOgrPg('postgresql://user:a%3Db@localhost:5432/db')
    expect(pg).toContain("password='a=b'")
  })

  it('backslash-escapes a single quote inside the password', () => {
    const pg = databaseUrlToOgrPg('postgresql://user:p%27ass@localhost:5432/db')
    expect(pg).toContain("password='p\\'ass'")
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
