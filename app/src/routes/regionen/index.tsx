import { createFileRoute } from '@tanstack/react-router'
import { PageIndex } from '@/components/regionen/PageIndex'
import { regionenIndexQueryOptions } from '@/server/regions/regionenIndexQueryOptions'

export const Route = createFileRoute('/regionen/')({
  ssr: true,
  loader: ({ context }) => context.queryClient.ensureQueryData(regionenIndexQueryOptions()),
  head: () => ({
    meta: [{ title: 'Regionenauswahl – tilda-geo.de' }, { name: 'robots', content: 'nofollow' }],
  }),

  component: PageIndex,
})
