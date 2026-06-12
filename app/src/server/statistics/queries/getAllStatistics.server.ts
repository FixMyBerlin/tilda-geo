import { notFound } from '@tanstack/react-router'
import { geoDataClient } from '@/server/prisma-client.server'

type StatisticsRow = {
  name: string | null
  level: string | null
  road_length: Record<string, number>
  bikelane_length: Record<string, number> | null
}

export async function getAllStatistics() {
  const stats = await geoDataClient.$queryRaw<StatisticsRow[]>`
    SELECT name, level, road_length, bikelane_length from public.aggregated_lengths;`

  if (!stats) {
    throw notFound()
  }

  return stats
}
