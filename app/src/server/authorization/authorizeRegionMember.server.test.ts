import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'
import { AuthorizationError } from '@/server/auth/errors'
import type { AppSession } from '@/server/auth/types'

// A note's regions are its folder's regions (`Note.regionId` was removed); membership in ANY of
// those regions is enough — this matters once a folder is shared across several regions.

const { noteFindFirstOrThrow, membershipFindFirst } = vi.hoisted(() => ({
  noteFindFirstOrThrow: vi.fn(),
  membershipFindFirst: vi.fn(),
}))

vi.mock('@/server/db.server', () => ({
  default: {
    note: { findFirstOrThrow: noteFindFirstOrThrow },
    membership: { findFirst: membershipFindFirst },
  },
}))

import { authorizeRegionMemberByNoteId } from './authorizeRegionMember.server'

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
  noteFindFirstOrThrow.mockReset()
  membershipFindFirst.mockReset()
})

describe('authorizeRegionMemberByNoteId', () => {
  test('admin bypasses the membership check without a DB read', async () => {
    await expect(authorizeRegionMemberByNoteId(adminSession, 1)).resolves.toBeUndefined()
    expect(noteFindFirstOrThrow).not.toHaveBeenCalled()
  })

  test('member with a membership in any of the folder regions is authorized', async () => {
    noteFindFirstOrThrow.mockResolvedValue({
      folder: { regions: [{ id: 1 }, { id: 2 }] },
    })
    membershipFindFirst.mockResolvedValue({ id: 99 })

    await expect(authorizeRegionMemberByNoteId(userSession, 1)).resolves.toBeUndefined()
    expect(membershipFindFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1', regionId: { in: [1, 2] } },
      select: { id: true },
    })
  })

  test('member without a membership in any folder region is rejected', async () => {
    noteFindFirstOrThrow.mockResolvedValue({
      folder: { regions: [{ id: 1 }] },
    })
    membershipFindFirst.mockResolvedValue(null)

    await expect(authorizeRegionMemberByNoteId(userSession, 1)).rejects.toThrow(AuthorizationError)
  })
})
