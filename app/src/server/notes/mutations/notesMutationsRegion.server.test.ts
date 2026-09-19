import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'
import { AuthorizationError } from '@/server/auth/errors'

const {
  noteUpdate,
  noteCommentCreate,
  requireAuth,
  authorizeRegionMemberByRegionSlug,
  assertNoteInRegion,
} = vi.hoisted(() => ({
  noteUpdate: vi.fn(),
  noteCommentCreate: vi.fn(),
  requireAuth: vi.fn(),
  authorizeRegionMemberByRegionSlug: vi.fn(),
  assertNoteInRegion: vi.fn(),
}))

vi.mock('@/server/db.server', () => ({
  default: {
    note: { update: noteUpdate },
    noteComment: { create: noteCommentCreate },
  },
}))
vi.mock('@/server/auth/session.server', () => ({ requireAuth }))
vi.mock('@/server/authorization/authorizeRegionMember.server', () => ({
  authorizeRegionMemberByRegionSlug,
}))
vi.mock('../queries/assertFolderInRegion.server', () => ({
  assertNoteInRegion,
}))
vi.mock('@/server/audit/auditContext.server', () => ({
  memberFormAuditContext: vi.fn(),
  runWithAuditContextAsync: (_ctx: unknown, fn: () => unknown) => fn(),
}))

import { createNoteComment } from './createNoteComment.server'
import { updateNoteResolvedAt } from './updateNoteResolvedAt.server'

const headers = new Headers()

beforeEach(() => {
  noteUpdate.mockReset()
  noteCommentCreate.mockReset()
  requireAuth.mockReset()
  authorizeRegionMemberByRegionSlug.mockReset()
  assertNoteInRegion.mockReset()

  requireAuth.mockResolvedValue({ userId: 'user-1', role: UserRoleEnum.USER })
  authorizeRegionMemberByRegionSlug.mockResolvedValue(undefined)
  assertNoteInRegion.mockResolvedValue(1)
})

describe('note mutations scoped to the acting region', () => {
  test('updateNoteResolvedAt does not write when the note is outside the region', async () => {
    assertNoteInRegion.mockRejectedValue(
      new AuthorizationError('Note does not belong to this region'),
    )

    await expect(
      updateNoteResolvedAt({ regionSlug: 'woldegk', noteId: 99, resolved: true }, headers),
    ).rejects.toThrow(AuthorizationError)
    expect(noteUpdate).not.toHaveBeenCalled()
  })

  test('createNoteComment does not write when the note is outside the region', async () => {
    assertNoteInRegion.mockRejectedValue(
      new AuthorizationError('Note does not belong to this region'),
    )

    await expect(
      createNoteComment({ regionSlug: 'woldegk', noteId: 99, body: 'hi' }, headers),
    ).rejects.toThrow(AuthorizationError)
    expect(noteCommentCreate).not.toHaveBeenCalled()
  })
})
