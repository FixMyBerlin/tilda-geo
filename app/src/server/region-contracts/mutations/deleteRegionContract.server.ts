import { adminFormAuditContext, runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { DeleteRegionContractSchema } from '@/server/region-contracts/regionContractSchema'

export async function deleteRegionContract(input: { slug: string }, headers: Headers) {
  const admin = await requireAdmin(headers)
  const { slug } = DeleteRegionContractSchema.parse(input)

  const contract = await db.regionContract.findUnique({
    where: { slug },
    include: { _count: { select: { regions: true } } },
  })
  if (!contract) throw new Error(`Auftrag nicht gefunden: ${slug}`)
  if (contract._count.regions > 0) {
    throw new Error(
      `Auftrag »${slug}« hat noch ${contract._count.regions} zugewiesene Region(en). Bitte zuerst Regionen entfernen.`,
    )
  }

  return runWithAuditContextAsync(adminFormAuditContext(headers, admin.userId), () =>
    db.regionContract.delete({ where: { slug } }),
  )
}
