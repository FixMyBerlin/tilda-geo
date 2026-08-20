import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { requireAdmin } from '@/server/auth/session.server'
import { getProcessingRun } from './queries/getProcessingRun.server'
import { listProcessingRuns } from './queries/listProcessingRuns.server'

export const getAdminProcessingOverviewLoaderFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAdmin(getRequestHeaders())
    const { rows } = await listProcessingRuns({ take: 50 })
    return { runs: rows }
  },
)

const ProcessingRunDetailInput = z.object({ metaId: z.number() })

export const getAdminProcessingRunDetailLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof ProcessingRunDetailInput>) =>
    ProcessingRunDetailInput.parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin(getRequestHeaders())
    try {
      const run = await getProcessingRun(data.metaId)
      return { run }
    } catch {
      throw notFound()
    }
  })
