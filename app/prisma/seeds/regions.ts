import { updateRegionMaskConfig } from '../../src/server/regions/mutations/updateRegionMaskConfig.server'
import { createRegionConfig } from '../../src/server/regions/regionWriteService.server'
import { seedRegionCatalog } from './regionSeedCatalog'

/**
 * Dev/test baseline regions. Config lives inline in regionSeedCatalog (no bundled logo imports).
 */
const seedRegions = async () => {
  for (const { config, mask } of seedRegionCatalog) {
    await createRegionConfig(config, { metadata: { changeSource: 'MIGRATION' } })
    if (mask) {
      await updateRegionMaskConfig({ slug: config.slug, ...mask })
    }
  }
}

export default seedRegions
