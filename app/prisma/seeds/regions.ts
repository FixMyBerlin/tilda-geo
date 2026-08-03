import { updateRegionMaskConfig } from '../../src/server/regions/mutations/updateRegionMaskConfig.server'
import { createRegionConfig } from '../../src/server/regions/regionWriteService.server'
import { attachRegionWelcomeDemoImages } from './attachRegionWelcomeDemoImages.server'
import { seedRegionCatalog } from './regionSeedCatalog'

/**
 * Dev/test baseline regions. Config (including welcome text) lives in regionSeedCatalog.
 * Hero images need a regionId first, so they are attached in a second pass.
 */
const seedRegions = async () => {
  for (const { config, mask } of seedRegionCatalog) {
    await createRegionConfig(config, { metadata: { changeSource: 'MIGRATION' } })
    if (mask) {
      await updateRegionMaskConfig({ slug: config.slug, ...mask })
    }
  }
  await attachRegionWelcomeDemoImages()
}

export default seedRegions
