import { z } from 'zod'
import type { Prisma } from '@/prisma/generated/client'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { normalizeGeometry, normalizeProperties } from '@/shared/reviewLists/reviewEntryImport'
import { geojsonTypeToEnum, reviewEntryGeometrySchema } from '../geojson'
import { assertListInRegion } from '../queries/assertListInRegion.server'

const Schema = z.object({
  regionSlug: z.string(),
  listId: z.number(),
  geometry: reviewEntryGeometrySchema,
  properties: z.record(z.string(), z.unknown()).optional(),
})

/** Create a single manually drawn review entry (source = MANUAL, attributed to the author). */
export async function createReviewEntry(input: z.infer<typeof Schema>, headers: Headers) {
  const session = await requireAuth(headers)
  const { regionSlug, listId, geometry, properties } = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)
  await assertListInRegion(listId, regionSlug)

  const normalizedGeometry = normalizeGeometry(geometry)
  const result = await runWithAuditContextAsync(
    memberFormAuditContext(headers, session.userId),
    () =>
      db.reviewEntry.create({
        data: {
          listId,
          geometry: normalizedGeometry as Prisma.InputJsonValue,
          geometryType: geojsonTypeToEnum(geometry.type),
          properties: normalizeProperties(properties) as Prisma.InputJsonValue,
          source: 'MANUAL',
          sourceMeta: { drawnAt: new Date().toISOString() },
          createdById: session.userId,
          updatedById: session.userId,
        },
        select: { id: true },
      }),
  )
  return result
}
