import { z } from 'zod'
import type { Prisma } from '@/prisma/generated/client'
import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import {
  type MemberCaller,
  memberAuditContext,
  requireMemberSession,
} from '@/server/auth/memberCaller.server'
import db from '@/server/db.server'
import { authorizePlanningRegion } from '@/server/planning/authorizePlanningRegion.server'
import { parseFactorConfigSnapshot } from '@/server/planning/factorConfigSchema'
import { REVIEW_UPLOAD_MAX_FEATURES } from '@/shared/reviewLists/reviewEntryImport'
import {
  buildSpaceFinderReviewProperties,
  spaceFinderImportId,
} from '@/shared/reviewLists/spaceFinderReviewEntry'
import { featureCollectionToEntries } from '../geojson'
import { assertListInRegion } from '../queries/assertListInRegion.server'
import { createReviewList } from './createReviewList.server'

const Schema = z.object({
  regionSlug: z.string(),
  runId: z.number(),
  target: z.union([
    z.object({ listId: z.number() }),
    z.object({ newListName: z.string().trim().min(1) }),
  ]),
  candidates: z
    .array(
      z.object({
        h3Id: z.string().min(1),
        geometry: z.object({
          type: z.enum(['Polygon', 'MultiPolygon']),
          coordinates: z.array(z.any()).min(1),
        }),
        properties: z.record(z.string(), z.unknown()),
      }),
    )
    .min(1)
    .max(REVIEW_UPLOAD_MAX_FEATURES),
})

/**
 * Take over Flächenfinder candidates (hexagons of one run) into a review list (source =
 * SPACE_FINDER). Creates the list when `target.newListName` is given. Candidates already in the
 * list (same `importId`) are skipped and counted.
 */
export async function createReviewEntriesFromSpaceFinder(
  input: z.infer<typeof Schema>,
  caller: MemberCaller,
) {
  const session = await requireMemberSession(caller)
  const { regionSlug, runId, target, candidates } = Schema.parse(input)

  // Member check plus the region's `spaceFinderEnabled` flag.
  await authorizePlanningRegion(session, regionSlug)

  const run = await db.planningRun.findUnique({
    where: { id: runId },
    select: {
      status: true,
      factorConfigSnapshot: true,
      variant: {
        select: {
          id: true,
          title: true,
          area: {
            select: { id: true, title: true, region: { select: { slug: true } } },
          },
        },
      },
    },
  })
  if (!run || run.variant.area.region.slug !== regionSlug) {
    throw new Error('Der Berechnungslauf gehört nicht zu dieser Region.')
  }
  if (run.status !== 'COMPLETE') {
    throw new Error('Der Berechnungslauf ist nicht abgeschlossen.')
  }
  const { variant } = run
  const { area } = variant

  if ('listId' in target) await assertListInRegion(target.listId, regionSlug)

  // Names of the "Eigene Daten" datasets as the run computed them (snapshot, not today's area),
  // so the Teilscores can name them.
  const snapshot = parseFactorConfigSnapshot(run.factorConfigSnapshot)
  const eigendatenNames = Object.fromEntries(
    (snapshot.user_datasets ?? []).map((dataset) => [dataset.id, dataset.name]),
  )

  // Validate and normalize before anything is written (a new list must not stay empty on errors).
  const uniqueCandidates = [...new Map(candidates.map((c) => [c.h3Id, c])).values()]
  const entries = featureCollectionToEntries({
    type: 'FeatureCollection',
    features: uniqueCandidates.map((candidate) => ({
      type: 'Feature',
      id: spaceFinderImportId(candidate.h3Id),
      geometry: candidate.geometry,
      properties: buildSpaceFinderReviewProperties({
        candidateProperties: candidate.properties,
        areaTitle: area.title,
        variantTitle: variant.title,
        h3Id: candidate.h3Id,
        eigendatenNames,
      }),
    })),
  })

  const existingImportIds =
    'listId' in target
      ? new Set(
          (
            await db.reviewEntry.findMany({
              where: { listId: target.listId, importId: { in: entries.map((e) => e.importId) } },
              select: { importId: true },
            })
          ).map((e) => e.importId),
        )
      : new Set<string | null>()
  const newEntries = entries.filter((entry) => !existingImportIds.has(entry.importId))
  const skippedCount = candidates.length - newEntries.length

  const newList =
    'newListName' in target
      ? await createReviewList({ regionSlug, name: target.newListName }, caller)
      : null
  const listId = newList?.id ?? ('listId' in target ? target.listId : 0)

  const importedAt = new Date().toISOString()
  try {
    const result = await runWithAuditContextAsync(memberAuditContext(caller, session.userId), () =>
      db.reviewEntry.createMany({
        data: newEntries.map((entry) => ({
          listId,
          geometry: entry.geometry as Prisma.InputJsonValue,
          geometryType: entry.geometryType,
          properties: entry.properties as Prisma.InputJsonValue,
          importId: entry.importId,
          source: 'SPACE_FINDER' as const,
          sourceMeta: {
            areaId: area.id,
            areaTitle: area.title,
            variantId: variant.id,
            variantTitle: variant.title,
            runId,
            h3Id: entry.importId.replace(/^flaechenfinder:/, ''),
            importedAt,
          },
          createdById: session.userId,
          updatedById: session.userId,
        })),
      }),
    )
    return { listId, createdCount: result.count, skippedCount }
  } catch (error) {
    // Do not leave a freshly created, empty list behind.
    if (newList) await db.reviewList.delete({ where: { id: newList.id } }).catch(() => undefined)
    throw error
  }
}
