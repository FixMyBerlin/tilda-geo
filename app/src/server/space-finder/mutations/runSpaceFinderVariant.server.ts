import { z } from 'zod'
import db from '@/server/db.server'
import { authorizeSpaceFinderVariant } from '../authorizeSpaceFinderRegion.server'
import { VariantIdInput } from '../schemas'

export async function runSpaceFinderVariant(
  data: z.infer<typeof VariantIdInput>,
  headers: Headers,
) {
  await authorizeSpaceFinderVariant(headers, data.variantId)
  const job = await db.spaceFinderJob.create({
    data: { variantId: data.variantId, status: 'QUEUED' },
    select: { id: true, status: true },
  })
  await db.$executeRaw`SELECT pg_notify('space_finder_jobs', ${String(job.id)})`
  return job
}
