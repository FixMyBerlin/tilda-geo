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

vi.mock('@/server/db.server', () => ({ default: { qaEvaluation: { findFirstOrThrow, update } } }))
vi.mock('@/server/auth/session.server', () => ({ requireAuth }))
vi.mock('@/server/authorization/authorizeRegionMember.server', () => ({
  authorizeRegionMemberByRegionSlug,
}))

import { updateQaEvaluationBody } from './updateQaEvaluationBody.server'

const headers = new Headers()
const input = { regionSlug: 'berlin', evaluationId: 7, body: 'neu' }

beforeEach(() => {
  vi.clearAllMocks()
  // Admins are not exempt: only the author edits.
  requireAuth.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.ADMIN })
  update.mockResolvedValue({ id: 7 })
})

describe('updateQaEvaluationBody', () => {
  test('author updates the body; lookup is scoped to the region', async () => {
    findFirstOrThrow.mockResolvedValue({ userId: 'user-1', evaluatorType: 'USER' })

    await updateQaEvaluationBody(input, headers)
    expect(findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7, config: { region: { slug: 'berlin' } } },
      }),
    )
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7 }, data: { body: 'neu' } }),
    )
  })

  test.each([
    ['another user', { userId: 'user-2', evaluatorType: 'USER' }],
    ['a system evaluation', { userId: null, evaluatorType: 'SYSTEM' }],
  ])('rejects editing %s', async (_, row) => {
    findFirstOrThrow.mockResolvedValue(row)

    await expect(updateQaEvaluationBody(input, headers)).rejects.toThrow(AuthorizationError)
    expect(update).not.toHaveBeenCalled()
  })

  test('non-member is rejected before any DB access', async () => {
    authorizeRegionMemberByRegionSlug.mockRejectedValueOnce(new AuthorizationError('no membership'))

    await expect(updateQaEvaluationBody(input, headers)).rejects.toThrow(AuthorizationError)
    expect(findFirstOrThrow).not.toHaveBeenCalled()
  })
})
