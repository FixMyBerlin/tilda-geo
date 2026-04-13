import { notFound } from '@tanstack/react-router'
import { geoDataClient } from '@/server/prisma-client.server'
import { hasAggregatedLengthsTable } from './guardAggregatedLengths.server'

type StatisticsRow = {
  name: string | null
  level: string | null
  road_length: Record<string, number>
  bikelane_length: Record<string, number> | null
}

export async function getAllStatistics() {
  const tableExists = await hasAggregatedLengthsTable()
  if (!tableExists) return []

  const stats = await geoDataClient.$queryRaw<StatisticsRow[]>`
    SELECT name, level, road_length, bikelane_length from public.aggregated_lengths;`

  if (!stats) {
    throw notFound()
  }

  return stats
}
