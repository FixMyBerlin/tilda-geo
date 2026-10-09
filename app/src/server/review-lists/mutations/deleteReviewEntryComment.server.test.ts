import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'
import { AuthorizationError } from '@/server/auth/errors'

const { findFirstOrThrow, remove, requireAuth, authorizeRegionMemberByRegionSlug } = vi.hoisted(
  () => ({
    findFirstOrThrow: vi.fn(),
    remove: vi.fn(),
    requireAuth: vi.fn(),
    authorizeRegionMemberByRegionSlug: vi.fn(),
  }),
)

vi.mock('@/server/db.server', () => ({
  default: { reviewEntryComment: { findFirstOrThrow, delete: remove } },
}))
vi.mock('@/server/auth/session.server', () => ({ requireAuth }))
vi.mock('@/server/authorization/authorizeRegionMember.server', () => ({
  authorizeRegionMemberByRegionSlug,
}))

import { deleteReviewEntryComment } from './deleteReviewEntryComment.server'

const headers = new Headers()
const input = { regionSlug: 'berlin', commentId: 3 }

beforeEach(() => {
  vi.clearAllMocks()
  requireAuth.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
  remove.mockResolvedValue({ id: 3 })
})

describe('deleteReviewEntryComment', () => {
  test('author deletes the comment; lookup is scoped to the region', async () => {
    findFirstOrThrow.mockResolvedValue({ userId: 'user-1' })

    await deleteReviewEntryComment(input, headers)
    expect(findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 3, entry: { list: { regions: { some: { slug: 'berlin' } } } } },
      }),
    )
    expect(remove).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 3 } }))
  })

  test.each([
    ['another member', UserRoleEnum.USER],
    ['an admin', UserRoleEnum.ADMIN],
  ])('%s cannot delete the comment', async (_, role) => {
    requireAuth.mockResolvedValue({ userId: 'user-2', role })
    findFirstOrThrow.mockResolvedValue({ userId: 'user-1' })

    await expect(deleteReviewEntryComment(input, headers)).rejects.toThrow(AuthorizationError)
    expect(remove).not.toHaveBeenCalled()
  })
})
