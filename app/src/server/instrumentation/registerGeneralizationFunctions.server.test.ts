import { beforeEach, expect, test, vi } from 'vitest'

const { executeRaw, queryRawUnsafe, transaction, txExecuteRawUnsafe } = vi.hoisted(() => ({
  executeRaw: vi.fn(),
  queryRawUnsafe: vi.fn(),
  transaction: vi.fn(),
  txExecuteRawUnsafe: vi.fn(),
}))

vi.mock('@/server/prisma-client.server', () => ({
  geoDataClient: {
    $executeRaw: executeRaw,
    $queryRawUnsafe: queryRawUnsafe,
    $transaction: transaction,
  },
}))

vi.mock(
  '@/components/regionen/pageRegionSlug/mapData/mapDataSources/generalization/interacitvityConfiguartion',
  () => ({
    interactivityConfiguration: {
      missing_table: { minzoom: 10, stylingKeys: ['a'] },
      existing_table: { minzoom: 10, stylingKeys: ['b'] },
    },
  }),
)

import { registerGeneralizationFunctions } from './registerGeneralizationFunctions.server'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  transaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) =>
    fn({ $executeRawUnsafe: txExecuteRawUnsafe }),
  )
  queryRawUnsafe.mockImplementation(async (sql: string) => {
    if (sql.includes('to_regclass')) {
      return [{ exists: sql.includes('existing_table') }]
    }
    if (sql.includes('"missing_table"')) throw new Error('relation does not exist')
    if (sql.includes('information_schema')) return [{ fields: {} }]
    return [{ bounds: [0, 0, 1, 1] }]
  })
})

test('skips a missing table and still registers the tables after it', async () => {
  await expect(registerGeneralizationFunctions()).resolves.toBeUndefined()

  expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('public."missing_table"'))
  expect(transaction).toHaveBeenCalledTimes(1)
  const createdSql = txExecuteRawUnsafe.mock.calls.map(([sql]) => String(sql)).join('\n')
  expect(createdSql).toContain('FROM "existing_table"')
  expect(createdSql).not.toContain('missing_table')
})
