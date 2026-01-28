import db from '@/db'
import { MetaData } from '@/scripts/StaticDatasets/types'
import { Prettify } from '@/src/app/_components/types/types'
import { resolver } from '@blitzjs/rpc'
import { MapRenderFormatEnum } from '@prisma/client'
import { z } from 'zod'

export type RegionDataset = Prettify<
  MetaData['configs'][number] & {
    isPublic: boolean
    hideDownloadLink: boolean
    id: string
    mapRenderFormat: MapRenderFormatEnum // from upload
    mapRenderUrl: string // URL for map rendering (PMTiles or GeoJSON based on mapRenderFormat)
    githubUrl: string // from upload
    geojsonUrl: string | null // from upload
    pmtilesUrl: string | null // from upload
    systemLayer: boolean // from upload
  }
>

function transformUploadsToRegionDatasets(
  uploads: Awaited<ReturnType<typeof db.upload.findMany>>,
): RegionDataset[] {
  const regionDatasets: RegionDataset[] = []

  uploads.forEach((upload) => {
    const configs = upload.configs as MetaData['configs']

    configs.forEach((config) => {
      regionDatasets.push({
        ...config,
        isPublic: upload.public,
        hideDownloadLink: upload.hideDownloadLink,
        id: upload.slug,
        mapRenderFormat: upload.mapRenderFormat,
        mapRenderUrl: upload.mapRenderUrl,
        githubUrl: upload.githubUrl,
        geojsonUrl: upload.geojsonUrl,
        pmtilesUrl: upload.pmtilesUrl,
        systemLayer: upload.systemLayer,
      })
    })
  })

  return regionDatasets
}

const Schema = z.object({
  regionSlug: z.string(),
  systemLayer: z.boolean(),
})

export default resolver.pipe(resolver.zod(Schema), async ({ regionSlug, systemLayer }, ctx) => {
  const { session } = ctx

  const uploads = await db.upload.findMany({
    where: {
      regions: { some: { slug: regionSlug } },
      systemLayer,
    },
    include: { regions: { select: { id: true, slug: true } } },
  })

  let filteredUploads = uploads
  if (!session.userId) {
    filteredUploads = uploads.filter((upload) => upload.public)
  } else if (session.role !== 'ADMIN') {
    const memberships = await db.membership.findMany({ where: { userId: session.userId } })
    const membershipRegionIds = memberships.map((membership) => membership.regionId)
    filteredUploads = uploads.filter(
      (upload) =>
        upload.public || upload.regions.some((region) => membershipRegionIds.includes(region.id)),
    )
  }

  return transformUploadsToRegionDatasets(filteredUploads)
})
