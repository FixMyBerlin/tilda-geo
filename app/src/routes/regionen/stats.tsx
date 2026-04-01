import { createFileRoute } from '@tanstack/react-router'
import { PageStats } from '@/components/regionen/PageStats'
import { getAllStatisticsLoaderFn } from '@/server/statistics/statistics.functions'

export const Route = createFileRoute('/regionen/stats')({
  ssr: true,
  loader: async () => getAllStatisticsLoaderFn(),
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }, { title: 'Download – tilda-geo.de' }],
  }),
  component: PageStats,
})
