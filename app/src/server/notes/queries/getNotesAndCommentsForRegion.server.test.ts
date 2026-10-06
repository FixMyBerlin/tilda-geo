import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'

const { noteFindMany, getAppSession, canAccessMemberModeForRegion } = vi.hoisted(() => ({
  noteFindMany: vi.fn(),
  getAppSession: vi.fn(),
  canAccessMemberModeForRegion: vi.fn(),
}))

vi.mock('@/server/db.server', () => ({
  default: {
    note: { findMany: noteFindMany },
  },
}))
vi.mock('@/server/auth/session.server', () => ({ getAppSession }))
vi.mock('@/server/authorization/canAccessMemberModeForRegion.server', () => ({
  canAccessMemberModeForRegion,
}))

import { getNotesAndCommentsForRegion } from './getNotesAndCommentsForRegion.server'

const headers = new Headers()

beforeEach(() => {
  noteFindMany.mockReset()
  getAppSession.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
  noteFindMany.mockResolvedValue([])
})

// Internal notes are member-only regardless of region status: PUBLIC only opens the map.
describe('getNotesAndCommentsForRegion', () => {
  test('non-member (e.g. on a PUBLIC region) gets no notes and no DB read', async () => {
    canAccessMemberModeForRegion.mockResolvedValue({ isAuthorized: false, regionId: 11 })

    const result = await getNotesAndCommentsForRegion(
      { regionSlug: 'woldegk', folderId: 1 },
      headers,
    )
    expect(result.featureCollection.features).toEqual([])
    expect(noteFindMany).not.toHaveBeenCalled()
  })

  test('member reads notes of a folder linked to the region', async () => {
    canAccessMemberModeForRegion.mockResolvedValue({ isAuthorized: true, regionId: 11 })

    await getNotesAndCommentsForRegion({ regionSlug: 'woldegk', folderId: 1 }, headers)
    expect(noteFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { folderId: 1, folder: { regions: { some: { slug: 'woldegk' } } } },
      }),
    )
  })
})
