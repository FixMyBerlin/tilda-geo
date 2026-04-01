import { createFileRoute, redirect } from '@tanstack/react-router'
import { LayoutAdmin } from '@/components/admin/LayoutAdmin'
import { getIsAdminFn } from '@/server/admin/getIsAdminForRoute.functions'

export const Route = createFileRoute('/admin')({
  ssr: true,
  beforeLoad: async ({ location }) => {
    const { isAdmin, isLoggedIn } = await getIsAdminFn()
    if (isAdmin) return
    if (isLoggedIn) {
      throw redirect({ to: '/access-denied', search: { from: location.href } })
    }
    throw redirect({ to: '/api/sign-in/osm', search: { callbackURL: location.href } })
  },
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }],
  }),
  component: LayoutAdmin,
})
