import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'
import { AuthorizationError } from '@/server/auth/errors'

// Guard test for the member-facing Prüflisten mutations: a failed membership check must abort
// before any database write. Server functions are callable without the route guards, so this is
// the real security boundary.

const { dbCalls, dbWrites, listRegionCount, requireAuth, authorizeRegionMemberByRegionSlug } =
  vi.hoisted(() => ({
    dbCalls: [] as string[],
    dbWrites: [] as { call: string; args: unknown }[],
    listRegionCount: { value: 1 },
    requireAuth: vi.fn(),
    authorizeRegionMemberByRegionSlug: vi.fn(),
  }))

vi.mock('@/server/db.server', () => {
  const model = (name: string) =>
    new Proxy(
      {},
      {
        get: (_target, method: string) =>
          vi.fn(async (args: unknown) => {
            dbCalls.push(`${name}.${method}`)
            if (!method.startsWith('find')) dbWrites.push({ call: `${name}.${method}`, args })
            return { id: 1, _count: { entries: 0, regions: listRegionCount.value } }
          }),
      },
    )
  return {
    default: {
      reviewList: model('reviewList'),
      reviewEntry: model('reviewEntry'),
      reviewEntryComment: model('reviewEntryComment'),
      region: model('region'),
    },
  }
})
vi.mock('@/server/auth/session.server', () => ({ requireAuth }))
vi.mock('@/server/authorization/authorizeRegionMember.server', () => ({
  authorizeRegionMemberByRegionSlug,
}))
vi.mock('@/server/audit/auditContext.server', () => ({
  memberFormAuditContext: vi.fn(),
  runWithAuditContextAsync: (_ctx: unknown, fn: () => unknown) => fn(),
}))
vi.mock('@/server/regions/queries/getRegionIdBySlug.server', () => ({
  getRegionIdBySlug: vi.fn(async () => 1),
}))
vi.mock('../reviewListUploadsS3.server', () => ({
  reviewListUploadKeyPrefix: () => 'tmp/review-list-uploads/test/berlin/1/',
  getReviewListUploadJson: vi.fn(async () => ({ type: 'FeatureCollection', features: [] })),
  deleteReviewListUploadS3Object: vi.fn(),
}))

import { createReviewEntriesFromGeojson } from './createReviewEntriesFromGeojson.server'
import { createReviewEntry } from './createReviewEntry.server'
import { createReviewEntryComment } from './createReviewEntryComment.server'
import { createReviewList } from './createReviewList.server'
import { deleteReviewEntry } from './deleteReviewEntry.server'
import { deleteReviewList } from './deleteReviewList.server'
import { updateReviewEntry } from './updateReviewEntry.server'
import { updateReviewList } from './updateReviewList.server'

const headers = new Headers()
const point = { type: 'Point', coordinates: [13.4, 52.5] }

const mutations = {
  createReviewList: () => createReviewList({ regionSlug: 'berlin', name: 'x' }, headers),
  updateReviewList: () => updateReviewList({ regionSlug: 'berlin', listId: 1, name: 'x' }, headers),
  deleteReviewList: () => deleteReviewList({ regionSlug: 'berlin', listId: 1 }, headers),
  createReviewEntry: () =>
    createReviewEntry({ regionSlug: 'berlin', listId: 1, geometry: point }, headers),
  createReviewEntriesFromGeojson: () =>
    createReviewEntriesFromGeojson(
      { regionSlug: 'berlin', listId: 1, s3Key: 'tmp/review-list-uploads/test/berlin/1/a.geojson' },
      headers,
    ),
  updateReviewEntry: () =>
    updateReviewEntry({ regionSlug: 'berlin', entryId: 1, status: 'OK' }, headers),
  deleteReviewEntry: () => deleteReviewEntry({ regionSlug: 'berlin', entryId: 1 }, headers),
  createReviewEntryComment: () =>
    createReviewEntryComment({ regionSlug: 'berlin', entryId: 1, body: 'x' }, headers),
}

beforeEach(() => {
  dbCalls.length = 0
  dbWrites.length = 0
  listRegionCount.value = 1
  requireAuth.mockReset()
  authorizeRegionMemberByRegionSlug.mockReset()
  requireAuth.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
})

describe('Prüflisten mutations authorization', () => {
  test.each(Object.entries(mutations))(
    '%s: non-member is rejected without DB access',
    async (_, run) => {
      authorizeRegionMemberByRegionSlug.mockRejectedValue(new AuthorizationError('no membership'))

      await expect(run()).rejects.toThrow(AuthorizationError)
      expect(authorizeRegionMemberByRegionSlug).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' }),
        'berlin',
      )
      expect(dbCalls).toEqual([])
    },
  )

  test('updateReviewList: members can only rename, region links are ignored', async () => {
    authorizeRegionMemberByRegionSlug.mockResolvedValue(undefined)

    await updateReviewList(
      // @ts-expect-error `regionSlugs` is not part of the member input (admin-only)
      { regionSlug: 'berlin', listId: 1, name: 'x', regionSlugs: ['hamburg'] },
      headers,
    )
    expect(dbWrites).toEqual([
      {
        call: 'reviewList.update',
        args: expect.not.objectContaining({
          data: expect.objectContaining({ regions: expect.anything() }),
        }),
      },
    ])
  })

  test('deleteReviewList: a list linked to several regions cannot be deleted by members', async () => {
    authorizeRegionMemberByRegionSlug.mockResolvedValue(undefined)
    listRegionCount.value = 2

    await expect(deleteReviewList({ regionSlug: 'berlin', listId: 1 }, headers)).rejects.toThrow(
      'Admin-Bereich',
    )
    expect(dbWrites).toEqual([])
  })
})
