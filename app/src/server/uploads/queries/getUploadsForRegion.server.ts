import type { MapRenderFormatEnum } from '@prisma/client'
import { z } from 'zod'
import type { MetaDataSystemLayer, MetaDataUser } from '@/scripts/StaticDatasets/types'
import { getAppSession } from '@/server/auth/session.server'
import db from '@/server/db.server'

type UploadFields = {
  isPublic: boolean
  hideDownloadLink: boolean
  id: string
  mapRenderFormat: MapRenderFormatEnum
  mapRenderUrl: string
  githubUrl: string
  geojsonUrl: string | null
  pmtilesUrl: string | null
  systemLayer: boolean
}

export type RegionDatasetUser = MetaDataUser['configs'][number] & UploadFields
export type RegionDatasetSystemLayer = MetaDataSystemLayer['configs'][number] & UploadFields
export type RegionDataset = RegionDatasetUser | RegionDatasetSystemLayer

async function queryUploadsForRegion(regionSlug: string, systemLayer: boolean) {
  return db.upload.findMany({
    where: {
      regions: { some: { slug: regionSlug } },
      systemLayer,
    },
    include: { regions: { select: { id: true, slug: true } } },
  })
}

async function getFilteredUploadsForRegion(
  regionSlug: string,
  systemLayer: boolean,
  headers: Headers,
): Promise<Awaited<ReturnType<typeof queryUploadsForRegion>>> {
  const session = await getAppSession(headers)
  const uploads = await queryUploadsForRegion(regionSlug, systemLayer)
  if (!session?.userId) {
    return uploads.filter((upload) => upload.public)
  }
  if (session.role === 'ADMIN') {
    return uploads
  }
  const memberships = await db.membership.findMany({ where: { userId: session.userId } })
  const membershipRegionIds = memberships.map((m) => m.regionId)
  return uploads.filter(
    (upload) => upload.public || upload.regions.some((r) => membershipRegionIds.includes(r.id)),
  )
}

type UploadRow = Awaited<ReturnType<typeof queryUploadsForRegion>>[number]

function transformToRegionDatasets<T extends RegionDataset>(uploads: UploadRow[]): T[] {
  const out: T[] = []
  for (const upload of uploads) {
    const configs = upload.configs as Omit<T, keyof UploadFields>[]
    for (const config of configs) {
      out.push({
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
      } as T)
    }
  }
  return out
}

const RegionSlugSchema = z.object({ regionSlug: z.string() })

export async function getUploadsForRegionUser(
  input: z.infer<typeof RegionSlugSchema>,
  headers: Headers,
) {
  const { regionSlug } = RegionSlugSchema.parse(input)
  const uploads = await getFilteredUploadsForRegion(regionSlug, false, headers)
  return transformToRegionDatasets<RegionDatasetUser>(uploads)
}

export async function getUploadsForRegionSystemLayer(
  input: z.infer<typeof RegionSlugSchema>,
  headers: Headers,
) {
  const { regionSlug } = RegionSlugSchema.parse(input)
  const uploads = await getFilteredUploadsForRegion(regionSlug, true, headers)
  return transformToRegionDatasets<RegionDatasetSystemLayer>(uploads)
}
