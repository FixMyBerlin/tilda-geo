import { requireAdmin } from '@/server/auth/session.server'
import { listRegionContracts } from '@/server/region-contracts/regionContractWriteService.server'

export async function getRegionContracts(headers: Headers) {
  await requireAdmin(headers)
  return listRegionContracts()
}
