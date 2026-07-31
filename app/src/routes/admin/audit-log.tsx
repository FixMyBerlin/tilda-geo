import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PageAuditLog } from '@/components/admin/audit-log/PageAuditLog'
import { getAdminAuditLogLoaderFn } from '@/server/admin/admin.functions'
import { AUDIT_CHANGE_SOURCES } from '@/server/audit/auditChangeSources.const'
import { offsetSearchFields } from '@/shared/pagination/offsetSearchSchema'

const auditLogSearchSchema = z
  .object({
    model: z.string().optional(),
    recordId: z.coerce.string().optional(),
    changeSource: z.enum(AUDIT_CHANGE_SOURCES).optional(),
  })
  .extend(offsetSearchFields({ maxTake: 200 }))

export const Route = createFileRoute('/admin/audit-log')({
  ssr: true,
  validateSearch: (search) => auditLogSearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => getAdminAuditLogLoaderFn({ data: deps }),
  head: () => ({
    meta: [{ title: 'Änderungsverlauf – ADMIN TILDA' }],
  }),
  component: PageAuditLog,
})
