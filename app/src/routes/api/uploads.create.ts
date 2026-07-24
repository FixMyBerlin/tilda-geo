import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { MapRenderFormatEnum } from '@/prisma/generated/client'
import { checkApiKey, parseData } from '@/server/api/util/checkApiKey.server'
import { runWithAuditContextAsync, systemApiAuditContext } from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import { layerConfigsCreateFromConfigs } from '@/server/uploads/mapDatasetLayerConfig.server'
import {
  mapDatasetUploadConfigsSchema,
  mapDatasetUploadConfigsToPrismaJson,
} from '@/server/uploads/mapDatasetUploadConfigs.schema'

const Schema = z.object({
  apiKey: z.string().nullish(),
  uploadSlug: z.string(),
  regionSlugs: z.array(z.string()),
  isPublic: z.boolean(),
  hideDownloadLink: z.boolean(),
  configs: mapDatasetUploadConfigsSchema,
  mapRenderFormat: z.enum(MapRenderFormatEnum),
  mapRenderUrl: z.string(),
  pmtilesUrl: z.string().nullish(),
  geojsonUrl: z.string().nullish(),
  githubUrl: z.string(),
  externalSourceUrl: z.string().nullish(),
  cacheTtlSeconds: z.number().nullish(),
  systemLayer: z.boolean(),
  // File-level metadata columns on MapDatasetUpload
  attributionHtml: z.string().nullish(),
  dataSourceMarkdown: z.string().nullish(),
  dataUpdatedNote: z.string().nullish(),
  licence: z.string().nullish(),
  licenceOsmCompatible: z.string().nullish(),
})

export const Route = createFileRoute('/api/uploads/create')({
  ssr: false,
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = parseData(await request.json(), Schema)
        if (!parsed.ok) return parsed.errorResponse
        const { data } = parsed

        const check = checkApiKey(data)
        if (!check.ok) return check.errorResponse

        const {
          uploadSlug,
          regionSlugs,
          isPublic,
          hideDownloadLink,
          configs,
          mapRenderFormat,
          mapRenderUrl,
          pmtilesUrl,
          geojsonUrl,
          githubUrl,
          externalSourceUrl,
          cacheTtlSeconds,
          systemLayer,
          attributionHtml,
          dataSourceMarkdown,
          dataUpdatedNote,
          licence,
          licenceOsmCompatible,
        } = data

        await runWithAuditContextAsync(systemApiAuditContext(request.headers), async () => {
          await db.mapDatasetUpload.deleteMany({ where: { slug: uploadSlug } })

          await db.mapDatasetUpload.create({
            data: {
              slug: uploadSlug,
              regions: { connect: regionSlugs.map((slug) => ({ slug })) },
              public: isPublic,
              hideDownloadLink,
              configs: mapDatasetUploadConfigsToPrismaJson(configs),
              mapRenderFormat,
              mapRenderUrl,
              pmtilesUrl: pmtilesUrl ?? null,
              geojsonUrl: geojsonUrl ?? null,
              githubUrl,
              externalSourceUrl: externalSourceUrl ?? null,
              cacheTtlSeconds: cacheTtlSeconds ?? null,
              systemLayer,
              attributionHtml: attributionHtml ?? null,
              dataSourceMarkdown: dataSourceMarkdown ?? null,
              dataUpdatedNote: dataUpdatedNote ?? null,
              licence: licence ?? null,
              licenceOsmCompatible: licenceOsmCompatible ?? null,
              // Sync normalized layerConfigs rows from configs[] for the admin UI.
              layerConfigs: { create: layerConfigsCreateFromConfigs(configs) },
            },
          })
        })

        return Response.json({ statusText: 'Created' }, { status: 201 })
      },
    },
  },
})
