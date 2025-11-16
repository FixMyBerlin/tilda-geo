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
 * - `public: true` if `region.logoPath !== null || region.externalLogoPath !== null`
 * - `exportPublic: true` if `region.bbox !== null`
 */
const seedRegions = async () => {
  const seedRegions: Prisma.RegionUncheckedCreateInput[] = [
    {
      slug: 'bibi',
      public: true,
      exportPublic: true,
    },
    {
      slug: 'trto',
      public: true,
      exportPublic: true,
    },
    {
      slug: 'berlin',
      public: false,
      exportPublic: false,
    },
    {
      slug: 'infravelo',
      public: true,
      exportPublic: true,
    },
    {
      slug: 'parkraum-berlin',
      public: true,
      exportPublic: false,
    },
    {
      slug: 'parkraum-berlin-euvm',
      public: true,
      exportPublic: true,
    },
    {
      slug: 'parkraum',
      public: true,
      exportPublic: false,
    },
    {
      slug: 'nudafa',
      public: true,
      exportPublic: true,
    },
    {
      slug: 'rs8',
      public: false,
      exportPublic: true,
    },
    {
      slug: 'mainz',
      public: false,
      exportPublic: true,
    },
    {
      slug: 'lueneburg',
      public: false,
      exportPublic: true,
    },
    {
      slug: 'woldegk',
      public: false,
      exportPublic: true,
    },
    {
      slug: 'trassenscout-umfragen',
      public: false,
      exportPublic: false,
    },
    {
      slug: 'ostalbkreis',
      public: false,
      exportPublic: true,
    },
    {
      slug: 'langerwehe',
      public: false,
      exportPublic: true,
    },
    {
      slug: 'herrenberg',
      public: false,
      exportPublic: true,
    },
    {
      slug: 'magdeburg',
      public: false,
      exportPublic: true,
    },
    {
      slug: 'bb',
      public: false,
      exportPublic: true,
    },
    {
      slug: 'bb-beteiligung',
      public: false,
      exportPublic: true,
    },
    {
      slug: 'bb-pg',
      public: false,
      exportPublic: true,
    },
    {
      slug: 'bb-sg',
      public: false,
      exportPublic: true,
    },
    {
      slug: 'bb-kampagne',
      public: false,
      exportPublic: true,
    },
    {
      slug: 'muenchen',
      public: false,
      exportPublic: true,
    },
    {
      slug: 'nrw',
      public: false,
      exportPublic: false,
    },
    {
      slug: 'radplus',
      public: false,
      exportPublic: false,
    },
    {
      slug: 'fahrradstellplaetze',
      public: false,
      exportPublic: true,
    },
    {
      slug: 'ueberlingen',
      public: true,
      exportPublic: true,
    },
    {
      slug: 'deutschland',
      public: false,
      exportPublic: true,
    },
    {
      slug: 'radinfra',
      public: true,
      exportPublic: false,
    },
    {
      slug: 'pankow',
      public: false,
      exportPublic: false,
    },
    {
      slug: 'testing',
      public: false,
      exportPublic: true,
    },
  ]

  for (const data of seedRegions) {
    if (data) {
      await db.region.create({ data })
    }
  }
}

export default seedRegions
