import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'
import { AuthorizationError } from '@/server/auth/errors'
import type { AppSession } from '@/server/auth/types'

const { regionFindFirstOrThrow, authorizeMember } = vi.hoisted(() => ({
  regionFindFirstOrThrow: vi.fn(),
  authorizeMember: vi.fn(),
}))

vi.mock('@/server/db.server', () => ({
  default: { region: { findFirstOrThrow: regionFindFirstOrThrow } },
}))
vi.mock('@/server/authorization/authorizeRegionMember.server', () => ({
  authorizeRegionMemberByRegionSlug: authorizeMember,
}))

import { authorizePlanningRegion } from './authorizePlanningRegion.server'

const session = { userId: 'u1', user: { id: 'u1' }, role: UserRoleEnum.USER } as AppSession
const adminSession = { userId: 'a1', user: { id: 'a1' }, role: UserRoleEnum.ADMIN } as AppSession

beforeEach(() => {
  regionFindFirstOrThrow.mockReset()
  authorizeMember.mockReset()
})

describe('authorizePlanningRegion', () => {
  test('passes for a member when the flag is on', async () => {
    regionFindFirstOrThrow.mockResolvedValue({ spaceFinderEnabled: true })
    await expect(authorizePlanningRegion(session, 'r')).resolves.toBeUndefined()
  })

  test('throws when the flag is off, also for admins', async () => {
    regionFindFirstOrThrow.mockResolvedValue({ spaceFinderEnabled: false })
    await expect(authorizePlanningRegion(session, 'r')).rejects.toBeInstanceOf(AuthorizationError)
    await expect(authorizePlanningRegion(adminSession, 'r')).rejects.toBeInstanceOf(
      AuthorizationError,
    )
  })

  test('propagates the membership error before reading the flag', async () => {
    authorizeMember.mockRejectedValue(new AuthorizationError('Region membership or admin required'))
    await expect(authorizePlanningRegion(session, 'r')).rejects.toThrow('membership')
    expect(regionFindFirstOrThrow).not.toHaveBeenCalled()
  })
})
