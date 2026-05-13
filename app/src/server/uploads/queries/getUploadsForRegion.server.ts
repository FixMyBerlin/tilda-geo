import { z } from 'zod'
import type { MapRenderFormatEnum } from '@/prisma/generated/client'
import type { MetaDataSystemLayer, MetaDataUser } from '@/scripts/StaticDatasets/types'
import { getAppSession } from '@/server/auth/session.server'
import db from '@/server/db.server'
import {
  categoryPresentationForConfigCategory,
  loadStaticDatasetCategoryMap,
} from '@/server/static-dataset-categories/queries/loadStaticDatasetCategoryMap.server'

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

type CategoryPresentationFields = {
  categorySortOrder: number
  categoryTitle: string
  categorySubtitle: string | null
}

export type RegionDatasetUser = MetaDataUser['configs'][number] &
  UploadFields &
  CategoryPresentationFields

export type RegionDatasetSystemLayer = MetaDataSystemLayer['configs'][number] &
  UploadFields &
  CategoryPresentationFields

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

type UploadRow = Awaited<ReturnType<typeof queryUploadsForRegion>>[number]

/** Script-written metadata.json: user uploads use MetaDataUser.configs. */
type UploadRowWithUserConfigs = Omit<UploadRow, 'configs'> & {
  configs: MetaDataUser['configs']
}

/** Script-written metadata.json: system layers use MetaDataSystemLayer.configs. */
type UploadRowWithSystemConfigs = Omit<UploadRow, 'configs'> & {
  configs: MetaDataSystemLayer['configs']
}

async function getFilteredUploadsForRegion(
  regionSlug: string,
  systemLayer: false,
  headers: Headers,
): Promise<UploadRowWithUserConfigs[]>
async function getFilteredUploadsForRegion(
  regionSlug: string,
  systemLayer: true,
  headers: Headers,
): Promise<UploadRowWithSystemConfigs[]>
async function getFilteredUploadsForRegion(
  regionSlug: string,
  systemLayer: boolean,
  headers: Headers,
) {
  const session = await getAppSession(headers)
  const uploads = await queryUploadsForRegion(regionSlug, systemLayer)

  let filtered: UploadRow[]
  if (!session?.userId) {
    filtered = uploads.filter((upload) => upload.public)
  } else if (session.role === 'ADMIN') {
    filtered = uploads
  } else {
    const memberships = await db.membership.findMany({ where: { userId: session.userId } })
    const membershipRegionIds = memberships.map((m) => m.regionId)
    filtered = uploads.filter(
      (upload) => upload.public || upload.regions.some((r) => membershipRegionIds.includes(r.id)),
    )
  }

  if (systemLayer) {
    return filtered as UploadRowWithSystemConfigs[]
  }
  return filtered as UploadRowWithUserConfigs[]
}

type CategoryMap = Awaited<ReturnType<typeof loadStaticDatasetCategoryMap>>

const emptyPresentation: CategoryPresentationFields = {
  categorySortOrder: 0,
  categoryTitle: '',
  categorySubtitle: null,
}

type UploadShapeForFields = Omit<UploadRow, 'configs'>

function uploadFieldsFromRow(upload: UploadShapeForFields) {
  return {
    isPublic: upload.public,
    hideDownloadLink: upload.hideDownloadLink,
    id: upload.slug,
    mapRenderFormat: upload.mapRenderFormat,
    mapRenderUrl: upload.mapRenderUrl,
    githubUrl: upload.githubUrl,
    geojsonUrl: upload.geojsonUrl,
    pmtilesUrl: upload.pmtilesUrl,
    systemLayer: upload.systemLayer,
  } satisfies UploadFields
}

function transformUserUploadsToRegionDatasets(
  uploads: UploadRowWithUserConfigs[],
  categoryMap: CategoryMap,
) {
  return uploads.flatMap((upload) =>
    upload.configs.map(
      (config) =>
        ({
          ...config,
          ...categoryPresentationForConfigCategory(config.category, categoryMap),
          ...uploadFieldsFromRow(upload),
        }) satisfies RegionDatasetUser,
    ),
  )
}

function transformSystemUploadsToRegionDatasets(uploads: UploadRowWithSystemConfigs[]) {
  return uploads.flatMap((upload) =>
    upload.configs.map(
      (config) =>
        ({
          ...config,
          ...emptyPresentation,
          ...uploadFieldsFromRow(upload),
        }) satisfies RegionDatasetSystemLayer,
    ),
  )
}

const RegionSlugSchema = z.object({ regionSlug: z.string() })

export async function getUploadsForRegionUser(
  input: z.infer<typeof RegionSlugSchema>,
  headers: Headers,
) {
  const { regionSlug } = RegionSlugSchema.parse(input)
  const [uploads, categoryMap] = await Promise.all([
    getFilteredUploadsForRegion(regionSlug, false, headers),
    loadStaticDatasetCategoryMap(),
  ])
  return transformUserUploadsToRegionDatasets(uploads, categoryMap)
}

export async function getUploadsForRegionSystemLayer(
  input: z.infer<typeof RegionSlugSchema>,
  headers: Headers,
) {
  const { regionSlug } = RegionSlugSchema.parse(input)
  const uploads = await getFilteredUploadsForRegion(regionSlug, true, headers)
  return transformSystemUploadsToRegionDatasets(uploads)
}
