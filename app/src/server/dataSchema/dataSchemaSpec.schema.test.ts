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

const validSqlSpec = {
  specVersion: 1,
  table: 'euvm_qa_voronoi_2026',
  source: {
    file: 'euvm_qa_voronoi_2026.sql',
    provider: 'TILDA production',
    documentation:
      'Generated on production by docs/qa_create_new_voronoi_baseline.sql, then exported as a SQL dump.',
  },
  indexes: [{ name: 'euvm_qa_voronoi_2026_geom_idx', using: 'gist', columns: ['geom'] }],
  consumedBy: 'processing/topics/parking/9_qa_parkings_euvm_voronoi.sql',
}

describe('parseDataSchemaSpec', () => {
  it('returns the spec when it matches the table', () => {
    expect(parseDataSchemaSpec(validSpec, 'euvm_cutouts_point').table).toBe('euvm_cutouts_point')
  })

  it('keeps optional provider and documentation', () => {
    const spec = parseDataSchemaSpec(
      {
        ...validSpec,
        source: {
          file: 'euvm_cutouts_point.geojson',
          provider: 'eUVM Berlin',
          documentation: 'Google Drive folder …',
        },
      },
      'euvm_cutouts_point',
    )
    expect(spec.source.provider).toBe('eUVM Berlin')
    expect(spec.source.documentation).toBe('Google Drive folder …')
  })

  it('strips leftover large and source.note from older specs', () => {
    const spec = parseDataSchemaSpec(
      { ...validSpec, large: true, source: { file: 'euvm_cutouts_point.geojson', note: 'old' } },
      'euvm_cutouts_point',
    )
    expect(spec).not.toHaveProperty('large')
    expect(spec.source).not.toHaveProperty('note')
    expect(spec.source.documentation).toBeUndefined()
  })

  it('rejects a path-shaped source.file', () => {
    expect(() =>
      parseDataSchemaSpec(
        { ...validSpec, source: { file: 'subdir/euvm_cutouts_point.geojson' } },
        'euvm_cutouts_point',
      ),
    ).toThrow(/basename/)
  })

  it('rejects a source.file that is not geojson, gpkg or sql', () => {
    expect(() =>
      parseDataSchemaSpec(
        { ...validSpec, source: { file: 'euvm_cutouts_point.csv' } },
        'euvm_cutouts_point',
      ),
    ).toThrow(/geojson, \.gpkg or \.sql/)
  })

  it('accepts a .sql source without an import block', () => {
    const spec = parseDataSchemaSpec(validSqlSpec, 'euvm_qa_voronoi_2026')
    expect(spec.source.file).toBe('euvm_qa_voronoi_2026.sql')
    expect(spec.import).toBeUndefined()
    expect(spec.consumedBy).toBe('processing/topics/parking/9_qa_parkings_euvm_voronoi.sql')
  })

  it('rejects a .geojson source without an import block', () => {
    const { import: _import, ...withoutImport } = validSpec
    expect(() => parseDataSchemaSpec(withoutImport, 'euvm_cutouts_point')).toThrow(
      /import is required/,
    )
  })

  it('rejects an invalid spec without throwing from Zod.parse', () => {
    expect(() => parseDataSchemaSpec({ specVersion: 1 }, 'euvm_cutouts_point')).toThrow(
      /Invalid spec for "euvm_cutouts_point"/,
    )
  })

  it('rejects a table mismatch', () => {
    expect(() => parseDataSchemaSpec(validSpec, 'other_table')).toThrow(/Spec table mismatch/)
  })

  it('strips leftover updatedAt from older specs', () => {
    const spec = parseDataSchemaSpec(
      { ...validSpec, updatedAt: '2026-08-13T13:00:00.000Z' },
      'euvm_cutouts_point',
    )
    expect(spec).not.toHaveProperty('updatedAt')
  })
})
