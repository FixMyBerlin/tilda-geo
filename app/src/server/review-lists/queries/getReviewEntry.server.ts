import { notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { type MemberCaller, getMemberSession } from '@/server/auth/memberCaller.server'
import { canAccessMemberModeForRegion } from '@/server/authorization/canAccessMemberModeForRegion.server'
import db from '@/server/db.server'
import { parseSpaceFinderSourceMeta } from '@/shared/reviewLists/spaceFinderReviewEntry'
import { parseStoredProperties } from '../geojson'

const Schema = z.object({
  regionSlug: z.string(),
  entryId: z.number(),
})

/** A single review entry with its comments (for the right inspector). */
export async function getReviewEntry(input: z.infer<typeof Schema>, caller: MemberCaller) {
  const { regionSlug, entryId } = Schema.parse(input)

  const session = await getMemberSession(caller)
  const { isAuthorized } = await canAccessMemberModeForRegion(session, regionSlug)
  if (!isAuthorized) throw notFound()

  const entry = await db.reviewEntry.findFirst({
    where: { id: entryId, list: { regions: { some: { slug: regionSlug } } } },
    select: {
      id: true,
      status: true,
      source: true,
      sourceMeta: true,
      geometryType: true,
      properties: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { id: true, osmName: true, firstName: true, lastName: true } },
      updatedBy: { select: { id: true, osmName: true, firstName: true, lastName: true } },
      comments: {
        select: {
          id: true,
          body: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { id: true, osmName: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!entry) throw notFound()

  // Link target for Flächenfinder entries. Looked up (not a relation) because the Variante may be
  // deleted, and only counts when it belongs to this region: a list can be shared with regions the
  // Variante does not belong to.
  const origin =
    entry.source === 'SPACE_FINDER' ? parseSpaceFinderSourceMeta(entry.sourceMeta) : null
  const spaceFinderVariant =
    origin?.variantId != null
      ? await db.planningVariant.findFirst({
          where: { id: origin.variantId, area: { region: { slug: regionSlug } } },
          select: { id: true, currentRunId: true },
        })
      : null

  return { ...entry, properties: parseStoredProperties(entry.properties), spaceFinderVariant }
}
