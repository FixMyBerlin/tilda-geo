import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import {
  regionContractInclude,
  regionContractRowToClient,
} from '@/server/region-contracts/regionContractMapper.server'

export async function getRegionContracts(headers: Headers) {
  await requireAdmin(headers)

  const contracts = await db.regionContract.findMany({
    include: regionContractInclude,
    orderBy: { name: 'asc' },
  })
  return contracts.map(regionContractRowToClient)
}
