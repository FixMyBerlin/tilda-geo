import type { Prisma } from '@prisma/client'
import db from '../../src/server/db.server'
import { generateUserEmail } from './users'

type Memberships = Prisma.MembershipUncheckedCreateInput[]

const seedMemberships = async () => {
  const regions = await db.region.findMany()
  const users = await db.user.findMany()
  const usersByEmail = Object.fromEntries(users.map((user) => [user.email, user]))

  const regionMemberships: Memberships = regions.map(({ id, slug }) => {
    const user = usersByEmail[generateUserEmail(slug)]
    if (!user) throw new Error(`Seed user not found for slug: ${slug}`)
    return { regionId: id, userId: user.id }
  })

  const allRegionsUser = usersByEmail['all-regions@example.com']
  if (!allRegionsUser) throw new Error('Seed user all-regions@example.com not found')
  const allRegionsAdminId = allRegionsUser.id
  const allMemberships: Memberships = regions.map(({ id }) => ({
    regionId: id,
    userId: allRegionsAdminId,
  }))

  const memberships = [...regionMemberships, ...allMemberships]

  for (const data of memberships) {
    if (data) {
      await db.membership.create({ data })
    }
  }
}

export default seedMemberships
