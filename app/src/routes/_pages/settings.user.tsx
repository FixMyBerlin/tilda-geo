import { createFileRoute, notFound } from '@tanstack/react-router'
import { PageSettingsUser } from '@/components/pages/settings/user/PageSettingsUser'
import { getCurrentUserLoaderFn } from '@/server/users/users.functions'

export const Route = createFileRoute('/_pages/settings/user')({
  ssr: true,
  loader: async () => {
    const { user } = await getCurrentUserLoaderFn()
    if (!user) {
      throw notFound()
    }
    return { user }
  },
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }, { title: 'Account bearbeiten – tilda-geo.de' }],
  }),
  component: PageSettingsUser,
})
