import { createFileRoute } from '@tanstack/react-router'
import { PageUserEdit } from '@/components/admin/users/PageUserEdit'
import { getAdminUserEditLoaderFn } from '@/server/admin/admin.functions'

export const Route = createFileRoute('/admin/users/$userId/edit')({
  ssr: true,
  loader: async ({ params }) => {
    return await getAdminUserEditLoaderFn({ data: { userId: params.userId } })
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.user.osmName || 'Nutzer'} – ADMIN TILDA` }],
  }),
  component: PageUserEdit,
})
