import { isNotFound } from '@tanstack/react-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'

const { reviewEntryFindFirst, getAppSession, canAccessMemberModeForRegion } = vi.hoisted(() => ({
  reviewEntryFindFirst: vi.fn(),
  getAppSession: vi.fn(),
  canAccessMemberModeForRegion: vi.fn(),
}))

vi.mock('@/server/db.server', () => ({
  default: { reviewEntry: { findFirst: reviewEntryFindFirst } },
}))

vi.mock('@/server/auth/session.server', () => ({ getAppSession }))

vi.mock('@/server/authorization/canAccessMemberModeForRegion.server', () => ({
  canAccessMemberModeForRegion,
}))

import { getReviewEntry } from './getReviewEntry.server'

const headers = new Headers()

const entryRow = {
  id: 7,
  status: 'OPEN',
  source: 'UPLOAD',
  geometryType: 'POINT',
  properties: { name: 'Kreuzung A' },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  createdBy: { id: 'user-1', osmName: 'alice' },
  updatedBy: null,
  comments: [],
}

beforeEach(() => {
  reviewEntryFindFirst.mockReset()
  getAppSession.mockReset()
  canAccessMemberModeForRegion.mockReset()

  getAppSession.mockResolvedValue({
    userId: 'user-1',
    user: { id: 'user-1' },
    role: UserRoleEnum.USER,
  })
})

describe('getReviewEntry', () => {
  test('public-region non-member throws notFound', async () => {
    canAccessMemberModeForRegion.mockResolvedValue({ isAuthorized: false, regionId: 11 })

    await expect(getReviewEntry({ regionSlug: 'berlin', entryId: 7 }, headers)).rejects.toSatisfy(
      isNotFound,
    )
    expect(reviewEntryFindFirst).not.toHaveBeenCalled()
  })

  test('member returns the row', async () => {
    canAccessMemberModeForRegion.mockResolvedValue({ isAuthorized: true, regionId: 11 })
    reviewEntryFindFirst.mockResolvedValue(entryRow)

    await expect(getReviewEntry({ regionSlug: 'berlin', entryId: 7 }, headers)).resolves.toEqual(
      entryRow,
    )
    expect(reviewEntryFindFirst).toHaveBeenCalledWith({
      where: { id: 7, list: { regions: { some: { slug: 'berlin' } } } },
      select: expect.any(Object),
    })
  })
})
