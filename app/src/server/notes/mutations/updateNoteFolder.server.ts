import { z } from 'zod'
import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import {
  type MemberCaller,
  memberAuditContext,
  requireMemberSession,
} from '@/server/auth/memberCaller.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'

const Schema = z.object({
  regionSlug: z.string(),
  folderId: z.number(),
  name: z.string().trim().min(1),
})

/**
 * Member rename of a note folder linked to the acting region. Region links are admin-only
 * (`updateNoteFolderForAdmin`).
 */
export async function updateNoteFolder(input: z.infer<typeof Schema>, caller: MemberCaller) {
  const session = await requireMemberSession(caller)
  const { regionSlug, folderId, name } = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)

  const folder = await db.noteFolder.findFirstOrThrow({
    where: { id: folderId, regions: { some: { slug: regionSlug } } },
    select: { id: true },
  })

  return runWithAuditContextAsync(memberAuditContext(caller, session.userId), () =>
    db.noteFolder.update({
      where: { id: folder.id },
      data: { updatedById: session.userId, name },
      select: { id: true, name: true },
    }),
  )
}
