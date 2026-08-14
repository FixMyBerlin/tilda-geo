import { describe, expect, it, vi } from 'vitest'
import { buildDataSchemaManifest } from './buildDataSchemaManifest'
import { archiveLatestAsSnapshot, publishLatestDumpAndManifest } from './publishDataSchemaArtifacts'

const sha256 = 'a'.repeat(64)

function sampleManifest(snapshotId: string | null = null) {
  return buildDataSchemaManifest({
    table: 'euvm_cutouts_point',
    publishedAt: '2026-08-13T08:00:00Z',
    snapshotId,
    sha256,
    rowCount: 3,
  })
}

describe('publishLatestDumpAndManifest', () => {
  it('replaces data.dump, then data.manifest.json', async () => {
    const calls: string[] = []
    const result = await publishLatestDumpAndManifest(
      { table: 'euvm_cutouts_point', dumpPath: '/tmp/table.dump', manifest: sampleManifest() },
      {
        putFile: async (key) => {
          calls.push(`file:${key}`)
        },
        putJson: async (key) => {
          calls.push(`json:${key}`)
        },
      },
    )

    expect(calls).toEqual([
      'file:data-schema/euvm_cutouts_point/data.dump',
      'json:data-schema/euvm_cutouts_point/data.manifest.json',
    ])
    expect(result.keys).toEqual([
      'data-schema/euvm_cutouts_point/data.dump',
      'data-schema/euvm_cutouts_point/data.manifest.json',
    ])
  })

  it('does not write the manifest if the dump upload fails', async () => {
    const putJson = vi.fn()
    await expect(
      publishLatestDumpAndManifest(
        { table: 'euvm_cutouts_point', dumpPath: '/tmp/table.dump', manifest: sampleManifest() },
        {
          putFile: async () => {
            throw new Error('dump failed')
          },
          putJson,
        },
      ),
    ).rejects.toThrow('dump failed')
    expect(putJson).not.toHaveBeenCalled()
  })
})

describe('archiveLatestAsSnapshot', () => {
  it('copies the current dump into snapshots/<UTC>/data.dump', async () => {
    const previous = sampleManifest()
    const calls: string[] = []
    const result = await archiveLatestAsSnapshot(
      {
        table: 'euvm_cutouts_point',
        previous,
        sourceDumpKey: 'data-schema/euvm_cutouts_point/data.dump',
      },
      {
        copyObject: async (fromKey, toKey) => {
          calls.push(`copy:${fromKey}->${toKey}`)
        },
        putJson: async (key) => {
          calls.push(`json:${key}`)
        },
        objectExists: async () => false,
      },
    )
    expect(result.snapshotId).toBe('20260813T0800')
    expect(result.skipped).toBe(false)
    expect(calls).toEqual([
      'copy:data-schema/euvm_cutouts_point/data.dump->data-schema/euvm_cutouts_point/snapshots/20260813T0800/data.dump',
      'json:data-schema/euvm_cutouts_point/snapshots/20260813T0800/data.manifest.json',
    ])
  })

  it('skips when that snapshot already exists', async () => {
    const putJson = vi.fn()
    const copyObject = vi.fn()
    const result = await archiveLatestAsSnapshot(
      {
        table: 'euvm_cutouts_point',
        previous: sampleManifest(),
        sourceDumpKey: 'data-schema/euvm_cutouts_point/data.dump',
      },
      {
        copyObject,
        putJson,
        objectExists: async () => true,
      },
    )
    expect(result.skipped).toBe(true)
    expect(copyObject).not.toHaveBeenCalled()
    expect(putJson).not.toHaveBeenCalled()
  })
})
