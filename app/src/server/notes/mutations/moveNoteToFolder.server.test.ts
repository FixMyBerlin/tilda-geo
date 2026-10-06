import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'
import { AuthorizationError } from '@/server/auth/errors'

const {
  noteUpdate,
  requireAuth,
  authorizeRegionMemberByRegionSlug,
  assertNoteInRegion,
  assertFolderInRegion,
} = vi.hoisted(() => ({
  noteUpdate: vi.fn(),
  requireAuth: vi.fn(),
  authorizeRegionMemberByRegionSlug: vi.fn(),
  assertNoteInRegion: vi.fn(),
  assertFolderInRegion: vi.fn(),
}))

vi.mock('@/server/db.server', () => ({
  default: { note: { update: noteUpdate } },
}))
vi.mock('@/server/auth/session.server', () => ({ requireAuth }))
vi.mock('@/server/authorization/authorizeRegionMember.server', () => ({
  authorizeRegionMemberByRegionSlug,
}))
vi.mock('../queries/assertFolderInRegion.server', () => ({
  assertNoteInRegion,
  assertFolderInRegion,
}))
vi.mock('@/server/audit/auditContext.server', () => ({
  memberFormAuditContext: vi.fn(),
  runWithAuditContextAsync: (_ctx: unknown, fn: () => unknown) => fn(),
}))

import { moveNoteToFolder } from './moveNoteToFolder.server'

const headers = new Headers()

beforeEach(() => {
  noteUpdate.mockReset()
  requireAuth.mockReset()
  authorizeRegionMemberByRegionSlug.mockReset()
  assertNoteInRegion.mockReset()
  assertFolderInRegion.mockReset()

  requireAuth.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
  authorizeRegionMemberByRegionSlug.mockResolvedValue(undefined)
  assertNoteInRegion.mockResolvedValue(1)
  noteUpdate.mockResolvedValue({ id: 1, folderId: 2 })
})

describe('moveNoteToFolder', () => {
  test('moves the note once both the note and the target folder are confirmed in-region', async () => {
    assertFolderInRegion.mockResolvedValue(2)

    const result = await moveNoteToFolder(
      { regionSlug: 'woldegk', noteId: 1, folderId: 2 },
      headers,
    )

    expect(result).toEqual({ id: 1, folderId: 2 })
    expect(noteUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { folderId: 2 },
      select: { id: true, folderId: true },
    })
  })

  test('rejects a target folder outside the acting region', async () => {
    assertFolderInRegion.mockRejectedValue(
      new AuthorizationError('Note folder does not belong to this region'),
    )

    await expect(
      moveNoteToFolder({ regionSlug: 'woldegk', noteId: 1, folderId: 999 }, headers),
    ).rejects.toThrow(AuthorizationError)
    expect(noteUpdate).not.toHaveBeenCalled()
  })
})
