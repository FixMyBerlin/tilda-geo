import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { z } from 'zod'
import { PageAuditLog } from '@/components/admin/audit-log/PageAuditLog'
import { optionalSearchString } from '@/lib/searchParamsSchema'
import { getAdminAuditLogLoaderFn } from '@/server/admin/admin.functions'
import { AUDIT_CHANGE_SOURCES } from '@/server/audit/auditChangeSources.const'
import { createPageSearchSchema, pageSearchDefaults } from '@/shared/pagination/pageSearchSchema'

const auditLogSearchSchema = z
  .object({
    model: z.string().optional(),
    recordId: z.coerce.string().optional(),
    changeSource: z.enum(AUDIT_CHANGE_SOURCES).optional().catch(undefined),
    regionSlug: optionalSearchString().catch(undefined),
  })
  .extend(createPageSearchSchema().shape)

export const Route = createFileRoute('/admin/audit-log')({
  ssr: true,
  validateSearch: auditLogSearchSchema,
  search: { middlewares: [stripSearchParams(pageSearchDefaults)] },
  loaderDeps: ({ search }) => search,
  // Region filter options (`AdminRegionFilter`) load once in the parent `/admin` route.
  loader: ({ deps }) => getAdminAuditLogLoaderFn({ data: deps }),
  head: () => ({
    meta: [{ title: 'Änderungsverlauf – ADMIN TILDA' }],
  }),
  component: PageAuditLog,
})
