import { createFileRoute } from '@tanstack/react-router'
import { PageQaConfigs } from '@/components/admin/qa-configs/PageQaConfigs'
import { getAdminQaConfigsLoaderFn } from '@/server/admin/admin.functions'

export const Route = createFileRoute('/admin/qa-configs/')({
  ssr: true,
  loader: async () => {
    return await getAdminQaConfigsLoaderFn()
  },
  head: () => ({
    meta: [{ title: 'QA Konfigurationen – ADMIN TILDA' }],
  }),
  component: PageQaConfigs,
})
