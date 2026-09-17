import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'
import { AuthorizationError } from '@/server/auth/errors'

// Guard test for the member-facing Prüflisten mutations: a failed membership check must abort
// before any database write. Server functions are callable without the route guards, so this is
// the real security boundary.

const { dbCalls, requireAuth, authorizeRegionMemberByRegionSlug } = vi.hoisted(() => ({
  dbCalls: [] as string[],
  requireAuth: vi.fn(),
  authorizeRegionMemberByRegionSlug: vi.fn(),
}))

vi.mock('@/server/db.server', () => {
  const model = (name: string) =>
    new Proxy(
      {},
      {
        get: (_target, method: string) =>
          vi.fn(async () => {
            dbCalls.push(`${name}.${method}`)
            return { id: 1, regions: [{ slug: 'berlin' }], _count: { entries: 0, regions: 1 } }
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

  test('updateReviewList: sharing into a region the user is not a member of is rejected', async () => {
    authorizeRegionMemberByRegionSlug.mockImplementation(async (_session, slug: string) => {
      if (slug !== 'berlin') throw new AuthorizationError('no membership')
    })

    await expect(
      updateReviewList(
        { regionSlug: 'berlin', listId: 1, regionSlugs: ['berlin', 'hamburg'] },
        headers,
      ),
    ).rejects.toThrow(AuthorizationError)
    expect(dbCalls.filter((call) => call.endsWith('.update'))).toEqual([])
  })
})
