import { createFileRoute } from '@tanstack/react-router'
import { PageReviewListEdit } from '@/components/admin/review-lists/PageReviewListEdit'
import { getAdminReviewListEditLoaderFn } from '@/server/admin/admin.functions'

export const Route = createFileRoute('/admin/review-lists/$id/edit')({
  ssr: true,
  loader: async ({ params }) => {
    return await getAdminReviewListEditLoaderFn({ data: { id: Number(params.id) } })
  },
  head: () => ({
    meta: [{ title: 'Prüfliste bearbeiten – ADMIN TILDA' }],
  }),
  component: PageReviewListEdit,
})
