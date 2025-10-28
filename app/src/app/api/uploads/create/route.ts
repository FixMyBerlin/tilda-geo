import db from '@/db'
import { MapRenderFormatEnum } from '@prisma/client'
import { z } from 'zod'
import { checkApiKey, parseData } from '../../_util/checkApiKey'

const Schema = z.object({
  apiKey: z.string().nullish(),
  uploadSlug: z.string(),
  regionSlugs: z.array(z.string()),
  isPublic: z.boolean(),
  hideDownloadLink: z.boolean(),
  configs: z.array(z.record(z.string(), z.any())),
  mapRenderFormat: z.nativeEnum(MapRenderFormatEnum),
  mapRenderUrl: z.string(),
  pmtilesUrl: z.string(),
  geojsonUrl: z.string(),
  githubUrl: z.string(),
})

export async function POST(request: Request) {
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
  } = data

  await db.upload.deleteMany({ where: { slug: uploadSlug } })

  try {
    await db.upload.create({
      data: {
        slug: uploadSlug,
        regions: { connect: regionSlugs.map((slug) => ({ slug })) },
        public: isPublic,
        hideDownloadLink,
        configs,
        mapRenderFormat,
        mapRenderUrl,
        pmtilesUrl,
        geojsonUrl,
        githubUrl,
      },
    })
  } catch (e) {
    return Response.json({ statusText: 'Bad Request', message: e.message }, { status: 400 })
  }

  return Response.json({ statusText: 'Created' }, { status: 201 })
}
