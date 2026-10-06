import { ZodError, z } from 'zod'
import type { Prisma } from '@/prisma/generated/client'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { featureCollectionToEntries } from '../geojson'
import { assertListInRegion } from '../queries/assertListInRegion.server'
import {
  deleteReviewListUploadS3Object,
  getReviewListUploadJson,
  reviewListUploadKeyPrefix,
} from '../reviewListUploadsS3.server'

const Schema = z.object({
  regionSlug: z.string(),
  listId: z.number(),
  filename: z.string().optional(),
  /** Temporary S3 object from better-upload; deleted after import. */
  s3Key: z.string().min(1),
})

/** Bulk-create review entries from a GeoJSON FeatureCollection uploaded to S3 (source = UPLOAD). */
export async function createReviewEntriesFromGeojson(
  input: z.infer<typeof Schema>,
  headers: Headers,
) {
  const session = await requireAuth(headers)
  const { regionSlug, listId, filename, s3Key } = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)
  await assertListInRegion(listId, regionSlug)

  if (!s3Key.startsWith(reviewListUploadKeyPrefix({ regionSlug, listId }))) {
    throw new Error('Der Upload gehört nicht zu dieser Prüfliste.')
  }

  let featureCollection: unknown
  try {
    featureCollection = await getReviewListUploadJson(s3Key)
  } catch (error) {
    await deleteReviewListUploadS3Object(s3Key)
    throw new Error(
      `GeoJSON konnte nicht aus dem Upload gelesen werden: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }

  let entries
  try {
    entries = featureCollectionToEntries(featureCollection)
  } catch (error) {
    await deleteReviewListUploadS3Object(s3Key)
    if (error instanceof ZodError) {
      throw new Error(`Ungültiges GeoJSON: ${error.issues[0]?.message ?? error.message}`)
    }
    throw error
  }

  const sourceMeta = { filename: filename ?? null, importedAt: new Date().toISOString() }
  // Duplicate detection against existing entries happens client-side in classifyImportFeatures
  // (`app/src/shared/reviewLists/reviewEntryImport.ts`); the UI uploads only new features; the
  // server appends what it receives. A direct RPC with a full file can create duplicates —
  // accepted trade-off to keep the server path simple.
  const result = await runWithAuditContextAsync(
    memberFormAuditContext(headers, session.userId),
    () =>
      db.reviewEntry.createMany({
        data: entries.map((entry) => ({
          listId,
          geometry: entry.geometry as Prisma.InputJsonValue,
          geometryType: entry.geometryType,
          // Always persist the object (`{}` when empty), matching updateReviewEntry — never omit.
          properties: entry.properties as Prisma.InputJsonValue,
          importId: entry.importId,
          source: 'UPLOAD' as const,
          sourceMeta,
          createdById: session.userId,
          updatedById: session.userId,
        })),
      }),
  )

  await deleteReviewListUploadS3Object(s3Key)

  return { count: result.count }
}
