import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PageQaConfigs } from '@/components/admin/qa-configs/PageQaConfigs'
import { optionalSearchString } from '@/lib/searchParamsSchema'
import { getAdminQaConfigsLoaderFn } from '@/server/admin/admin.functions'

const qaConfigsSearchSchema = z.object({
  regionSlug: optionalSearchString().catch(undefined),
})

export const Route = createFileRoute('/admin/qa-configs/')({
  ssr: true,
  validateSearch: qaConfigsSearchSchema,
  loaderDeps: ({ search }) => ({ regionSlug: search.regionSlug }),
  // Region filter options (`AdminRegionFilter`) load once in the parent `/admin` route.
  loader: ({ deps }) => getAdminQaConfigsLoaderFn({ data: deps }),
  head: () => ({
    meta: [{ title: 'QA-Konfigurationen – ADMIN TILDA' }],
  }),
  component: PageQaConfigs,
})
