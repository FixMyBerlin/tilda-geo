import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'
import type { AppSession } from '@/server/auth/types'

const { regionFindFirst, membershipCount } = vi.hoisted(() => ({
  regionFindFirst: vi.fn(),
  membershipCount: vi.fn(),
}))

vi.mock('@/server/db.server', () => ({
  default: {
    region: { findFirst: regionFindFirst },
    membership: { count: membershipCount },
  },
}))

import { canAccessMemberModeForRegion } from './canAccessMemberModeForRegion.server'

const publicRegion = { id: 11, slug: 'berlin', status: 'PUBLIC' }
const deactivatedRegion = { id: 22, slug: 'old', status: 'DEACTIVATED' }

const userSession = {
  userId: 'user-1',
  user: { id: 'user-1' },
  role: UserRoleEnum.USER,
} as AppSession

const adminSession = {
  userId: 'admin-1',
  user: { id: 'admin-1' },
  role: UserRoleEnum.ADMIN,
} as AppSession

beforeEach(() => {
  regionFindFirst.mockReset()
  membershipCount.mockReset()
})

describe('canAccessMemberModeForRegion', () => {
  test('guest (no session) is not authorized on a public region', async () => {
    regionFindFirst.mockResolvedValue(publicRegion)

    await expect(canAccessMemberModeForRegion(null, 'berlin')).resolves.toEqual({
      isAuthorized: false,
      regionId: 11,
    })
    expect(membershipCount).not.toHaveBeenCalled()
  })

  test('public-region non-member is not authorized', async () => {
    regionFindFirst.mockResolvedValue(publicRegion)
    membershipCount.mockResolvedValue(0)

    await expect(canAccessMemberModeForRegion(userSession, 'berlin')).resolves.toEqual({
      isAuthorized: false,
      regionId: 11,
    })
  })

  test('member is authorized', async () => {
    regionFindFirst.mockResolvedValue(publicRegion)
    membershipCount.mockResolvedValue(1)

    await expect(canAccessMemberModeForRegion(userSession, 'berlin')).resolves.toEqual({
      isAuthorized: true,
      regionId: 11,
    })
  })

  test('admin is authorized', async () => {
    regionFindFirst.mockResolvedValue(publicRegion)

    await expect(canAccessMemberModeForRegion(adminSession, 'berlin')).resolves.toEqual({
      isAuthorized: true,
      regionId: 11,
    })
    expect(membershipCount).not.toHaveBeenCalled()
  })

  test('DEACTIVATED region is not authorized', async () => {
    regionFindFirst.mockResolvedValue(deactivatedRegion)

    await expect(canAccessMemberModeForRegion(userSession, 'old')).resolves.toEqual({
      isAuthorized: false,
    })
    expect(membershipCount).not.toHaveBeenCalled()
  })
})
