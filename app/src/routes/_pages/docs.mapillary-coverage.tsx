import { createFileRoute } from '@tanstack/react-router'
import { PageMapillaryCoverage } from '@/components/pages/docs/PageMapillaryCoverage'
import { getMapillaryCoverageMetadataLoaderFn } from '@/server/api/docs.functions'

export const Route = createFileRoute('/_pages/docs/mapillary-coverage')({
  ssr: true,
  loader: async () => getMapillaryCoverageMetadataLoaderFn(),
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }, { title: 'Mapillary Abdeckung – tilda-geo.de' }],
  }),
  component: PageMapillaryCoverage,
})
