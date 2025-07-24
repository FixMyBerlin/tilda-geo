import seedInternalNotes from './seeds/atlasNotes'
import seedBikelaneVerification from './seeds/bikelaneVerification'
import seedMemberships from './seeds/memberships'
import seedUploads from './seeds/pmtiles'
import seedRegions from './seeds/regions'
import seedUsers from './seeds/users'

/*
 * This seed function is executed when you run `blitz db seed`.
 */
const seed = async () => {
  await seedRegions()
  await seedBikelaneVerification()
  await seedUsers()
  await seedMemberships()
  await seedUploads()
  await seedInternalNotes()
}

export default seed
