import { notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { getAppSession } from '@/server/auth/session.server'
import { canAccessMemberModeForRegion } from '@/server/authorization/canAccessMemberModeForRegion.server'
import db from '@/server/db.server'

const Schema = z.object({
  regionSlug: z.string(),
  entryId: z.number(),
})

/** A single review entry with its comments (for the right inspector). */
export async function getReviewEntry(input: z.infer<typeof Schema>, headers: Headers) {
  const { regionSlug, entryId } = Schema.parse(input)

  const session = await getAppSession(headers)
  const { isAuthorized } = await canAccessMemberModeForRegion(session, regionSlug)
  if (!isAuthorized) throw notFound()

  const entry = await db.reviewEntry.findFirst({
    where: { id: entryId, list: { regions: { some: { slug: regionSlug } } } },
    select: {
      id: true,
      status: true,
      source: true,
      geometryType: true,
      properties: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { id: true, osmName: true } },
      updatedBy: { select: { id: true, osmName: true } },
      comments: {
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { id: true, osmName: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!entry) throw notFound()
  return entry
}
