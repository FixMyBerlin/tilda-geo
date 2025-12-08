import { Prisma } from '@prisma/client'
import db from '../index'

/**
 * REMINDER: Do NOT import from regions.const.ts in this seed file!
 *
 * The regions.const.ts file includes imports of external files (SVG images, PNG images, etc.)
 * which fail during the seed process because:
 *
 * Instead, manually maintain this list by extracting data from regions.const.ts.
 * Use the following logic to determine values:
 * - `promoted: true` if region should appear on /regions page (typically if `region.logoPath !== null || region.externalLogoPath !== null`)
 * - `status: 'PUBLIC'` for all existing regions (migrated from ACTIVE)
 */
const seedRegions = async () => {
  const seedRegions: Prisma.RegionUncheckedCreateInput[] = [
    {
      slug: 'bibi',
      promoted: true,
      status: 'PUBLIC',
    },
    {
      slug: 'trto',
      promoted: true,
      status: 'PUBLIC',
    },
    {
      slug: 'berlin',
      promoted: false,
      status: 'PUBLIC',
    },
    {
      slug: 'infravelo',
      promoted: true,
      status: 'PUBLIC',
    },
    {
      slug: 'parkraum-berlin',
      promoted: true,
      status: 'PUBLIC',
    },
    {
      slug: 'parkraum-berlin-euvm',
      promoted: true,
      status: 'PUBLIC',
    },
    {
      slug: 'parkraum',
      promoted: true,
      status: 'PUBLIC',
    },
    {
      slug: 'nudafa',
      promoted: true,
      status: 'PUBLIC',
    },
    {
      slug: 'rs8',
      promoted: false,
      status: 'PUBLIC',
    },
    {
      slug: 'mainz',
      promoted: false,
      status: 'PUBLIC',
    },
    {
      slug: 'lueneburg',
      promoted: false,
      status: 'PUBLIC',
    },
    {
      slug: 'woldegk',
      promoted: true,
      status: 'PUBLIC',
    },
    {
      slug: 'trassenscout-umfragen',
      promoted: false,
      status: 'PRIVATE',
    },
    {
      slug: 'ostalbkreis',
      promoted: false,
      status: 'PUBLIC',
    },
    {
      slug: 'langerwehe',
      promoted: false,
      status: 'PUBLIC',
    },
    {
      slug: 'herrenberg',
      promoted: false,
      status: 'PUBLIC',
    },
    {
      slug: 'magdeburg',
      promoted: false,
      status: 'PUBLIC',
    },
    {
      slug: 'bb',
      promoted: false,
      status: 'DEACTIVATED',
    },
    {
      slug: 'bb-beteiligung',
      promoted: false,
      status: 'DEACTIVATED',
    },
    {
      slug: 'bb-pg',
      promoted: false,
      status: 'DEACTIVATED',
    },
    {
      slug: 'bb-sg',
      promoted: false,
      status: 'DEACTIVATED',
    },
    {
      slug: 'bb-kampagne',
      promoted: true,
      status: 'PUBLIC',
    },
    {
      slug: 'muenchen',
      promoted: false,
      status: 'PUBLIC',
    },
    {
      slug: 'nrw',
      promoted: false,
      status: 'PUBLIC',
    },
    {
      slug: 'radplus',
      promoted: false,
      status: 'PUBLIC',
    },
    {
      slug: 'fahrradstellplaetze',
      promoted: false,
      status: 'PUBLIC',
    },
    {
      slug: 'ueberlingen',
      promoted: true,
      status: 'PUBLIC',
    },
    {
      slug: 'deutschland',
      promoted: false,
      status: 'PUBLIC',
    },
    {
      slug: 'radinfra',
      promoted: true,
      status: 'PUBLIC',
    },
    {
      slug: 'pankow',
      promoted: false,
      status: 'PUBLIC',
    },
    {
      slug: 'testing',
      promoted: false,
      status: 'PUBLIC',
    },
  ]

  for (const data of seedRegions) {
    if (data) {
      await db.region.create({ data })
    }
  }
}

export default seedRegions
