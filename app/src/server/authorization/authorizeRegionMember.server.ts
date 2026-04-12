import { UserRoleEnum } from '@/prisma/generated/client'
import { AuthorizationError } from '@/server/auth/errors'
import type { AppSession } from '@/server/auth/types'
import db from '@/server/db.server'
import { getRegionIdBySlug } from '@/server/regions/queries/getRegionIdBySlug.server'

async function authorizeRegionMemberByRegionId(session: AppSession, regionId: number) {
  const membership = await db.membership.findFirst({
    where: {
      userId: session.userId,
      regionId,
    },
    select: { id: true },
  })
  if (!membership) {
    throw new AuthorizationError('Region membership or admin required')
  }
}

export async function authorizeRegionMemberByRegionSlug(session: AppSession, slug: string) {
  if (!session.userId || !session.role) {
    throw new AuthorizationError('Not authenticated')
  }
  if (session.role === UserRoleEnum.ADMIN) {
    return
  }
  const regionId = await getRegionIdBySlug(slug)
  await authorizeRegionMemberByRegionId(session, regionId)
}

export async function authorizeRegionMemberByNoteId(session: AppSession, noteId: number) {
  if (!session.userId || !session.role) {
    throw new AuthorizationError('Not authenticated')
  }
  if (session.role === UserRoleEnum.ADMIN) {
    return
  }
  const { regionId } = await db.note.findFirstOrThrow({
    where: { id: noteId },
    select: { regionId: true },
  })
  await authorizeRegionMemberByRegionId(session, regionId)
}
