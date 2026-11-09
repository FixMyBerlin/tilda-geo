import { createFileRoute, redirect } from '@tanstack/react-router'
import { LayoutAdmin } from '@/components/layouts/LayoutAdmin'
import { isAdmin } from '@/components/shared/utils/usersUtils'
import {
  adminNavCountsQueryOptions,
  adminNavRegionsQueryOptions,
} from '@/server/admin/adminNavQueryOptions'
import { currentUserQueryOptions } from '@/server/users/currentUserQueryOptions'

export const Route = createFileRoute('/admin')({
  ssr: true,
  // Reads the cached current user, so a client-side load (e.g. a hash change from the section
  // scroll-spy) costs no request. SSR and logout refetch it; server functions check the role anyway.
  beforeLoad: async ({ context, location }) => {
    const { user } = await context.queryClient.ensureQueryData(currentUserQueryOptions())
    if (isAdmin(user)) return
    if (user) {
      throw redirect({ to: '/access-denied', search: { from: location.href } })
    }
    throw redirect({ to: '/api/sign-in/osm', search: { callbackURL: location.href } })
  },
  // Re-fetches stale counts and the region search list (sidebar switcher, `AdminRegionFilter`) on
  // each admin navigation so both catch up after mutations. Loaded once here for every admin page,
  // rather than per-route, since the sidebar is part of the shared admin shell.
  loader: async ({ context }) => {
    await Promise.all([
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
