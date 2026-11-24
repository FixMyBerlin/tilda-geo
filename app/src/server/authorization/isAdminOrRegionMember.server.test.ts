import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'

const membershipCount = vi.hoisted(() => vi.fn())
vi.mock('@/server/db.server', () => ({ default: { membership: { count: membershipCount } } }))

import { isAdminOrRegionMember } from './isAdminOrRegionMember.server'

const user = { userId: 'user-1', role: UserRoleEnum.USER }

beforeEach(() => {
  membershipCount.mockReset()
})

describe('isAdminOrRegionMember', () => {
  test('admin passes without a membership lookup', async () => {
    await expect(isAdminOrRegionMember({ ...user, role: UserRoleEnum.ADMIN }, [11])).resolves.toBe(
      true,
    )
    expect(membershipCount).not.toHaveBeenCalled()
  })

  test('member of one of the regions passes; memberships of DEACTIVATED regions do not count', async () => {
    membershipCount.mockResolvedValue(1)

    await expect(isAdminOrRegionMember(user, [11, 12])).resolves.toBe(true)
    expect(membershipCount).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        regionId: { in: [11, 12] },
        region: { status: { not: 'DEACTIVATED' } },
      },
    })
  })

  test('non-member does not pass', async () => {
    membershipCount.mockResolvedValue(0)

    await expect(isAdminOrRegionMember(user, [11])).resolves.toBe(false)
  })

  test('without regions only an admin passes, and nothing is looked up for others', async () => {
    await expect(isAdminOrRegionMember(user, [])).resolves.toBe(false)
    expect(membershipCount).not.toHaveBeenCalled()
    await expect(isAdminOrRegionMember({ ...user, role: UserRoleEnum.ADMIN }, [])).resolves.toBe(
      true,
    )
  })
})
