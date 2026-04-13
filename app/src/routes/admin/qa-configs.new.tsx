import { createFileRoute } from '@tanstack/react-router'
import { PageQaConfigsNew } from '@/components/admin/qa-configs/PageQaConfigsNew'
import { getAdminQaConfigNewLoaderFn } from '@/server/admin/admin.functions'

export const Route = createFileRoute('/admin/qa-configs/new')({
  ssr: true,
  loader: async () => {
    return await getAdminQaConfigNewLoaderFn()
  },
  component: PageQaConfigsNew,
})
