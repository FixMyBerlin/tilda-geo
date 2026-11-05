import { createFileRoute, notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { PageDocsTableName } from '@/components/pages/docs/PageDocsTableName'
import { exportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import { optionalSearchString } from '@/lib/searchParamsSchema'
import {
  getRegionExportTableNamesForDocsLoaderFn,
  getRegionForDocsLoaderFn,
  getTopicDocForDocsLoaderFn,
} from '@/server/api/docs.functions'

const docsSearchSchema = z.object({
  r: optionalSearchString(),
})

export const Route = createFileRoute('/_pages/docs/$tableName')({
  ssr: true,
  validateSearch: (search) => docsSearchSchema.parse(search),
  loaderDeps: ({ search: { r } }) => ({ r }),
  loader: async ({ params, deps }) => {
    const tableNameSchema = z.enum(exportApiIdentifier)
    const parsed = tableNameSchema.safeParse(params.tableName)

    if (!parsed.success) {
      throw notFound()
    }

    const tableName = parsed.data
    const [{ topicDoc, masterportal, groupDocs }, regionContext, allRegionExportTables] =
      await Promise.all([
        getTopicDocForDocsLoaderFn({ data: { tableName } }),
        deps.r ? getRegionForDocsLoaderFn({ data: { slug: deps.r } }) : null,
        getRegionExportTableNamesForDocsLoaderFn(),
      ])
    const region = regionContext?.region ?? null
    const hasDownloadPermissions = regionContext?.hasDownloadPermissions ?? false
    const showDownloads =
      region != null &&
      hasDownloadPermissions &&
      region.bbox != null &&
      region.exports != null &&
      region.exports.includes(tableName)

    return {
      tableName,
      topicDoc,
      masterportal,
      groupDocs,
      region,
      hasDownloadPermissions,
      showDownloads,
      allRegionExportTables,
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] }
    const { topicDoc, tableName } = loaderData
    return {
      meta: [
        { name: 'robots', content: 'noindex' },
        {
          title: topicDoc?.title
            ? `Dokumentation für ${topicDoc.title} – tilda-geo.de`
            : `Dokumentation für Datensatz ${tableName} – tilda-geo.de`,
        },
      ],
    }
  },
  component: PageDocsTableName,
})
