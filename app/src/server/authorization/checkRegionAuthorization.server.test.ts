import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'
import type { AppSession } from '@/server/auth/types'

const { regionFindFirst, membershipFindFirst } = vi.hoisted(() => ({
  regionFindFirst: vi.fn(),
  membershipFindFirst: vi.fn(),
}))

vi.mock('@/server/db.server', () => ({
  default: {
    region: { findFirst: regionFindFirst },
    membership: { findFirst: membershipFindFirst },
  },
}))

import { checkRegionAuthorization } from './checkRegionAuthorization.server'

const session = (role: 'USER' | 'ADMIN', userId: string) =>
  ({ userId, user: { id: userId }, role: UserRoleEnum[role] }) as AppSession

const viewers = {
  guest: null,
  user: session('USER', 'user-1'),
  member: session('USER', 'member-1'),
  admin: session('ADMIN', 'admin-1'),
}

// Region status decides whether the region opens. Member-only data needs more (see docs/Permissions.md).
const expected = {
  PUBLIC: { guest: true, user: true, member: true, admin: true },
  PRIVATE: { guest: false, user: false, member: true, admin: true },
  DEACTIVATED: { guest: false, user: false, member: false, admin: true },
} as const

beforeEach(() => {
  regionFindFirst.mockReset()
  membershipFindFirst.mockReset()
  membershipFindFirst.mockImplementation(async ({ where }) =>
    where.userId === 'member-1' ? { id: 1 } : null,
  )
})

describe('checkRegionAuthorization', () => {
  const cases = Object.entries(expected).flatMap(([status, byViewer]) =>
    Object.entries(byViewer).map(([viewer, isAuthorized]) => ({ status, viewer, isAuthorized })),
  )

  test.each(cases)(
    '$status region, $viewer → $isAuthorized',
    async ({ status, viewer, isAuthorized }) => {
      regionFindFirst.mockResolvedValue({ id: 11, slug: 'berlin', status })

      const result = await checkRegionAuthorization(
        viewers[viewer as keyof typeof viewers],
        'berlin',
      )
      expect(result.isAuthorized).toBe(isAuthorized)
    },
  )

  test('unknown region is not authorized, even for admins', async () => {
    regionFindFirst.mockResolvedValue(null)

    await expect(checkRegionAuthorization(viewers.admin, 'nope')).resolves.toEqual({
      isAuthorized: false,
    })
  })
})
