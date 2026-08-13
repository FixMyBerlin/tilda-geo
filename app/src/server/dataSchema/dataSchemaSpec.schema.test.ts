import { describe, expect, it } from 'vitest'
import { parseDataSchemaSpec } from './dataSchemaSpec.schema'

const validSpec = {
  specVersion: 1,
  table: 'euvm_cutouts_point',
  source: { file: 'euvm_cutouts_point.geojson' },
  import: {
    srid: 4326,
    geometryName: 'geom',
    fidColumn: 'id',
    expectedGeometryType: 'Point',
  },
  indexes: [{ name: 'euvm_cutouts_point_geom_idx', using: 'gist', columns: ['geom'] }],
}

describe('parseDataSchemaSpec', () => {
  it('returns the spec when it matches the table', () => {
    expect(parseDataSchemaSpec(validSpec, 'euvm_cutouts_point').table).toBe('euvm_cutouts_point')
  })

  it('rejects an invalid spec without throwing from Zod.parse', () => {
    expect(() => parseDataSchemaSpec({ specVersion: 1 }, 'euvm_cutouts_point')).toThrow(
      /Invalid spec for "euvm_cutouts_point"/,
    )
  })

  it('rejects a table mismatch', () => {
    expect(() => parseDataSchemaSpec(validSpec, 'other_table')).toThrow(/Spec table mismatch/)
  })
})
