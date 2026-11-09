import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { exportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import { getMasterportalByTableName, getTopicDocByTableName } from '@/data/topicDocs/runtime'
import { getMapillaryCoverageMetadata } from '@/server/api/util/getMapillaryCoverageMetadata.server'
import { getAppSession } from '@/server/auth/session.server'
import { checkRegionAuthorization } from '@/server/authorization/checkRegionAuthorization.server'
import { getRegionHasPermissions } from '@/server/authorization/getRegionHasPermissions.server'
import db from '@/server/db.server'
import { getRegion } from '@/server/regions/queries/getRegion.server'

export const getMapillaryCoverageMetadataLoaderFn = createServerFn({ method: 'GET' }).handler(
  async () => getMapillaryCoverageMetadata(),
)

const getRegionForDocsInputSchema = z.object({
  slug: z.string(),
})

export const getRegionForDocsLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.input<typeof getRegionForDocsInputSchema>) =>
    getRegionForDocsInputSchema.parse(data),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const appSession = await getAppSession(headers)
    const { isAuthorized } = await checkRegionAuthorization(appSession, data.slug)
    if (!isAuthorized) {
      return null
    }

    const region = await getRegion({ slug: data.slug })
    const hasDownloadPermissions = await getRegionHasPermissions(appSession, data.slug)

    return { region, hasDownloadPermissions }
  })

/** Distinct export table names referenced by any region — drives the docs "available datasets" filter. */
export const getRegionExportTableNamesForDocsLoaderFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const rows = await db.regionExportAssignment.findMany({
      distinct: ['exportId'],
      select: { exportId: true },
    })
    return rows.map((row) => row.exportId)
  },
)

const getTopicDocForDocsInputSchema = z.object({
  tableName: z.enum(exportApiIdentifier),
})

/** Full topic doc of one table, so the docs page does not ship the docs of all tables. */
export const getTopicDocForDocsLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.input<typeof getTopicDocForDocsInputSchema>) =>
    getTopicDocForDocsInputSchema.parse(data),
  )
  .handler(async ({ data: { tableName } }) => {
    const topicDoc = getTopicDocByTableName(tableName)
    const groupDocs = topicDoc?.groups?.length
      ? exportApiIdentifier
          .map((candidateTableName) => ({
            tableName: candidateTableName,
            topicDoc: getTopicDocByTableName(candidateTableName),
          }))
          .filter(
            (candidate) =>
              candidate.topicDoc?.groups?.some((group) =>
                topicDoc.groups?.some((currentGroup) => currentGroup.id === group.id),
              ) ?? false,
          )
      : []

    return { topicDoc, masterportal: getMasterportalByTableName(tableName), groupDocs }
  })
