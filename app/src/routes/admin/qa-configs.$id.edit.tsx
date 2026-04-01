import { createFileRoute } from '@tanstack/react-router'
import { PageQaConfigEdit } from '@/components/admin/qa-configs/PageQaConfigEdit'
import { getAdminQaConfigEditLoaderFn } from '@/server/admin/admin.functions'

export const Route = createFileRoute('/admin/qa-configs/$id/edit')({
  ssr: true,
  loader: async ({ params }) => {
    const id = Number(params.id)
    const result = await getAdminQaConfigEditLoaderFn({ data: { id } })
    return { ...result, id }
  },
  component: PageQaConfigEdit,
})
