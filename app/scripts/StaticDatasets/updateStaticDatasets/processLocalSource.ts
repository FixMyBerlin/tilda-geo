import { getStaticDatasetUrl } from '@/src/app/_components/utils/getStaticDatasetUrl'
import { createUpload } from '../api'
import { MetaData } from '../types'
import { logInfo } from '../utils/log'
import { generatePMTilesFile } from './generatePMTilesFile'
import { isCompressedSmallerThan } from './isCompressedSmallerThan'
import { uploadFileToS3 } from './uploadFileToS3'

export async function processLocalSource(
  metaData: MetaData,
  uploadSlug: string,
  regionSlugs: string[],
  transformedFilepath: string,
  tempFolder: string,
  dryRun: boolean,
  regionAndDatasetFolder: string,
) {
  logInfo(`Uploading GeoJSON file to S3...`, dryRun)
  const geojsonUrl = dryRun
    ? 'http://example.com/does-not-exist.geojson'
    : await uploadFileToS3(transformedFilepath, uploadSlug)

  const pmtilesFilepath = dryRun
    ? '/tmp/does-not-exist.pmtiles'
    : await generatePMTilesFile(transformedFilepath, tempFolder, metaData.geometricPrecision)

  logInfo(`Uploading PMTiles file to S3...`, dryRun)
  const pmtilesUrl = dryRun
    ? 'http://example.com/does-not-exist.pmtiles'
    : await uploadFileToS3(pmtilesFilepath, uploadSlug)

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

  console.log(
    `  Map will render a ${renderFormat.toUpperCase()} file`,
    metaData.mapRenderFormat
      ? 'based on the Format specified in the config.'
      : 'based on the optimal format for this file size.',
  )

  logInfo(`Saving uploads to DB...`, dryRun)
  if (!dryRun) {
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
    })
  }
}
