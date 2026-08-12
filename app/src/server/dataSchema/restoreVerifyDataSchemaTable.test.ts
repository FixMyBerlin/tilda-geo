import { describe, expect, it, vi } from 'vitest'
import {
  type AsideHolder,
  type RestoreVerifyDeps,
  restoreVerifyDataSchemaTable,
} from './restoreVerifyDataSchemaTable'

function makeDeps(overrides: Partial<RestoreVerifyDeps> = {}) {
  const dropped: string[] = []
  const restoredAsides: string[] = []
  const deps = {
    restoreDumpFile: vi.fn(async () => undefined),
    getDataSchemaTableRowCount: vi.fn(async () => 3),
    dataSchemaTableExists: vi.fn(async () => true),
    dropTableIfExists: vi.fn(async (qualifiedName: string) => {
      dropped.push(qualifiedName)
    }),
    restoreTableAside: vi.fn(async (mapping) => {
      restoredAsides.push(mapping.table.to)
    }),
    ...overrides,
  } satisfies RestoreVerifyDeps
  return { deps, dropped, restoredAsides }
}

describe('restoreVerifyDataSchemaTable', () => {
  it('does not drop the live table when bookkeeping fails after a successful restore', async () => {
    const aside: AsideHolder = {
      mapping: {
        table: { from: 'foo', to: 'foo__old' },
        indexes: [],
        constraints: [],
        sequences: [],
      },
    }
    const { deps, dropped, restoredAsides } = makeDeps()

    const result = await restoreVerifyDataSchemaTable(
      {
        dumpPath: '/tmp/foo.dump',
        table: 'foo',
        expectedRowCount: 3,
        aside,
      },
      deps,
    )

    expect(result).toEqual({ rowCount: 3, asideDropWarning: null })
    expect(aside.mapping).toBeNull()
    expect(dropped).toEqual(['data.foo__old'])
    expect(restoredAsides).toEqual([])

    // Importer bookkeeping runs after this phase. If it throws, the outer catch only rolls
    // back when aside.mapping is set — which must stay null after a committed restore.
    await expect(Promise.reject(new Error('prisma hiccup'))).rejects.toThrow('prisma hiccup')
    if (aside.mapping) {
      await deps.dropTableIfExists(`data.foo`)
      await deps.restoreTableAside(aside.mapping)
    }
    expect(dropped).toEqual(['data.foo__old'])
    expect(dropped).not.toContain('data.foo')
    expect(restoredAsides).toEqual([])
  })

  it('clears aside.mapping after successful restore even when aside drop fails', async () => {
    const aside: AsideHolder = {
      mapping: {
        table: { from: 'foo', to: 'foo__old' },
        indexes: [],
        constraints: [],
        sequences: [],
      },
    }
    const { deps, dropped, restoredAsides } = makeDeps({
      dropTableIfExists: vi.fn(async (qualifiedName: string) => {
        if (qualifiedName === 'data.foo__old') {
          throw new Error('drop aside failed')
        }
      }),
    })

    const result = await restoreVerifyDataSchemaTable(
      {
        dumpPath: '/tmp/foo.dump',
        table: 'foo',
        expectedRowCount: 3,
        aside,
      },
      deps,
    )

    expect(result.rowCount).toBe(3)
    expect(result.asideDropWarning).toMatch(/Aside data\.foo__old/)
    expect(aside.mapping).toBeNull()
    expect(dropped).toEqual([])
    expect(restoredAsides).toEqual([])
  })

  it('drops the new live table and restores aside when row-count verification fails', async () => {
    const aside: AsideHolder = {
      mapping: {
        table: { from: 'foo', to: 'foo__old' },
        indexes: [],
        constraints: [],
        sequences: [],
      },
    }
    const { deps, dropped, restoredAsides } = makeDeps({
      getDataSchemaTableRowCount: vi.fn(async () => 99),
    })

    await expect(
      restoreVerifyDataSchemaTable(
        {
          dumpPath: '/tmp/foo.dump',
          table: 'foo',
          expectedRowCount: 3,
          aside,
        },
        deps,
      ),
    ).rejects.toThrow(/Row count mismatch/)

    expect(dropped).toEqual(['data.foo'])
    expect(restoredAsides).toEqual(['foo__old'])
    expect(aside.mapping).toBeNull()
  })
})
