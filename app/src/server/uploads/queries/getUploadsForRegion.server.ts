import { z } from 'zod'
import type { MapRenderFormatEnum } from '@/prisma/generated/client'
import type {
  MetaDataFileLevelMetadata,
  MetaDataSystemLayer,
  MetaDataUser,
} from '@/scripts/StaticDatasets/types'
import { getAppSession } from '@/server/auth/session.server'
import { memberRegionIds } from '@/server/authorization/isAdminOrRegionMember.server'
import db from '@/server/db.server'
import {
  categoryPresentationForConfigCategory,
  loadMapDatasetCategoryMap,
} from '@/server/map-dataset-categories/queries/loadMapDatasetCategoryMap.server'
import { parseMapDatasetUploadConfigs } from '@/server/uploads/mapDatasetUploadConfigs.schema'
import { parseMapDatasetUploadStyleGroups } from '@/server/uploads/mapDatasetUploadStyleGroups'

type UploadFields = {
  public: boolean
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

type RegionDatasetFileLevelFields = {
  attributionHtml: string
  dataSourceMarkdown?: MetaDataFileLevelMetadata['dataSourceMarkdown'] | null
  dataUpdatedNote?: MetaDataFileLevelMetadata['dataUpdatedNote'] | null
  licence?: MetaDataFileLevelMetadata['licence'] | null
  licenceOsmCompatible?: MetaDataFileLevelMetadata['licenceOsmCompatible'] | null
}

/** The style group a config belongs to; one sidebar entry per group, radio button per config. */
type RegionDatasetStyleGroup = {
  /** Unique across uploads: `<upload slug>:<group id>` */
  key: string
  name: string
  /** Position of this config within its group (order in `meta.ts`); 0 = default style */
  position: number
}

type StyleGroupFields = { styleGroup: RegionDatasetStyleGroup | null }

export type RegionDatasetUser = Omit<MetaDataUser['configs'][number], 'styleGroup'> &
  StyleGroupFields &
  RegionDatasetFileLevelFields &
  UploadFields &
  CategoryPresentationFields

export type RegionDatasetSystemLayer = Omit<MetaDataSystemLayer['configs'][number], 'styleGroup'> &
  StyleGroupFields &
  RegionDatasetFileLevelFields &
  UploadFields &
  CategoryPresentationFields

export type RegionDataset = RegionDatasetUser | RegionDatasetSystemLayer

async function queryUploadsForRegion(regionSlug: string, systemLayer: boolean) {
  return db.mapDatasetUpload.findMany({
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
    // Same member rule as the file route: a membership of a DEACTIVATED region does not count.
    const membershipRegionIds = await memberRegionIds(session.userId)
    filtered = uploads.filter(
      (upload) => upload.public || upload.regions.some((r) => membershipRegionIds.includes(r.id)),
    )
  }

  if (systemLayer) {
    return filtered as UploadRowWithSystemConfigs[]
  }
  return filtered as UploadRowWithUserConfigs[]
}

type CategoryMap = Awaited<ReturnType<typeof loadMapDatasetCategoryMap>>

const emptyPresentation: CategoryPresentationFields = {
  categorySortOrder: 0,
  categoryTitle: '',
  categorySubtitle: null,
}

type UploadShapeForFields = Omit<UploadRow, 'configs'>

function uploadFieldsFromRow(upload: UploadShapeForFields) {
  return {
    public: upload.public,
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

function fileLevelFieldsFromRow(upload: UploadShapeForFields) {
  return {
    attributionHtml: upload.attributionHtml ?? '',
    dataSourceMarkdown: upload.dataSourceMarkdown,
    dataUpdatedNote: upload.dataUpdatedNote,
    licence: upload.licence as RegionDatasetFileLevelFields['licence'],
    licenceOsmCompatible:
      upload.licenceOsmCompatible as RegionDatasetFileLevelFields['licenceOsmCompatible'],
  } satisfies RegionDatasetFileLevelFields
}

/** Style group of each config (same order as `configs`); parses `styleGroups` once per upload. */
function styleGroupsForConfigs(upload: UploadShapeForFields, configs: MetaDataUser['configs']) {
  const groups = parseMapDatasetUploadStyleGroups(upload.styleGroups)
  return configs.map((config) => {
    const group = groups.find(({ id }) => id === config.styleGroup)
    if (!group) return null
    const members = configs.filter(({ styleGroup }) => styleGroup === group.id)
    return {
      key: `${upload.slug}:${group.id}`,
      name: group.name,
      position: members.indexOf(config),
    } satisfies RegionDatasetStyleGroup
  })
}

function transformUserUploadsToRegionDatasets(
  uploads: UploadRowWithUserConfigs[],
  categoryMap: CategoryMap,
) {
  return uploads.flatMap((upload) => {
    const configs = parseMapDatasetUploadConfigs(upload.configs) as MetaDataUser['configs']
    const styleGroups = styleGroupsForConfigs(upload, configs)
    return configs.map(
      (config, index) =>
        ({
          ...config,
          styleGroup: styleGroups[index] ?? null,
          ...categoryPresentationForConfigCategory(config.categoryKey, categoryMap),
          ...uploadFieldsFromRow(upload),
          ...fileLevelFieldsFromRow(upload),
        }) satisfies RegionDatasetUser,
    )
  })
}

function transformSystemUploadsToRegionDatasets(uploads: UploadRowWithSystemConfigs[]) {
  return uploads.flatMap((upload) => {
    const configs = parseMapDatasetUploadConfigs(upload.configs) as MetaDataSystemLayer['configs']
    return configs.map(
      (config) =>
        ({
          ...config,
          styleGroup: null,
          ...emptyPresentation,
          ...uploadFieldsFromRow(upload),
          ...fileLevelFieldsFromRow(upload),
        }) satisfies RegionDatasetSystemLayer,
    )
  })
}

const RegionSlugSchema = z.object({ regionSlug: z.string() })

export async function getUploadsForRegionUser(
  input: z.infer<typeof RegionSlugSchema>,
  headers: Headers,
) {
  const { regionSlug } = RegionSlugSchema.parse(input)
  const [uploads, categoryMap] = await Promise.all([
    getFilteredUploadsForRegion(regionSlug, false, headers),
    loadMapDatasetCategoryMap(),
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
