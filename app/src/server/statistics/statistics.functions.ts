import { createServerFn } from '@tanstack/react-start'
import { getAllStatistics } from '@/server/statistics/queries/getAllStatistics.server'

export const getAllStatisticsLoaderFn = createServerFn({ method: 'GET' }).handler(async () => {
  return getAllStatistics()
})
