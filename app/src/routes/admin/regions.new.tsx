import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PageRegionsNew } from '@/components/admin/regions/PageRegionsNew'
import { optionalSearchString } from '@/lib/searchParamsSchema'
import { getAdminRegionsLoaderFn } from '@/server/admin/admin.functions'

const SearchSchema = z.object({
  slug: optionalSearchString(),
})

export const Route = createFileRoute('/admin/regions/new')({
  ssr: true,
  validateSearch: (search) => SearchSchema.parse(search),
  loader: async () => await getAdminRegionsLoaderFn(),
  component: PageRegionsNew,
})
