import { createFileRoute, notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { PageDocsTableName } from '@/components/pages/docs/PageDocsTableName'
import { exportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import { exportConfigs } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/exports/exports.const'

const docsSearchSchema = z.object({
  r: z.string().optional(),
})

export const Route = createFileRoute('/_pages/docs/$tableName')({
  ssr: true,
  validateSearch: (search) => docsSearchSchema.parse(search),
  loaderDeps: ({ search: { r } }) => ({ r }),
  loader: ({ params, deps }) => {
    const tableNameSchema = z.enum(exportApiIdentifier)
    const parsed = tableNameSchema.safeParse(params.tableName)

    if (!parsed.success) {
      throw notFound()
    }

    const tableName = parsed.data
    const exportData = exportConfigs.find((e) => e.id === tableName)
    return {
      tableName,
      exportData,
      regionSlug: deps.r ?? null,
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] }
    const { exportData, tableName } = loaderData
    return {
      meta: [
        { name: 'robots', content: 'noindex' },
        {
          title: exportData?.title
            ? `Dokumentation für ${exportData.title} – tilda-geo.de`
            : `Dokumentation für Datensatz ${tableName} – tilda-geo.de`,
        },
      ],
    }
  },
  component: PageDocsTableName,
})
