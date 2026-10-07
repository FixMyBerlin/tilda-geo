import { z } from 'zod'
import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { auditRegionLinksChange } from '@/server/audit/auditRegionLinks.server'
import {
  type MemberCaller,
  memberAuditContext,
  requireMemberSession,
} from '@/server/auth/memberCaller.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { getRegionIdBySlug } from '@/server/regions/queries/getRegionIdBySlug.server'

const Schema = z.object({
  regionSlug: z.string(),
  name: z.string().trim().min(1),
})

/** Create a note folder linked to the acting region. */
export async function createNoteFolder(input: z.infer<typeof Schema>, caller: MemberCaller) {
  const session = await requireMemberSession(caller)
  const { regionSlug, name } = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)
  const regionId = await getRegionIdBySlug(regionSlug)

  return runWithAuditContextAsync(memberAuditContext(caller, session.userId), async () => {
    const created = await db.noteFolder.create({
      data: {
        name,
        createdById: session.userId,
        updatedById: session.userId,
        regions: { connect: { id: regionId } },
      },
      select: { id: true, name: true },
    })
    await auditRegionLinksChange({
      model: 'NoteFolder',
      recordId: created.id,
      oldRegionSlugs: [],
      newRegionSlugs: [regionSlug],
    })
    return created
  })
}
