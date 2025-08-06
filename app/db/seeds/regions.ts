import { Prisma } from '@prisma/client'
import db from '../index'

const seedRegions = async () => {
  const seedRegions: Prisma.RegionUncheckedCreateInput[] = [
    {
      slug: 'testing',
      public: true,
      exportPublic: false,
    },
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
      slug: 'nudafa',
      public: false,
      exportPublic: false,
    },
    {
      slug: 'parkraum',
      public: true,
      exportPublic: true,
    },
    {
      slug: 'rs8',
      public: false,
      exportPublic: false,
    },
    {
      slug: 'woldegk',
      public: true,
      exportPublic: false,
    },
    {
      slug: 'deutschland',
      public: false,
      exportPublic: false,
    },
    {
      slug: 'bb',
      public: true,
      exportPublic: false,
    },
    {
      slug: 'bb-kampagne',
      public: false,
      exportPublic: false,
    },
    {
      slug: 'bb-sg',
      public: false,
      exportPublic: false,
    },
    {
      slug: 'bb-pg',
      public: false,
      exportPublic: false,
    },
    {
      slug: 'bb-beteiligung',
      public: false,
      exportPublic: false,
    },
    {
      slug: 'parkraum-berlin-euvm',
      public: false,
      exportPublic: false,
    },
  ]

  for (const data of seedRegions) {
    if (data) {
      await db.region.create({ data })
    }
  }
}

export default seedRegions
