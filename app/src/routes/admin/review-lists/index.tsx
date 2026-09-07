import { createFileRoute } from '@tanstack/react-router'
import { PageReviewLists } from '@/components/admin/review-lists/PageReviewLists'
import { getAdminReviewListsLoaderFn } from '@/server/admin/admin.functions'

export const Route = createFileRoute('/admin/review-lists/')({
  ssr: true,
  loader: async () => await getAdminReviewListsLoaderFn(),
  head: () => ({
    meta: [{ title: 'Prüflisten – ADMIN TILDA' }],
  }),
  component: PageReviewLists,
})
