import { adminFormAuditContext, runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import {
  regionContractConfigToCreateData,
  regionContractDetailInclude,
  regionContractRowToDetail,
} from '@/server/region-contracts/regionContractMapper.server'
import type { RegionContractConfigInput } from '@/server/region-contracts/regionContractSchema'
import { errorState, successState } from '@/server/utils/validation'

export async function createRegionContractWithData(
  data: RegionContractConfigInput,
  headers: Headers,
) {
  try {
    const admin = await requireAdmin(headers)

    const refreshed = await runWithAuditContextAsync(
      adminFormAuditContext(headers, admin.userId),
      async () =>
        db.regionContract.create({
          data: regionContractConfigToCreateData(data),
          include: regionContractDetailInclude,
        }),
    )

    return successState({ data: regionContractRowToDetail(refreshed) })
  } catch (error) {
    return errorState(error, 'Fehler beim Anlegen des Auftrags')
  }
}
