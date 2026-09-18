import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PageReviewLists } from '@/components/admin/review-lists/PageReviewLists'
import { optionalSearchString } from '@/lib/searchParamsSchema'
import { getAdminReviewListsLoaderFn } from '@/server/admin/admin.functions'

const reviewListsSearchSchema = z.object({
  regionSlug: optionalSearchString().catch(undefined),
})

export const Route = createFileRoute('/admin/review-lists/')({
  ssr: true,
  validateSearch: reviewListsSearchSchema,
  loaderDeps: ({ search }) => ({ regionSlug: search.regionSlug }),
  // Region filter options (`AdminRegionFilter`) load once in the parent `/admin` route.
  loader: ({ deps }) => getAdminReviewListsLoaderFn({ data: deps }),
  head: () => ({
    meta: [{ title: 'Prüflisten – ADMIN TILDA' }],
  }),
  component: PageReviewLists,
})
