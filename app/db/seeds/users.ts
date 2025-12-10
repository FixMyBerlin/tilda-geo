import { Prisma } from '@prisma/client'
import db from '../index'

type Users = Prisma.UserUncheckedCreateInput[]

export const generateUserEmail = (slug: string) => `${slug}@example.com`

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

let osmId = 1000

const seedUsers = async () => {
  const allRegions = await db.region.findMany()
  // password: dev-team@fixmycity.de
  const hashedPassword =
    'JGFyZ29uMmlkJHY9MTkkbT02NTUzNix0PTIscD0xJDRMWm82dmVrRk91VnVlZTVwcEpiS3ckOHFZcHhyM2RITm0yTGxTeXdqeEcxSWFsZEJCUWhxNVZxdm53eHoxTk4xTQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='

  const genericUsers: Users = [
    {
      osmId: osmId++,
      osmName: `OsmName${osmId++}`,
      osmDescription: undefined,
      role: 'ADMIN',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: undefined,
      hashedPassword,
    },
    {
      osmId: osmId++,
      osmName: `OsmName${osmId++}`,
      osmDescription: undefined,
      role: 'USER',
      email: 'all-regions@example.com',
      firstName: 'All-Regions',
      lastName: undefined,
      hashedPassword,
    },
    {
      osmId: osmId++,
      osmName: `OsmName${osmId++}`,
      osmDescription: undefined,
      role: 'USER',
      email: 'no-region@example.com',
      firstName: 'No-Region',
      lastName: undefined,
      hashedPassword,
    },
  ]

  const regionAdmins: Users = allRegions.map(({ id, slug }) => ({
    osmId: osmId++,
    osmName: `OsmName${osmId++}`,
    osmDescription: undefined,
    role: 'USER',
    email: generateUserEmail(slug),
    firstName: `${capitalize(slug)}-Admin`,
    lastName: undefined,
    hashedPassword,
  }))

  const fmcAdmins: Users = [
    {
      osmId: 11881,
      osmName: 'tordans',
      osmDescription: undefined,
      role: 'ADMIN',
      email: 'tobias@fixmycity.de',
      firstName: 'Tobias',
      lastName: 'Jordans',
      hashedPassword,
    },
    {
      // On master.apis.dev.openstreetmap.org
      osmId: 6501,
      osmName: 'tordansdev',
      osmDescription: undefined,
      role: 'ADMIN',
      email: 'tobias+osmdev@fixmycity.de',
      firstName: 'Tobias',
      lastName: 'Jordans',
      hashedPassword,
    },
  ]

  const users = [...genericUsers, ...regionAdmins, ...fmcAdmins]
  for (const user of users) {
    await db.user.create({ data: user })
  }
}

export default seedUsers
