import { runWithAuditContextAsync } from '../../src/server/audit/auditContext.server'
import db from '../../src/server/db.server'
import { seedRegionContractCatalog } from './regionContractSeedCatalog'

const seedRegionContracts = async () => {
  await runWithAuditContextAsync({ metadata: { changeSource: 'MIGRATION' } }, async () => {
    for (const contract of seedRegionContractCatalog) {
      await db.regionContract.upsert({
        where: { slug: contract.slug },
        create: {
          slug: contract.slug,
          name: contract.name,
          status: contract.status,
          regions: { connect: contract.regionSlugs.map((slug) => ({ slug })) },
        },
        update: {
          name: contract.name,
          status: contract.status,
          regions: { set: contract.regionSlugs.map((slug) => ({ slug })) },
        },
      })
    }
  })
}

export default seedRegionContracts
