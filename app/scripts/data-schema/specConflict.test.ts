import { describe, expect, it } from 'vitest'
import type { DataSchemaSpec } from '@/server/dataSchema/dataSchemaSpec.schema'
import { decideSpecOverwrite, describeSpecConflict, formatSpecUpdatedAt } from './specConflict'

const now = new Date('2026-08-13T15:00:00.000Z')

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

const older = { ...baseSpec, updatedAt: '2026-08-10T10:00:00.000Z' } satisfies DataSchemaSpec
const newer = { ...baseSpec, updatedAt: '2026-08-13T13:00:00.000Z' } satisfies DataSchemaSpec

describe('decideSpecOverwrite', () => {
  it('writes without prompting when the destination is missing', () => {
    expect(decideSpecOverwrite({ direction: 'pull', existing: null, incoming: older })).toEqual({
      write: true,
      prompt: false,
      reason: 'missing',
    })
  })

  it('writes without prompting when incoming updatedAt is newer', () => {
    expect(decideSpecOverwrite({ direction: 'pull', existing: older, incoming: newer })).toEqual({
      write: true,
      prompt: false,
      reason: 'incoming-newer',
    })
  })

  it('prompts when existing updatedAt is newer', () => {
    expect(decideSpecOverwrite({ direction: 'pull', existing: newer, incoming: older })).toEqual({
      write: true,
      prompt: true,
      reason: 'conflict',
    })
  })

  it('skips pull when updatedAt matches', () => {
    expect(decideSpecOverwrite({ direction: 'pull', existing: newer, incoming: newer })).toEqual({
      write: false,
      prompt: false,
      reason: 'same',
    })
  })

  it('still writes on publish when updatedAt matches (stamp a new time)', () => {
    expect(decideSpecOverwrite({ direction: 'publish', existing: newer, incoming: newer })).toEqual(
      { write: true, prompt: false, reason: 'same' },
    )
  })

  it('treats a missing updatedAt as older than a dated spec', () => {
    expect(decideSpecOverwrite({ direction: 'pull', existing: baseSpec, incoming: newer })).toEqual(
      { write: true, prompt: false, reason: 'incoming-newer' },
    )
    expect(
      decideSpecOverwrite({ direction: 'publish', existing: newer, incoming: baseSpec }),
    ).toEqual({ write: true, prompt: true, reason: 'conflict' })
  })
})

describe('formatSpecUpdatedAt', () => {
  it('includes relative age and the stored ISO time', () => {
    expect(formatSpecUpdatedAt(newer.updatedAt, now)).toBe('2 hours ago (2026-08-13T13:00:00.000Z)')
  })

  it('says never published when the field is missing', () => {
    expect(formatSpecUpdatedAt(undefined, now)).toBe('no updatedAt (never published)')
  })
})

describe('describeSpecConflict', () => {
  it('explains both updatedAt values on pull', () => {
    const text = describeSpecConflict({
      table: 'euvm_cutouts_point',
      direction: 'pull',
      existing: newer,
      incoming: older,
      now,
    })
    expect(text).toContain('Local spec.json for euvm_cutouts_point has a newer updatedAt than S3.')
    expect(text).toContain('local spec.json: 2 hours ago (2026-08-13T13:00:00.000Z)')
    expect(text).toContain('S3 spec: 3 days ago (2026-08-10T10:00:00.000Z)')
  })
})
