import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'

const {
  noteFolderFindFirstOrThrow,
  noteFolderDelete,
  requireAuth,
  authorizeRegionMemberByRegionSlug,
} = vi.hoisted(() => ({
  noteFolderFindFirstOrThrow: vi.fn(),
  noteFolderDelete: vi.fn(),
  requireAuth: vi.fn(),
  authorizeRegionMemberByRegionSlug: vi.fn(),
}))

vi.mock('@/server/db.server', () => ({
  default: {
    noteFolder: {
      findFirstOrThrow: noteFolderFindFirstOrThrow,
      delete: noteFolderDelete,
    },
  },
}))
vi.mock('@/server/auth/session.server', () => ({ requireAuth }))
vi.mock('@/server/authorization/authorizeRegionMember.server', () => ({
  authorizeRegionMemberByRegionSlug,
}))

import { deleteNoteFolder } from './deleteNoteFolder.server'

const headers = new Headers()

beforeEach(() => {
  noteFolderFindFirstOrThrow.mockReset()
  noteFolderDelete.mockReset()
  requireAuth.mockReset()
  authorizeRegionMemberByRegionSlug.mockReset()

  requireAuth.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
  authorizeRegionMemberByRegionSlug.mockResolvedValue(undefined)
})

describe('deleteNoteFolder', () => {
  test('blocks deletion when the folder has notes', async () => {
    noteFolderFindFirstOrThrow.mockResolvedValue({
      id: 1,
      _count: { notes: 2, regions: 1 },
    })

    await expect(deleteNoteFolder({ regionSlug: 'woldegk', folderId: 1 }, headers)).rejects.toThrow(
      'Nur leere Ordner können gelöscht werden.',
    )
    expect(noteFolderDelete).not.toHaveBeenCalled()
  })

  test('blocks deletion of an empty folder shared with other regions', async () => {
    noteFolderFindFirstOrThrow.mockResolvedValue({
      id: 1,
      _count: { notes: 0, regions: 2 },
    })

    await expect(deleteNoteFolder({ regionSlug: 'woldegk', folderId: 1 }, headers)).rejects.toThrow(
      'Dieser Ordner ist mehreren Regionen zugeordnet und kann nur im Admin-Bereich gelöscht werden.',
    )
    expect(noteFolderDelete).not.toHaveBeenCalled()
  })

  test('deletes an empty folder linked to only the acting region', async () => {
    noteFolderFindFirstOrThrow.mockResolvedValue({
      id: 1,
      _count: { notes: 0, regions: 1 },
    })

    await deleteNoteFolder({ regionSlug: 'woldegk', folderId: 1 }, headers)

    expect(noteFolderDelete).toHaveBeenCalledWith({ where: { id: 1 } })
  })
})
