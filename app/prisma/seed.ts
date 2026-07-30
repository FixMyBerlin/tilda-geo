import { runGeoBootstrap } from '../scripts/geo-bootstrap/run'
import { seedLocalAccess } from '../scripts/seed-local/seedLocalAccess'
import { offerLocalCursorMcpSetup } from '../scripts/seed-local/setupCursorMcp'
import seedInternalNotes from './seeds/atlasNotes'
import seedMemberships from './seeds/memberships'
import seedUploads from './seeds/pmtiles'
import seedProcessingMeta from './seeds/processingMeta'
import seedQaConfigs from './seeds/qaConfigs'
import seedQaEvaluations from './seeds/qaEvaluations'
import seedRegionContracts from './seeds/regionContracts'
import seedRegions from './seeds/regions'
import seedUsers from './seeds/users'

const seed = async () => {
  await runGeoBootstrap()

  await seedRegions()
  await seedRegionContracts()
  await seedUsers()
  await seedLocalAccess()
  await seedMemberships()
  await seedUploads()
  await seedInternalNotes()
  await seedQaConfigs()
  await seedQaEvaluations()
  await seedProcessingMeta()
  await offerLocalCursorMcpSetup()
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
