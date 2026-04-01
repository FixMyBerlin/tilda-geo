import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PageMembershipsNew } from '@/components/admin/memberships/PageMembershipsNew'
import { getAdminMembershipNewLoaderFn } from '@/server/admin/admin.functions'

const SearchSchema = z.object({
  regionSlug: z.string().optional(),
  userId: z.string().optional(),
})

export const Route = createFileRoute('/admin/memberships/new')({
  ssr: true,
  validateSearch: (search) => SearchSchema.parse(search),
  loader: async () => {
    return await getAdminMembershipNewLoaderFn()
  },
  component: PageMembershipsNew,
})
