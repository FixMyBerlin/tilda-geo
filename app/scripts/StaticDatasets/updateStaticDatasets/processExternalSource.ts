import { getStaticDatasetUrlForEnvironment } from '@/components/shared/utils/getStaticDatasetUrl'
import type { EnvironmentValues } from '@/server/envSchema'
import { createUpload, type StaticDatasetsApiConfig } from '../api'
import type { MetaData } from '../types'
import { green } from '../utils/log'

export async function processExternalSource(
  metaData: Extract<MetaData, { dataSourceType: 'external' }>,
  uploadSlug: string,
  regionSlugs: string[],
  regionAndDatasetFolder: string,
  api: StaticDatasetsApiConfig,
  appEnv: EnvironmentValues,
) {
  const { externalSourceUrl, cacheTtlSeconds, mapRenderFormat } = metaData

  console.log(`  Saving external source upload to DB...`)
  await createUpload(api, {
    uploadSlug,
    regionSlugs,
    isPublic: metaData.public,
    hideDownloadLink: metaData.hideDownloadLink ?? false,
    configs: metaData.configs,
    mapRenderFormat,
    mapRenderUrl: getStaticDatasetUrlForEnvironment(uploadSlug, mapRenderFormat, appEnv),
    pmtilesUrl:
      mapRenderFormat === 'pmtiles'
        ? getStaticDatasetUrlForEnvironment(uploadSlug, 'pmtiles', appEnv)
        : null,
    geojsonUrl:
      mapRenderFormat === 'geojson'
        ? getStaticDatasetUrlForEnvironment(uploadSlug, 'geojson', appEnv)
        : null,
    githubUrl: `https://github.com/FixMyBerlin/tilda-static-data/tree/main/geojson/${regionAndDatasetFolder}`,
    externalSourceUrl,
    cacheTtlSeconds,
    systemLayer: false,
  })

  green('  OK')
}
