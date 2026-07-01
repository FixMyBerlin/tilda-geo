import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { getProcessingRunDetailForAdmin } from './queries/getProcessingRunDetailForAdmin.server'
import { getProcessingRunsForAdmin } from './queries/getProcessingRunsForAdmin.server'

export const getAdminProcessingOverviewLoaderFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders()
    const runs = await getProcessingRunsForAdmin(headers)
    return { runs }
  },
)

const ProcessingRunDetailInput = z.object({ metaId: z.number() })

export const getAdminProcessingRunDetailLoaderFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof ProcessingRunDetailInput>) =>
    ProcessingRunDetailInput.parse(data),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const run = await getProcessingRunDetailForAdmin(data.metaId, headers)
    return { run }
  })
