import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { createFileRoute } from '@tanstack/react-router'
import { feature, featureCollection } from '@turf/turf'
import type { LineString } from 'geojson'
import { z } from 'zod'
import { osmTypeIdString } from '@/components/regionen/pageRegionSlug/SidebarInspector/Tools/osmUrls/osmUrls'
import { formatDateTimeBerlin } from '@/components/shared/date/formatDateBerlin'
import { isProd } from '@/components/shared/utils/isEnv'
import { todoIds } from '@/data/processingTypes/todoId.generated.const'
import { buildTaskInstructions } from '@/data/radinfra-de/utils/buildTaskInstructions'
import { getProcessingMeta } from '@/server/api/util/getProcessingMeta.server'
import { geoDataClient } from '@/server/prisma-client.server'

const maprouletteParamsSchema = z.strictObject({
  projectKey: z.enum(todoIds),
})

const maprouletteSearchSchema = z.strictObject({
  download: z
    .string()
    .transform((val) => val === 'true')
    .nullish(),
})

export const Route = createFileRoute('/api/maproulette/data/$projectKey')({
  ssr: true,
  params: {
    parse: (rawParams) => maprouletteParamsSchema.parse(rawParams),
  },
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const rawSearchParams = new URL(request.url).searchParams
        const parsedSearch = maprouletteSearchSchema.safeParse({
          download: rawSearchParams.get('download'),
        })

        if (!parsedSearch.success) {
          return Response.json({ error: 'Invalid input', ...parsedSearch.error }, { status: 404 })
        }
        const { projectKey } = params
        const { download } = parsedSearch.data

        try {
          const { osm_data_from } = await getProcessingMeta()

          type QueryType = {
            osm_type: string
            osm_id: string
            id: string
            priority: string
            kind: string
            geometry: LineString
          }[]

          const sqlWays = await geoDataClient.$queryRaw<QueryType>`
            SELECT
              todos_lines.osm_type as osm_type,
              todos_lines.osm_id as osm_id,
              todos_lines.id as id,
              todos_lines.tags->>${projectKey} as priority,
              todos_lines.meta->'category' AS kind,
              ST_AsGeoJSON(
                ST_SimplifyPreserveTopology(
                  ST_Transform(todos_lines.geom, 4326),
                  0.75
                ),
                6
              )::jsonb AS geometry
            FROM public.todos_lines as todos_lines
            WHERE todos_lines.tags ? ${projectKey}
            ORDER BY todos_lines.length DESC
            LIMIT 40000;
          `

          const outputFilePath = path.resolve(
            'public',
            'temp',
            `api-maproulette-${projectKey}-temp-${Date.now()}.geojson`,
          )
          const fileStream = fs.createWriteStream(outputFilePath)

          console.log('INFO', 'api/maproulette/[projectKey]/route.ts:', {
            resultSize: sqlWays.length,
            projectKey,
          })
          for (const sqlWay of sqlWays) {
            const { osm_type, osm_id, id, priority, kind, geometry } = sqlWay
            const osmTypeId = osmTypeIdString(osm_type, osm_id)

            let text: undefined | string
            try {
              text = buildTaskInstructions({
                projectKey,
                osmTypeIdString: osmTypeId,
                kind,
                geometry,
              })
            } catch (error) {
              console.log(
                'ERROR',
                'api/maproulette/[projectKey]/route.ts',
                'in maprouletteTaskDescriptionMarkdown',
                error,
                { osm_type, osm_id, id, priority, kind, geometry },
              )
            }
            const properties = {
              priority,
              osmIdentifier: osmTypeId,
              data_updated_at: osm_data_from ? formatDateTimeBerlin(osm_data_from) : 'Unknown',
              task_updated_at: formatDateTimeBerlin(new Date()),
              task_markdown: (text || 'TASK DESCRIPTION MISSING').replaceAll('\n', ' \n'),
              blank: '',
            }

            const geojsonResult = featureCollection([feature(geometry, properties, { id })])
            const rsChar = String.fromCharCode(0x1e)
            fileStream.write(`${rsChar}${JSON.stringify(geojsonResult)}\n`)
          }

          fileStream.end()
          await new Promise<void>((resolve, reject) => {
            fileStream.on('finish', () => resolve())
            fileStream.on('error', (err) => reject(err))
          })

          const fileBuffer = await fs.promises.readFile(outputFilePath)
          await fs.promises.unlink(outputFilePath)

          const filename = `maproulette-${projectKey}-newline-delimited-geojson.json`
          const optionalDownloadHeader =
            download === true
              ? { 'Content-Disposition': `attachment; filename="${filename}"` }
              : undefined

          if (request.headers.get('accept-encoding')?.includes('gzip')) {
            const compressed = gzipSync(fileBuffer)
            return new Response(compressed, {
              headers: {
                'Content-Type': 'application/json',
                'Content-Encoding': 'gzip',
                'Content-Length': compressed.length.toString(),
                'Access-Control-Allow-Origin': '*',
                ...optionalDownloadHeader,
              },
            })
          }
          return new Response(fileBuffer, {
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': fileBuffer.length.toString(),
              'Access-Control-Allow-Origin': '*',
              ...optionalDownloadHeader,
            },
          })
        } catch (error) {
          console.error(error)
          return Response.json(
            { error: 'Internal Server Error', info: isProd ? undefined : error },
            { status: 500 },
          )
        }
      },
    },
  },
})
