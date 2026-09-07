import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'

const { reviewEntryUpdate, requireAuth, authorizeRegionMemberByRegionSlug, assertEntryInRegion } =
  vi.hoisted(() => ({
    reviewEntryUpdate: vi.fn(),
    requireAuth: vi.fn(),
    authorizeRegionMemberByRegionSlug: vi.fn(),
    assertEntryInRegion: vi.fn(),
  }))

vi.mock('@/server/db.server', () => ({
  default: { reviewEntry: { update: reviewEntryUpdate } },
}))

vi.mock('@/server/auth/session.server', () => ({ requireAuth }))

vi.mock('@/server/authorization/authorizeRegionMember.server', () => ({
  authorizeRegionMemberByRegionSlug,
}))

vi.mock('../queries/assertListInRegion.server', () => ({ assertEntryInRegion }))

import { updateReviewEntry } from './updateReviewEntry.server'

const headers = new Headers()

beforeEach(() => {
  reviewEntryUpdate.mockReset()
  requireAuth.mockReset()
  authorizeRegionMemberByRegionSlug.mockReset()
  assertEntryInRegion.mockReset()

  requireAuth.mockResolvedValue({
    userId: 'user-1',
    user: { id: 'user-1' },
    role: UserRoleEnum.ADMIN,
  })
  authorizeRegionMemberByRegionSlug.mockResolvedValue(undefined)
  assertEntryInRegion.mockResolvedValue(7)
  reviewEntryUpdate.mockResolvedValue({ id: 7, status: 'OPEN' })
})

describe('updateReviewEntry', () => {
  test('writes {} when an empty properties object is submitted so the last key can be cleared', async () => {
    await updateReviewEntry({ regionSlug: 'berlin', entryId: 7, properties: {} }, headers)

    expect(reviewEntryUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        updatedById: 'user-1',
        properties: {},
      },
      select: { id: true, status: true },
    })
  })

  test('does not touch properties when the field is omitted', async () => {
    await updateReviewEntry({ regionSlug: 'berlin', entryId: 7, status: 'OK' }, headers)

    expect(reviewEntryUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        updatedById: 'user-1',
        status: 'OK',
      },
      select: { id: true, status: true },
    })
  })
})
