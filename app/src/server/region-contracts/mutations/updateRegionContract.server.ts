import { adminFormAuditContext, runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import {
  regionContractConfigToUpdateData,
  regionContractDetailInclude,
  regionContractRowToDetail,
} from '@/server/region-contracts/regionContractMapper.server'
import type { RegionContractConfigInput } from '@/server/region-contracts/regionContractSchema'
import { errorState, successState } from '@/server/utils/validation'

export async function updateRegionContractWithData(
  slug: string,
  data: RegionContractConfigInput,
  headers: Headers,
) {
  try {
    const admin = await requireAdmin(headers)
    const existing = await db.regionContract.findUnique({ where: { slug } })
    if (!existing) throw new Error(`Auftrag nicht gefunden: ${slug}`)

    const refreshed = await runWithAuditContextAsync(
      adminFormAuditContext(headers, admin.userId),
      async () =>
        db.regionContract.update({
          where: { slug },
          data: regionContractConfigToUpdateData(data),
          include: regionContractDetailInclude,
        }),
    )

    return successState({ data: regionContractRowToDetail(refreshed) })
  } catch (error) {
    return errorState(error, 'Fehler beim Aktualisieren des Auftrags')
  }
}
