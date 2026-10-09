import { createFileRoute } from '@tanstack/react-router'
import { PagePrivateBackgrounds } from '@/components/admin/private-backgrounds/PagePrivateBackgrounds'
import { getAdminPrivateBackgroundsLoaderFn } from '@/server/admin/admin.functions'

export const Route = createFileRoute('/admin/private-backgrounds/')({
  ssr: true,
  loader: async () => await getAdminPrivateBackgroundsLoaderFn(),
  head: () => ({
    meta: [{ title: 'Private Hintergrundkarten – ADMIN TILDA' }],
  }),
  component: PagePrivateBackgrounds,
})
