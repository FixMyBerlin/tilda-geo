import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'
import { AuthorizationError } from '@/server/auth/errors'

const {
  dbWrites,
  ownerId,
  requireAuth,
  authorizeRegionMemberByRegionSlug,
  noteFindFirstOrThrow,
  noteCommentFindFirstOrThrow,
} = vi.hoisted(() => ({
  dbWrites: [] as string[],
  ownerId: { value: 'author-1' },
  requireAuth: vi.fn(),
  authorizeRegionMemberByRegionSlug: vi.fn(),
  noteFindFirstOrThrow: vi.fn(),
  noteCommentFindFirstOrThrow: vi.fn(),
}))

vi.mock('@/server/db.server', () => ({
  default: {
    note: {
      findFirstOrThrow: noteFindFirstOrThrow,
      update: vi.fn(async () => dbWrites.push('note.update')),
      deleteMany: vi.fn(async () => dbWrites.push('note.deleteMany')),
    },
    noteComment: {
      findFirstOrThrow: noteCommentFindFirstOrThrow,
      update: vi.fn(async () => dbWrites.push('noteComment.update')),
      deleteMany: vi.fn(async () => dbWrites.push('noteComment.deleteMany')),
    },
  },
}))
vi.mock('@/server/auth/session.server', () => ({ requireAuth }))
vi.mock('@/server/authorization/authorizeRegionMember.server', () => ({
  authorizeRegionMemberByRegionSlug,
}))

import { deleteNote } from './deleteNote.server'
import { deleteNoteComment } from './deleteNoteComment.server'
import { updateNote } from './updateNote.server'
import { updateNoteComment } from './updateNoteComment.server'

const headers = new Headers()
const regionSlug = 'woldegk'
const noteInRegionWhere = {
  id: 1,
  folder: { regions: { some: { slug: regionSlug } } },
}
const commentInRegionWhere = {
  id: 1,
  note: { folder: { regions: { some: { slug: regionSlug } } } },
}

const mutations = {
  updateNote: () =>
    updateNote({ regionSlug, noteId: 1, subject: 's', body: 'b', resolved: false }, headers),
  deleteNote: () => deleteNote({ regionSlug, noteId: 1 }, headers),
  updateNoteComment: () => updateNoteComment({ regionSlug, commentId: 1, body: 'b' }, headers),
  deleteNoteComment: () => deleteNoteComment({ regionSlug, commentId: 1 }, headers),
}

beforeEach(() => {
  dbWrites.length = 0
  ownerId.value = 'author-1'
  authorizeRegionMemberByRegionSlug.mockResolvedValue(undefined)
  noteFindFirstOrThrow.mockReset()
  noteCommentFindFirstOrThrow.mockReset()
  noteFindFirstOrThrow.mockResolvedValue({ userId: ownerId.value })
  noteCommentFindFirstOrThrow.mockResolvedValue({ userId: ownerId.value })
})

describe('internal notes: author-only edit and delete', () => {
  test.each(Object.entries(mutations))('%s: author may write', async (_, run) => {
    requireAuth.mockResolvedValue({ userId: 'author-1', role: UserRoleEnum.USER })

    await run()
    expect(dbWrites).toHaveLength(1)
  })

  test.each(
    Object.entries(mutations).flatMap(([name, run]) => [
      [name, 'another member', UserRoleEnum.USER, run] as const,
      [name, 'an admin', UserRoleEnum.ADMIN, run] as const,
    ]),
  )('%s: %s is rejected', async (_, __, role, run) => {
    requireAuth.mockResolvedValue({ userId: 'other-1', role })

    await expect(run()).rejects.toThrow(AuthorizationError)
    expect(dbWrites).toEqual([])
  })

  test('note lookups are scoped to the acting region', async () => {
    requireAuth.mockResolvedValue({ userId: 'author-1', role: UserRoleEnum.USER })

    await mutations.updateNote()
    await mutations.deleteNote()
    expect(noteFindFirstOrThrow).toHaveBeenCalledWith({
      where: noteInRegionWhere,
      select: { userId: true },
    })

    await mutations.updateNoteComment()
    await mutations.deleteNoteComment()
    expect(noteCommentFindFirstOrThrow).toHaveBeenCalledWith({
      where: commentInRegionWhere,
      select: { userId: true },
    })
  })
})
