import { z } from 'zod'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { getRegionIdBySlug } from '@/server/regions/queries/getRegionIdBySlug.server'

const Schema = z.object({
  regionSlug: z.string(),
  name: z.string().trim().min(1),
})

/** Create a note folder linked to the acting region. */
export async function createNoteFolder(input: z.infer<typeof Schema>, headers: Headers) {
  const session = await requireAuth(headers)
  const { regionSlug, name } = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)
  const regionId = await getRegionIdBySlug(regionSlug)

  return db.noteFolder.create({
    data: {
      name,
      createdById: session.userId,
      updatedById: session.userId,
      regions: { connect: { id: regionId } },
    },
    select: { id: true, name: true },
  })
}
