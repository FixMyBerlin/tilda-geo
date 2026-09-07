import { z } from 'zod'
import type { Prisma } from '@/prisma/generated/client'
import { ReviewEntryStatus } from '@/prisma/generated/enums'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { normalizeGeometry, normalizeProperties } from '@/shared/reviewLists/reviewEntryImport'
import { geojsonTypeToEnum, reviewEntryGeometrySchema } from '../geojson'
import { assertEntryInRegion } from '../queries/assertListInRegion.server'

const Schema = z.object({
  regionSlug: z.string(),
  entryId: z.number(),
  geometry: reviewEntryGeometrySchema.optional(),
  properties: z.record(z.string(), z.unknown()).nullable().optional(),
  status: z.enum(ReviewEntryStatus).optional(),
})

/** Update a review entry's geometry, display properties and/or evaluation status. */
export async function updateReviewEntry(input: z.infer<typeof Schema>, headers: Headers) {
  const session = await requireAuth(headers)
  const { regionSlug, entryId, geometry, properties, status } = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)
  await assertEntryInRegion(entryId, regionSlug)

  const result = await runWithAuditContextAsync(
    memberFormAuditContext(headers, session.userId),
    () =>
      db.reviewEntry.update({
        where: { id: entryId },
        data: {
          updatedById: session.userId,
          ...(geometry
            ? {
                geometry: normalizeGeometry(geometry) as Prisma.InputJsonValue,
                geometryType: geojsonTypeToEnum(geometry.type),
              }
            : {}),
          ...(properties !== undefined
            ? { properties: normalizeProperties(properties) as Prisma.InputJsonValue }
            : {}),
          ...(status ? { status } : {}),
        },
        select: { id: true, status: true },
      }),
  )
  return result
}
