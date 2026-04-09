import { getStaticDatasetUrlForEnvironment } from '@/components/shared/utils/getStaticDatasetUrl'
import type { EnvironmentValues } from '@/server/envSchema'
import { createUpload, type StaticDatasetsApiConfig } from '../api'
import type { MetaData } from '../types'
import { generatePMTilesFile } from './generatePMTilesFile'
import { isCompressedSmallerThan } from './isCompressedSmallerThan'
import { uploadFileToS3 } from './uploadFileToS3'

type LocalMapRenderFormat = 'pmtiles' | 'geojson' | 'auto'

export function getRenderStrategy(mapRenderFormat: LocalMapRenderFormat, isSmall: boolean) {
  const renderFormat =
    mapRenderFormat === 'auto' ? (isSmall ? 'geojson' : 'pmtiles') : mapRenderFormat
  const shouldGeneratePmtiles = mapRenderFormat === 'auto' || renderFormat === 'pmtiles'
  return { renderFormat, shouldGeneratePmtiles }
}

export async function processLocalSource(
  metaData: Extract<MetaData, { dataSourceType: 'local' }>,
  uploadSlug: string,
  regionSlugs: string[],
  transformedFilepath: string,
  tempFolder: string,
  regionAndDatasetFolder: string,
  api: StaticDatasetsApiConfig,
  appEnv: EnvironmentValues,
) {
  console.log(`  Uploading GeoJSON file to S3...`)
  const geojsonUrl = await uploadFileToS3(transformedFilepath, uploadSlug, appEnv)

  // Determine which format to use for map rendering
  const mapRenderFormat = metaData.mapRenderFormat ?? 'auto'
  const maxCompressedSizeBites = 50000 // 50,000 bytes ≈ 48.8 KB or ≈ 0.049 MB
  const isSmall =
    mapRenderFormat === 'auto'
      ? isCompressedSmallerThan(transformedFilepath, maxCompressedSizeBites)
      : false
  const { renderFormat, shouldGeneratePmtiles } = getRenderStrategy(mapRenderFormat, isSmall)

  // For `auto` we still generate PMTiles for compatibility, even if map rendering uses GeoJSON.
  // Only explicit `mapRenderFormat: 'geojson'` skips PMTiles generation.
  let pmtilesUrl: string | null = null
  if (shouldGeneratePmtiles) {
    const pmtilesFilepath = generatePMTilesFile(
      transformedFilepath,
      tempFolder,
      metaData.geometricPrecision,
    )

    console.log(`  Uploading PMTiles file to S3...`)
    pmtilesUrl = await uploadFileToS3(pmtilesFilepath, uploadSlug, appEnv)
  }

  console.log(
    `  Map will render a ${renderFormat.toUpperCase()} file`,
    metaData.mapRenderFormat
      ? 'based on the Format specified in the config.'
      : 'based on the optimal format for this file size.',
  )
  if (!shouldGeneratePmtiles) {
    console.log(`  Skipping PMTiles generation (GeoJSON-only dataset)`)
  }

  console.log(`  Saving uploads to DB...`)
  // Create single upload entry with both URLs
  await createUpload(api, {
    uploadSlug,
    regionSlugs,
    isPublic: metaData.public,
    hideDownloadLink: metaData.hideDownloadLink ?? false,
    configs: metaData.configs,
    mapRenderFormat: renderFormat,
    mapRenderUrl: getStaticDatasetUrlForEnvironment(uploadSlug, renderFormat, appEnv),
    pmtilesUrl,
    geojsonUrl,
    githubUrl: `https://github.com/FixMyBerlin/tilda-static-data/tree/main/geojson/${regionAndDatasetFolder}`,
    systemLayer: metaData.systemLayer ?? false,
  })
}
