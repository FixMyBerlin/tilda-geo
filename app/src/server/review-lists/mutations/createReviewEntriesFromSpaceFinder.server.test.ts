import { beforeEach, describe, expect, test, vi } from 'vitest'
import { AuthorizationError } from '@/server/auth/errors'

// Guard + behavior test for the Flächenfinder take-over: authorization aborts before any write,
// duplicates are skipped, and a freshly created list does not stay behind when the insert fails.

const { db, authorizePlanningRegion, assertListInRegion, createReviewList } = vi.hoisted(() => ({
  db: {
    planningRun: { findUnique: vi.fn() },
    reviewEntry: { findMany: vi.fn(), createMany: vi.fn() },
    reviewList: { delete: vi.fn() },
  },
  authorizePlanningRegion: vi.fn(),
  assertListInRegion: vi.fn(),
  createReviewList: vi.fn(),
}))

vi.mock('@/server/db.server', () => ({ default: db }))
vi.mock('@/server/auth/memberCaller.server', () => ({
  requireMemberSession: vi.fn(async () => ({ userId: 'u1' })),
  memberAuditContext: vi.fn(),
}))
vi.mock('@/server/audit/auditContext.server', () => ({
  runWithAuditContextAsync: (_ctx: unknown, fn: () => unknown) => fn(),
}))
vi.mock('@/server/planning/authorizePlanningRegion.server', () => ({ authorizePlanningRegion }))
vi.mock('../queries/assertListInRegion.server', () => ({ assertListInRegion }))
vi.mock('./createReviewList.server', () => ({ createReviewList }))

import { createReviewEntriesFromSpaceFinder } from './createReviewEntriesFromSpaceFinder.server'

const headers = new Headers()
const hexagon = (h3Id: string) => ({
  h3Id,
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [13.4, 52.5],
        [13.41, 52.5],
        [13.41, 52.51],
        [13.4, 52.5],
      ],
    ],
  },
  properties: { mce_gesamtscore: 80, eignungsklasse: 'gut' },
})
const run = (overrides: Record<string, unknown> = {}) => ({
  status: 'COMPLETE',
  variant: {
    id: 5,
    title: 'Standard',
    area: { id: 3, title: 'Mitte', useCase: 'fahrradbox', region: { slug: 'berlin' } },
  },
  ...overrides,
})
const input = (
  target: { listId: number } | { newListName: string },
  candidates = [hexagon('a'), hexagon('b')],
) => ({
  regionSlug: 'berlin',
  runId: 9,
  target,
  candidates,
})

beforeEach(() => {
  vi.clearAllMocks()
  authorizePlanningRegion.mockResolvedValue(undefined)
  assertListInRegion.mockResolvedValue(1)
  db.planningRun.findUnique.mockResolvedValue(run())
  db.reviewEntry.findMany.mockResolvedValue([])
  db.reviewEntry.createMany.mockImplementation(async ({ data }: { data: unknown[] }) => ({
    count: data.length,
  }))
  createReviewList.mockResolvedValue({ id: 42, name: 'Neu' })
  db.reviewList.delete.mockResolvedValue({ id: 42 })
})

describe('createReviewEntriesFromSpaceFinder', () => {
  test('rejects before any lookup or write when the planning authorization fails', async () => {
    authorizePlanningRegion.mockRejectedValue(new AuthorizationError('no'))
    await expect(createReviewEntriesFromSpaceFinder(input({ listId: 1 }), headers)).rejects.toThrow(
      AuthorizationError,
    )
    expect(db.planningRun.findUnique).not.toHaveBeenCalled()
    expect(createReviewList).not.toHaveBeenCalled()
    expect(db.reviewEntry.createMany).not.toHaveBeenCalled()
  })

  test('rejects a run of another region', async () => {
    db.planningRun.findUnique.mockResolvedValue(
      run({
        variant: { id: 5, title: 'x', area: { id: 3, title: 'y', region: { slug: 'koeln' } } },
      }),
    )
    await expect(createReviewEntriesFromSpaceFinder(input({ listId: 1 }), headers)).rejects.toThrow(
      'Region',
    )
    expect(db.reviewEntry.createMany).not.toHaveBeenCalled()
  })

  test('rejects a run that is not complete', async () => {
    db.planningRun.findUnique.mockResolvedValue(run({ status: 'RUNNING' }))
    await expect(createReviewEntriesFromSpaceFinder(input({ listId: 1 }), headers)).rejects.toThrow(
      'abgeschlossen',
    )
  })

  test('rejects a list that is not in the region', async () => {
    assertListInRegion.mockRejectedValue(new AuthorizationError('not in region'))
    await expect(createReviewEntriesFromSpaceFinder(input({ listId: 7 }), headers)).rejects.toThrow(
      AuthorizationError,
    )
    expect(db.reviewEntry.createMany).not.toHaveBeenCalled()
  })

  test('creates SPACE_FINDER entries with a readable snapshot and the origin in sourceMeta', async () => {
    const result = await createReviewEntriesFromSpaceFinder(input({ listId: 1 }), headers)
    expect(result).toEqual({ listId: 1, createdCount: 2, skippedCount: 0 })
    const { data } = db.reviewEntry.createMany.mock.calls[0]![0]
    expect(data).toHaveLength(2)
    expect(data[0]).toMatchObject({
      listId: 1,
      source: 'SPACE_FINDER',
      importId: 'flaechenfinder:a',
      geometryType: 'POLYGON',
      properties: expect.objectContaining({
        Gesamtscore: '80',
        Planungsgebiet: 'Mitte',
        Nutzungsfall: 'Fahrradboxen',
      }),
      sourceMeta: expect.objectContaining({ areaId: 3, variantId: 5, runId: 9, h3Id: 'a' }),
    })
  })

  test('skips candidates already in the list and reports them', async () => {
    db.reviewEntry.findMany.mockResolvedValue([{ importId: 'flaechenfinder:a' }])
    const result = await createReviewEntriesFromSpaceFinder(input({ listId: 1 }), headers)
    expect(result).toEqual({ listId: 1, createdCount: 1, skippedCount: 1 })
    const { data } = db.reviewEntry.createMany.mock.calls[0]![0]
    expect(data.map((e: { importId: string }) => e.importId)).toEqual(['flaechenfinder:b'])
  })

  test('creates a new list and imports into it', async () => {
    const result = await createReviewEntriesFromSpaceFinder(input({ newListName: 'Neu' }), headers)
    expect(createReviewList).toHaveBeenCalledWith({ regionSlug: 'berlin', name: 'Neu' }, headers)
    expect(result.listId).toBe(42)
    expect(db.reviewEntry.findMany).not.toHaveBeenCalled()
  })

  test('removes a newly created list again when the insert fails', async () => {
    db.reviewEntry.createMany.mockRejectedValue(new Error('db down'))
    await expect(
      createReviewEntriesFromSpaceFinder(input({ newListName: 'Neu' }), headers),
    ).rejects.toThrow('db down')
    expect(db.reviewList.delete).toHaveBeenCalledWith({ where: { id: 42 } })
  })

  test('does not write a new list when the candidates are invalid', async () => {
    const broken = {
      ...hexagon('a'),
      geometry: { type: 'Polygon' as const, coordinates: [['x']] as unknown as number[][][] },
    }
    await expect(
      createReviewEntriesFromSpaceFinder(input({ newListName: 'Neu' }, [broken]), headers),
    ).rejects.toThrow()
    expect(createReviewList).not.toHaveBeenCalled()
  })
})
