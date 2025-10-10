import { Prisma } from '@prisma/client'
import { staticRegion } from '../../src/data/regions.const'
import db from '../index'

const seedRegions = async () => {
  const seedRegions: Prisma.RegionUncheckedCreateInput[] = staticRegion.map((region) => ({
    slug: region.slug,
    public: region.logoPath !== null || region.externalLogoPath !== null,
    exportPublic: region.bbox !== null,
  }))

  for (const data of seedRegions) {
    if (data) {
      await db.region.create({ data })
    }
  }
}

export default seedRegions
