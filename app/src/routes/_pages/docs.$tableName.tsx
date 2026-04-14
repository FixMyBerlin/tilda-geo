import { createFileRoute, notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { PageDocsTableName } from '@/components/pages/docs/PageDocsTableName'
import { exportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import { getMasterportalByTableName, getTopicDocByTableName } from '@/data/topicDocs/runtime'
import { optionalSearchString } from '@/lib/searchParamsSchema'
import { getRegionForDocsLoaderFn } from '@/server/api/docs.functions'

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
    const topicDoc = getTopicDocByTableName(tableName)
    const masterportal = getMasterportalByTableName(tableName)
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

    const region = deps.r ? await getRegionForDocsLoaderFn({ data: { slug: deps.r } }) : null

    return {
      tableName,
      topicDoc,
      masterportal,
      groupDocs,
      region,
      regionSlug: region ? (deps.r ?? null) : null,
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
