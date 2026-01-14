import { getStaticDatasetUrl } from '@/src/app/_components/utils/getStaticDatasetUrl'
import { createUpload } from '../api'
import { MetaData } from '../types'
import { green, logInfo } from '../utils/log'

export async function processExternalSource(
  metaData: Extract<MetaData, { dataSourceType: 'external' }>,
  uploadSlug: string,
  regionSlugs: string[],
  dryRun: boolean,
  regionAndDatasetFolder: string,
) {
  const { externalSourceUrl, cacheTtlSeconds, mapRenderFormat } = metaData

  logInfo(`Saving external source upload to DB...`, dryRun)
  if (!dryRun) {
    await createUpload({
      uploadSlug,
      regionSlugs,
      isPublic: metaData.public,
      hideDownloadLink: metaData.hideDownloadLink ?? false,
      configs: metaData.configs,
      mapRenderFormat,
      mapRenderUrl: getStaticDatasetUrl(uploadSlug, mapRenderFormat),
      pmtilesUrl: mapRenderFormat === 'pmtiles' ? getStaticDatasetUrl(uploadSlug, 'pmtiles') : null,
      geojsonUrl: mapRenderFormat === 'geojson' ? getStaticDatasetUrl(uploadSlug, 'geojson') : null,
      githubUrl: `https://github.com/FixMyBerlin/tilda-static-data/tree/main/geojson/${regionAndDatasetFolder}`,
      externalSourceUrl,
      cacheTtlSeconds,
    })
  }

  green('  OK')
}
