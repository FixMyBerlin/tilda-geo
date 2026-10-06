import { adminFormAuditContext } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import { DeleteRegionContractSchema } from '@/server/region-contracts/regionContractSchema'
import { deleteRegionContractBySlug } from '@/server/region-contracts/regionContractWriteService.server'

export async function deleteRegionContract(input: { slug: string }, headers: Headers) {
  const admin = await requireAdmin(headers)
  const { slug } = DeleteRegionContractSchema.parse(input)
  return deleteRegionContractBySlug(slug, adminFormAuditContext(headers, admin.userId))
}
