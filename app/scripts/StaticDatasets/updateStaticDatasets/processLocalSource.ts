import { getStaticDatasetUrl } from '@/src/app/_components/utils/getStaticDatasetUrl'
import { createUpload } from '../api'
import { MetaData } from '../types'
import { generatePMTilesFile } from './generatePMTilesFile'
import { isCompressedSmallerThan } from './isCompressedSmallerThan'
import { uploadFileToS3 } from './uploadFileToS3'

export async function processLocalSource(
  metaData: Extract<MetaData, { dataSourceType: 'local' }>,
  uploadSlug: string,
  regionSlugs: string[],
  transformedFilepath: string,
  tempFolder: string,
  regionAndDatasetFolder: string,
) {
  console.log(`  Uploading GeoJSON file to S3...`)
  const geojsonUrl = await uploadFileToS3(transformedFilepath, uploadSlug)

  // Determine which format to use for map rendering
  const mapRenderFormat = metaData.mapRenderFormat ?? 'auto'
  let renderFormat: 'geojson' | 'pmtiles'
  if (mapRenderFormat === 'auto') {
    const maxCompressedSizeBites = 50000 // 50,000 bytes ≈ 48.8 KB or ≈ 0.049 MB
    const isSmall = await isCompressedSmallerThan(transformedFilepath, maxCompressedSizeBites)
    renderFormat = isSmall ? 'geojson' : 'pmtiles'
  } else {
    renderFormat = mapRenderFormat
  }

  // Only generate PMTiles if needed (not for GeoJSON-only datasets like masks)
  let pmtilesUrl: string | null = null
  if (renderFormat === 'pmtiles') {
    const pmtilesFilepath = await generatePMTilesFile(
      transformedFilepath,
      tempFolder,
      metaData.geometricPrecision,
    )

    console.log(`  Uploading PMTiles file to S3...`)
    pmtilesUrl = await uploadFileToS3(pmtilesFilepath, uploadSlug)
  }

  console.log(
    `  Map will render a ${renderFormat.toUpperCase()} file`,
    metaData.mapRenderFormat
      ? 'based on the Format specified in the config.'
      : 'based on the optimal format for this file size.',
  )
  if (renderFormat === 'geojson' && mapRenderFormat === 'geojson') {
    console.log(`  Skipping PMTiles generation (GeoJSON-only dataset)`)
  }

  console.log(`  Saving uploads to DB...`)
  // Create single upload entry with both URLs
  await createUpload({
    uploadSlug,
    regionSlugs,
    isPublic: metaData.public,
    hideDownloadLink: metaData.hideDownloadLink ?? false,
    configs: metaData.configs,
    mapRenderFormat: renderFormat,
    mapRenderUrl: getStaticDatasetUrl(uploadSlug, renderFormat),
    pmtilesUrl,
    geojsonUrl,
    githubUrl: `https://github.com/FixMyBerlin/tilda-static-data/tree/main/geojson/${regionAndDatasetFolder}`,
    systemLayer: metaData.systemLayer ?? false,
  })
}
