import { adminFormAuditContext } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import type { RegionContractConfigInput } from '@/server/region-contracts/regionContractSchema'
import { updateRegionContract } from '@/server/region-contracts/regionContractWriteService.server'
import { errorState, successState } from '@/server/utils/validation'

export async function updateRegionContractWithData(
  slug: string,
  data: RegionContractConfigInput,
  headers: Headers,
) {
  try {
    const admin = await requireAdmin(headers)
    const contract = await updateRegionContract(
      slug,
      data,
      adminFormAuditContext(headers, admin.userId),
    )
    return successState({ data: contract })
  } catch (error) {
    return errorState(error, 'Fehler beim Aktualisieren des Auftrags')
  }
}
