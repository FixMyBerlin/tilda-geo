import { z } from 'zod'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { getRegionIdBySlug } from '@/server/regions/queries/getRegionIdBySlug.server'
import { CreateNoteSchema } from '../schemas'

const Schema = CreateNoteSchema.extend({ regionSlug: z.string() })

export async function createNote(input: z.infer<typeof Schema>, headers: Headers) {
  const session = await requireAuth(headers)
  const parsed = Schema.parse(input)
  const { regionSlug, ...createData } = parsed

  await authorizeRegionMemberByRegionSlug(session, regionSlug)

  const regionId = await getRegionIdBySlug(regionSlug)

  const result = await db.note.create({
    data: { ...createData, regionId, userId: session.userId },
  })
  return result
}
