import { describe, expect, it } from 'vitest'
import { describePullMissingOnS3, formatEmptyS3PullMessage, formatPullOutro } from './status'

describe('describePullMissingOnS3', () => {
  it('says S3 is missing and local spec is kept', () => {
    expect(describePullMissingOnS3({ table: 'euvm_cutouts_point', hasLocalSpec: true })).toEqual({
      line: 'euvm_cutouts_point: nothing to pull — S3 object data-schema/euvm_cutouts_point/spec.yaml is missing. Local data-schema/euvm_cutouts_point/spec.yaml is unchanged (pull only downloads).',
      summary: 'S3 missing, local kept',
    })
  })

  it('says both S3 and local are missing', () => {
    expect(describePullMissingOnS3({ table: 'euvm_cutouts_point', hasLocalSpec: false })).toEqual({
      line: 'euvm_cutouts_point: nothing to pull — S3 object data-schema/euvm_cutouts_point/spec.yaml is missing, and there is no local spec either.',
      summary: 'S3 missing, no local',
    })
  })

  it('names the snapshot when --snapshot is set', () => {
    expect(
      describePullMissingOnS3({
        table: 'euvm_cutouts_point',
        snapshotId: '20260813T0800',
        hasLocalSpec: true,
      }).line,
    ).toContain(
      'S3 snapshot 20260813T0800 (data-schema/euvm_cutouts_point/snapshots/20260813T0800/spec.yaml)',
    )
  })
})

describe('formatPullOutro', () => {
  it('is short when everything pulled', () => {
    expect(formatPullOutro({ pulled: 2, total: 2, localKeptMissingS3: 0, localOnly: [] })).toBe(
      'Pulled 2/2 spec(s) from S3.',
    )
  })

  it('points at load/publish when local specs were kept', () => {
    expect(
      formatPullOutro({
        pulled: 0,
        total: 2,
        localKeptMissingS3: 2,
        localOnly: [],
      }),
    ).toBe(
      'Pulled 0/2 spec(s) from S3. Local specs are not uploaded by pull. Next: bun run data-schema-load, then bun run data-schema-publish.',
    )
  })

  it('lists local-only tables', () => {
    expect(
      formatPullOutro({
        pulled: 1,
        total: 1,
        localKeptMissingS3: 0,
        localOnly: ['euvm_cutouts_point'],
      }),
    ).toContain('Local-only (not listed on S3): euvm_cutouts_point')
  })
})

describe('formatEmptyS3PullMessage', () => {
  it('mentions local specs when S3 is empty', () => {
    expect(formatEmptyS3PullMessage(['euvm_cutouts_point'])).toContain(
      'Local specs are already here (euvm_cutouts_point)',
    )
  })
})
