import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'

const { getAppSession, membershipCount } = vi.hoisted(() => ({
  getAppSession: vi.fn(),
  membershipCount: vi.fn(),
}))

vi.mock('@/server/db.server', () => ({ default: { membership: { count: membershipCount } } }))
vi.mock('@/server/auth/session.server', () => ({ getAppSession, requireAdmin: vi.fn() }))

import { guardRegionMembership } from './authGuards.server'

const input = { headers: new Headers(), regionIds: [11, 12] }

beforeEach(() => {
  getAppSession.mockReset()
  membershipCount.mockReset()
})

// Used by API routes for member-only files and downloads (non-public uploads, exports, notes).
describe('guardRegionMembership', () => {
  test('guest gets 401', async () => {
    getAppSession.mockResolvedValue(null)

    expect((await guardRegionMembership(input))?.status).toBe(401)
  })

  test('signed-in non-member gets 403', async () => {
    getAppSession.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
    membershipCount.mockResolvedValue(0)

    expect((await guardRegionMembership(input))?.status).toBe(403)
    expect(membershipCount).toHaveBeenCalledWith({
      where: { userId: 'user-1', regionId: { in: [11, 12] } },
    })
  })

  test('member of any listed region passes', async () => {
    getAppSession.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
    membershipCount.mockResolvedValue(1)

    await expect(guardRegionMembership(input)).resolves.toBeNull()
  })

  test('admin passes without a membership lookup', async () => {
    getAppSession.mockResolvedValue({ userId: 'admin-1', role: UserRoleEnum.ADMIN })

    await expect(guardRegionMembership(input)).resolves.toBeNull()
    expect(membershipCount).not.toHaveBeenCalled()
  })
})
