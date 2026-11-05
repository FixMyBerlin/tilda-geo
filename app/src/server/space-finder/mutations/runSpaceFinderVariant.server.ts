import { z } from 'zod'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import { authorizeSpaceFinderVariant } from '../authorizeSpaceFinderRegion.server'
import { VariantIdInput } from '../schemas'

export async function runSpaceFinderVariant(
  data: z.infer<typeof VariantIdInput>,
  headers: Headers,
) {
  const session = await authorizeSpaceFinderVariant(headers, data.variantId)
  const job = await runWithAuditContextAsync(memberFormAuditContext(headers, session.userId), () =>
    db.spaceFinderJob.create({
      data: { variantId: data.variantId, status: 'QUEUED' },
      select: { id: true, status: true, variantId: true },
    }),
  )
  await db.$executeRaw`SELECT pg_notify('space_finder_jobs', ${String(job.id)})`
  return { id: job.id, status: job.status }
}
