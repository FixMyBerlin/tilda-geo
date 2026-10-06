import { createFileRoute, redirect } from '@tanstack/react-router'
import { LayoutAdmin } from '@/components/layouts/LayoutAdmin'
import {
  adminNavCountsQueryOptions,
  adminNavRegionsQueryOptions,
} from '@/server/admin/adminNavQueryOptions'
import { getIsAdminFn } from '@/server/admin/getIsAdminForRoute.functions'
import { currentUserQueryOptions } from '@/server/users/currentUserQueryOptions'

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
  // Re-fetches stale counts and the region search list (sidebar switcher, `AdminRegionFilter`) on
  // each admin navigation so both catch up after mutations. Loaded once here for every admin page,
  // rather than per-route, since the sidebar is part of the shared admin shell.
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(currentUserQueryOptions()),
      context.queryClient.ensureQueryData({
        ...adminNavCountsQueryOptions(),
        revalidateIfStale: true,
      }),
      context.queryClient.ensureQueryData({
        ...adminNavRegionsQueryOptions(),
        revalidateIfStale: true,
      }),
    ])
  },
  head: () => ({
    meta: [{ title: 'ADMIN – TILDA' }, { name: 'robots', content: 'noindex' }],
  }),
  component: LayoutAdmin,
})
