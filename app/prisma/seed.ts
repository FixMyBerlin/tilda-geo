import seedInternalNotes from './seeds/atlasNotes'
import seedMemberships from './seeds/memberships'
import seedUploads from './seeds/pmtiles'
import seedQaConfigs from './seeds/qaConfigs'
import seedQaEvaluations from './seeds/qaEvaluations'
import seedRegions from './seeds/regions'
import seedUsers from './seeds/users'

const seed = async () => {
  await seedRegions()
  await seedUsers()
  await seedMemberships()
  await seedUploads()
  await seedInternalNotes()
  await seedQaConfigs()
  await seedQaEvaluations()
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
