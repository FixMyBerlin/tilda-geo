import { beforeEach, describe, expect, test, vi } from 'vitest'
import { UserRoleEnum } from '@/prisma/generated/enums'
import { AuthorizationError } from '@/server/auth/errors'

// Internal notes and their comments can only be edited or deleted by their author. Admins pass the
// membership check but get no ownership bypass.

const { dbWrites, ownerId, requireAuth, authorizeRegionMemberByRegionSlug } = vi.hoisted(() => ({
  dbWrites: [] as string[],
  ownerId: { value: 'author-1' },
  requireAuth: vi.fn(),
  authorizeRegionMemberByRegionSlug: vi.fn(),
}))

vi.mock('@/server/db.server', () => {
  const model = (name: string) => ({
    findFirstOrThrow: vi.fn(async () => ({ userId: ownerId.value })),
    update: vi.fn(async () => dbWrites.push(`${name}.update`)),
    updateMany: vi.fn(async () => dbWrites.push(`${name}.updateMany`)),
    deleteMany: vi.fn(async () => dbWrites.push(`${name}.deleteMany`)),
  })
  return { default: { note: model('note'), noteComment: model('noteComment') } }
})
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
})
