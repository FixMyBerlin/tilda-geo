import { runWithAuditContextAsync, type AuditContext } from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import {
  regionContractConfigToCreateData,
  regionContractConfigToUpdateData,
  regionContractDetailInclude,
  regionContractInclude,
  regionContractRowToClient,
  regionContractRowToDetail,
} from '@/server/region-contracts/regionContractMapper.server'
import {
  RegionContractConfigSchema,
  type RegionContractConfigInput,
} from '@/server/region-contracts/regionContractSchema'

export async function listRegionContracts() {
  const contracts = await db.regionContract.findMany({
    include: regionContractInclude,
    orderBy: { name: 'asc' },
  })
  return contracts.map(regionContractRowToClient)
}

export async function getRegionContractDetail(slug: string) {
  const contract = await db.regionContract.findUnique({
    where: { slug },
    include: regionContractDetailInclude,
  })
  if (!contract) throw new Error(`Auftrag nicht gefunden: ${slug}`)
  return regionContractRowToDetail(contract)
}

export async function createRegionContract(
  config: RegionContractConfigInput,
  auditContext: AuditContext = {},
) {
  const data = RegionContractConfigSchema.parse(config)
  const created = await runWithAuditContextAsync(auditContext, () =>
    db.regionContract.create({
      data: regionContractConfigToCreateData(data),
      include: regionContractDetailInclude,
    }),
  )
  return regionContractRowToDetail(created)
}

export async function updateRegionContract(
  slug: string,
  config: RegionContractConfigInput,
  auditContext: AuditContext = {},
) {
  const data = RegionContractConfigSchema.parse(config)
  const existing = await db.regionContract.findUnique({ where: { slug } })
  if (!existing) throw new Error(`Auftrag nicht gefunden: ${slug}`)

  const updated = await runWithAuditContextAsync(auditContext, () =>
    db.regionContract.update({
      where: { slug },
      data: regionContractConfigToUpdateData(data),
      include: regionContractDetailInclude,
    }),
  )
  return regionContractRowToDetail(updated)
}

export async function deleteRegionContractBySlug(slug: string, auditContext: AuditContext = {}) {
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

  return runWithAuditContextAsync(auditContext, () => db.regionContract.delete({ where: { slug } }))
}
