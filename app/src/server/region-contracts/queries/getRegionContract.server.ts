import { notFound } from '@tanstack/react-router'
import db from '@/server/db.server'
import {
  regionContractDetailInclude,
  regionContractRowToDetail,
} from '@/server/region-contracts/regionContractMapper.server'

export async function getRegionContractBySlug(slug: string) {
  const contract = await db.regionContract.findUnique({
    where: { slug },
    include: regionContractDetailInclude,
  })
  if (!contract) throw notFound()
  return regionContractRowToDetail(contract)
}
