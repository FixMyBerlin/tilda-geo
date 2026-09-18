import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { requireAdmin } from '@/server/auth/session.server'
import { ADMIN_DEFAULT_PAGE_SIZE } from '@/shared/pagination/constants'
import { createPageSearchSchema } from '@/shared/pagination/pageSearchSchema'
import { pageToSkipTake } from '@/shared/pagination/pageToSkipTake'
import { getProcessingRun } from './queries/getProcessingRun.server'
import { listProcessingRuns } from './queries/listProcessingRuns.server'

const ProcessingOverviewInput = createPageSearchSchema()

export const getAdminProcessingOverviewLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.input<typeof ProcessingOverviewInput>) =>
    ProcessingOverviewInput.parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    await requireAdmin(getRequestHeaders())
    const runs = await listProcessingRuns(pageToSkipTake(data), {
      fallbackToLastPage: true,
    })
    // The 14-day chart and „Letzter Lauf“ always show the newest runs, independent of the table page.
    const latestRuns =
      runs.skip === 0 && runs.take >= ADMIN_DEFAULT_PAGE_SIZE
        ? runs.rows
        : (await listProcessingRuns({ take: ADMIN_DEFAULT_PAGE_SIZE })).rows
    return { runs, latestRuns }
  })

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
