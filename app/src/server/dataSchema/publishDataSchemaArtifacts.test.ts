import { describe, expect, it, vi } from 'vitest'
import { buildDataSchemaManifest } from './buildDataSchemaManifest'
import { archiveLatestAsSnapshot, publishLatestDumpAndManifest } from './publishDataSchemaArtifacts'

const sha256 = 'a'.repeat(64)

function sampleManifest(snapshotId: string | null = null) {
  return buildDataSchemaManifest({
    table: 'euvm_cutouts_point',
    publishedAt: '2026-08-13T08:00:00Z',
    snapshotId,
    bytes: 12,
    sha256,
    rowCount: 3,
    publishedBy: 'tester',
    publishedFrom: 'development',
  })
}

describe('publishLatestDumpAndManifest', () => {
  it('writes the object dump, then latest/manifest.json, then latest/table.dump', async () => {
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
      `file:data-schema/euvm_cutouts_point/objects/${sha256}.dump`,
      'json:data-schema/euvm_cutouts_point/latest/manifest.json',
      'file:data-schema/euvm_cutouts_point/latest/table.dump',
    ])
    expect(result.warning).toBeNull()
    expect(result.keys).toContain(`data-schema/euvm_cutouts_point/objects/${sha256}.dump`)
  })

  it('keeps the new manifest when the latest/table.dump copy fails', async () => {
    const calls: string[] = []
    const result = await publishLatestDumpAndManifest(
      { table: 'euvm_cutouts_point', dumpPath: '/tmp/table.dump', manifest: sampleManifest() },
      {
        putFile: async (key) => {
          calls.push(`file:${key}`)
          if (key.endsWith('/latest/table.dump')) throw new Error('S3 copy failed')
        },
        putJson: async (key) => {
          calls.push(`json:${key}`)
        },
      },
    )

    expect(calls).toEqual([
      `file:data-schema/euvm_cutouts_point/objects/${sha256}.dump`,
      'json:data-schema/euvm_cutouts_point/latest/manifest.json',
      'file:data-schema/euvm_cutouts_point/latest/table.dump',
    ])
    expect(result.warning).toMatch(/latest\/table\.dump/)
    expect(result.keys).toEqual([
      `data-schema/euvm_cutouts_point/objects/${sha256}.dump`,
      'data-schema/euvm_cutouts_point/latest/manifest.json',
    ])
  })

  it('does not write latest/manifest.json if the object dump upload fails', async () => {
    const putJson = vi.fn()
    await expect(
      publishLatestDumpAndManifest(
        { table: 'euvm_cutouts_point', dumpPath: '/tmp/table.dump', manifest: sampleManifest() },
        {
          putFile: async () => {
            throw new Error('object dump failed')
          },
          putJson,
        },
      ),
    ).rejects.toThrow('object dump failed')
    expect(putJson).not.toHaveBeenCalled()
  })
})

describe('archiveLatestAsSnapshot', () => {
  it('copies the previous latest dump into snapshots/ using publishedAt as the id', async () => {
    const previous = sampleManifest()
    const calls: string[] = []
    const result = await archiveLatestAsSnapshot(
      {
        table: 'euvm_cutouts_point',
        previous,
        sourceDumpKey: `data-schema/euvm_cutouts_point/objects/${sha256}.dump`,
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
      `copy:data-schema/euvm_cutouts_point/objects/${sha256}.dump->data-schema/euvm_cutouts_point/snapshots/20260813T0800/table.dump`,
      'json:data-schema/euvm_cutouts_point/snapshots/20260813T0800/manifest.json',
    ])
  })

  it('skips when that snapshot already exists', async () => {
    const putJson = vi.fn()
    const copyObject = vi.fn()
    const result = await archiveLatestAsSnapshot(
      {
        table: 'euvm_cutouts_point',
        previous: sampleManifest(),
        sourceDumpKey: 'data-schema/euvm_cutouts_point/latest/table.dump',
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
