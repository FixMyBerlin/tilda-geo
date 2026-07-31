import type { Prisma } from '@/prisma/generated/client'
import db from '../../src/server/db.server'

type Users = Prisma.UserUncheckedCreateInput[]

export const generateUserEmail = (slug: string) => `${slug}@example.com`

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

let osmId = 1000

const seedUsers = async () => {
  const allRegions = await db.region.findMany()

  const genericUsers: Users = [
    {
      osmId: osmId++,
      osmName: `OsmName${osmId++}`,
      osmDescription: undefined,
      role: 'ADMIN',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: undefined,
    },
    {
      osmId: osmId++,
      osmName: `OsmName${osmId++}`,
      osmDescription: undefined,
      role: 'USER',
      email: 'all-regions@example.com',
      firstName: 'All-Regions',
      lastName: undefined,
    },
    {
      osmId: osmId++,
      osmName: `OsmName${osmId++}`,
      osmDescription: undefined,
      role: 'USER',
      email: 'no-region@example.com',
      firstName: 'No-Region',
      lastName: undefined,
    },
  ]

  const regionAdmins: Users = allRegions.map(({ slug }) => ({
    osmId: osmId++,
    osmName: `OsmName${osmId++}`,
    osmDescription: undefined,
    role: 'USER',
    email: generateUserEmail(slug),
    firstName: `${capitalize(slug)}-Admin`,
    lastName: undefined,
  }))

  // FMC admins + local MCP token: scripts/seed-local/seedLocalAccess.ts (shared with db-pull)
  for (const user of [...genericUsers, ...regionAdmins]) {
    await db.user.create({ data: user })
  }
}

export default seedUsers
