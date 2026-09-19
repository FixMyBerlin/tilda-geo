import { createFileRoute } from '@tanstack/react-router'
import { PageNoteFolderEdit } from '@/components/admin/note-folders/PageNoteFolderEdit'
import { getAdminNoteFolderEditLoaderFn } from '@/server/admin/admin.functions'

export const Route = createFileRoute('/admin/note-folders/$id/edit')({
  ssr: true,
  loader: async ({ params }) => {
    return await getAdminNoteFolderEditLoaderFn({ data: { id: Number(params.id) } })
  },
  head: () => ({
    meta: [{ title: 'Ordner bearbeiten – ADMIN TILDA' }],
  }),
  component: PageNoteFolderEdit,
})
