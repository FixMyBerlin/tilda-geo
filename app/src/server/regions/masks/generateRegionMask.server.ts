import { getStaticDatasetUrl } from '@/components/shared/utils/getStaticDatasetUrl'
import { MapRenderFormatEnum } from '@/prisma/generated/client'
import db from '@/server/db.server'
import { addUniqueIds } from '@/server/regions/masks/addUniqueIds.server'
import {
  BoundaryNotFoundError,
  fetchBoundaryGeometry,
} from '@/server/regions/masks/fetchBoundaryGeometry.server'
import {
  deleteMapDatasetFromS3,
  uploadMapDatasetToS3,
} from '@/server/regions/masks/mapDatasetUploadsS3.server'
import { regionMaskLayers } from '@/server/regions/masks/regionMaskLayers.const'
import { transformRegionMask } from '@/server/regions/masks/transformRegionMask.server'
import { layerConfigsCreateFromConfigs } from '@/server/uploads/mapDatasetLayerConfig.server'
import {
  parseMapDatasetUploadConfigs,
  mapDatasetUploadConfigsToPrismaJson,
} from '@/server/uploads/mapDatasetUploadConfigs.schema'

// Mask parameters live on Region; geometry + map packaging is a systemLayer MapDatasetUpload
// (slug region-{regionSlug}). configs JSON only needs name, inspector, and layers for the map;
// attributionHtml is set on the upload row (map reads row-level attribution, not config-level).
export function regionMaskUploadSlug(regionSlug: string) {
  return `region-${regionSlug}`
}

const MASK_GEOJSON_FILENAME = 'mask.geojson'
const MASK_ATTRIBUTION_HTML = 'OpenStreetMap'

function buildMaskConfigs() {
  return [
    {
      name: 'Maskierung',
      inspector: { enabled: false as const },
      layers: regionMaskLayers,
    },
  ]
}

export async function deleteRegionMaskUpload(regionSlug: string) {
  const uploadSlug = regionMaskUploadSlug(regionSlug)
  await db.mapDatasetUpload.deleteMany({ where: { slug: uploadSlug, systemLayer: true } })
  await deleteMapDatasetFromS3(uploadSlug, MASK_GEOJSON_FILENAME)
}

export async function generateRegionMask(input: {
  regionSlug: string
  maskOsmRelationIds: number[]
  maskBufferKm: number
}) {
  const { regionSlug, maskOsmRelationIds, maskBufferKm } = input

  if (maskOsmRelationIds.length === 0) {
    throw new Error('Maske ist deaktiviert oder es fehlen OSM Relation IDs')
  }

  const region = await db.region.findFirst({ where: { slug: regionSlug } })
  if (!region) {
    throw new Error(`Region "${regionSlug}" nicht gefunden`)
  }

  const uploadSlug = regionMaskUploadSlug(regionSlug)

  let boundaryGeometry
  try {
    boundaryGeometry = await fetchBoundaryGeometry(maskOsmRelationIds)
  } catch (error) {
    if (error instanceof BoundaryNotFoundError) {
      throw new Error(
        `OSM Relation ID(s) nicht gefunden: ${maskOsmRelationIds.join(', ')}. Mindestens eine ID ist falsch oder fehlt in der Boundaries-Datenbank.`,
      )
    }
    throw error
  }

  const transformed = transformRegionMask({
    geometry: boundaryGeometry,
    bufferDistanceKm: maskBufferKm,
  })
  const withIds = addUniqueIds(transformed)
  const geojsonBody = JSON.stringify(withIds)

  const geojsonUrl = await uploadMapDatasetToS3({
    uploadSlug,
    filename: MASK_GEOJSON_FILENAME,
    body: geojsonBody,
    contentType: 'application/geo+json',
  })

  const mapRenderUrl = getStaticDatasetUrl(uploadSlug, 'geojson')
  const maskConfigs = parseMapDatasetUploadConfigs(buildMaskConfigs())
  const layerConfigs = layerConfigsCreateFromConfigs(maskConfigs)
  const configs = mapDatasetUploadConfigsToPrismaJson(maskConfigs)

  const maskUploadFields = {
    public: true,
    hideDownloadLink: true,
    systemLayer: true,
    attributionHtml: MASK_ATTRIBUTION_HTML,
    configs,
    mapRenderFormat: MapRenderFormatEnum.geojson,
    mapRenderUrl,
    geojsonUrl,
    githubUrl: '',
  }

  await db.mapDatasetUpload.upsert({
    where: { slug: uploadSlug },
    create: {
      slug: uploadSlug,
      ...maskUploadFields,
      regions: { connect: { slug: regionSlug } },
      layerConfigs: { create: layerConfigs },
    },
    update: {
      ...maskUploadFields,
      regions: { connect: { slug: regionSlug } },
      layerConfigs: {
        deleteMany: {},
        create: layerConfigs,
      },
    },
  })

  return { uploadSlug, mapRenderUrl, geojsonUrl }
}
