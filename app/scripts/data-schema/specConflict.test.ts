import { describe, expect, it } from 'vitest'
import type { DataSchemaSpec } from '@/server/dataSchema/dataSchemaSpec.schema'
import { decideSpecOverwrite, describeSpecConflict } from './specConflict'

const baseSpec = {
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
} satisfies DataSchemaSpec

const editedSpec = {
  ...baseSpec,
  source: { ...baseSpec.source, provider: 'eUVM Berlin' },
} satisfies DataSchemaSpec

describe('decideSpecOverwrite', () => {
  it('writes without prompting when the destination is missing', () => {
    expect(decideSpecOverwrite({ direction: 'pull', existing: null, incoming: baseSpec })).toEqual({
      write: true,
      prompt: false,
      reason: 'missing',
    })
  })

  it('skips when the specs are equal', () => {
    expect(
      decideSpecOverwrite({ direction: 'pull', existing: baseSpec, incoming: { ...baseSpec } }),
    ).toEqual({ write: false, prompt: false, reason: 'same' })
    expect(
      decideSpecOverwrite({ direction: 'publish', existing: baseSpec, incoming: { ...baseSpec } }),
    ).toEqual({ write: false, prompt: false, reason: 'same' })
  })

  it('prompts when the specs differ', () => {
    expect(
      decideSpecOverwrite({ direction: 'pull', existing: baseSpec, incoming: editedSpec }),
    ).toEqual({ write: true, prompt: true, reason: 'conflict' })
    expect(
      decideSpecOverwrite({ direction: 'publish', existing: editedSpec, incoming: baseSpec }),
    ).toEqual({ write: true, prompt: true, reason: 'conflict' })
  })
})

describe('describeSpecConflict', () => {
  it('explains that pull would overwrite local spec.json', () => {
    expect(describeSpecConflict({ table: 'euvm_cutouts_point', direction: 'pull' })).toContain(
      'Local spec.json for euvm_cutouts_point differs from S3',
    )
  })
})
