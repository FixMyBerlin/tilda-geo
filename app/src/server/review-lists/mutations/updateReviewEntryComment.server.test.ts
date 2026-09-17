import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'
import { AuthorizationError } from '@/server/auth/errors'

const { findFirstOrThrow, update, requireAuth, authorizeRegionMemberByRegionSlug } = vi.hoisted(
  () => ({
    findFirstOrThrow: vi.fn(),
    update: vi.fn(),
    requireAuth: vi.fn(),
    authorizeRegionMemberByRegionSlug: vi.fn(),
  }),
)

vi.mock('@/server/db.server', () => ({
  default: { reviewEntryComment: { findFirstOrThrow, update } },
}))
vi.mock('@/server/auth/session.server', () => ({ requireAuth }))
vi.mock('@/server/authorization/authorizeRegionMember.server', () => ({
  authorizeRegionMemberByRegionSlug,
}))

import { updateReviewEntryComment } from './updateReviewEntryComment.server'

const headers = new Headers()
const input = { regionSlug: 'berlin', commentId: 3, body: 'neu' }

beforeEach(() => {
  vi.clearAllMocks()
  requireAuth.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
  update.mockResolvedValue({ id: 3 })
})

describe('updateReviewEntryComment', () => {
  test('author updates the comment; lookup is scoped to the region', async () => {
    findFirstOrThrow.mockResolvedValue({ userId: 'user-1' })

    await updateReviewEntryComment(input, headers)
    expect(findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 3, entry: { list: { regions: { some: { slug: 'berlin' } } } } },
      }),
    )
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 3 }, data: { body: 'neu' } }),
    )
  })

  test('another member cannot edit the comment', async () => {
    findFirstOrThrow.mockResolvedValue({ userId: 'user-2' })

    await expect(updateReviewEntryComment(input, headers)).rejects.toThrow(AuthorizationError)
    expect(update).not.toHaveBeenCalled()
  })
})
