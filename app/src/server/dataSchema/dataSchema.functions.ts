import { createServerFn } from '@tanstack/react-start'
import { getRequest, getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { requireAdmin } from '@/server/auth/session.server'
import { extendBunRequestIdleTimeout } from '@/server/http/extendBunRequestIdleTimeout.server'
import { listDataSchemaOverview } from './dataSchemaQueries.server'
import { dataSchemaIdentifierSchema } from './dataSchemaSpec.schema'
import { importDataSchemaTable } from './importDataSchemaTable.server'

export const getDataSchemaOverviewLoaderFn = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin(getRequestHeaders())
  const started = performance.now()
  const overview = await listDataSchemaOverview()
  const tableCount = overview.datasets.length
  console.info(
    `[data-schema] overview ${Math.round(performance.now() - started)}ms — ${tableCount} tables`,
  )
  return { datasets: overview.datasets, listError: overview.listError }
})

const ImportDataSchemaInput = z.object({
  table: dataSchemaIdentifierSchema,
  snapshotId: z.string().min(1).nullable().optional(),
})

export const importDataSchemaTableFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof ImportDataSchemaInput>) => ImportDataSchemaInput.parse(data))
  .handler(async ({ data }) => {
    const admin = await requireAdmin(getRequestHeaders())
    extendBunRequestIdleTimeout(getRequest(), 0)
    const result = await importDataSchemaTable({
      table: data.table,
      snapshotId: data.snapshotId ?? null,
      userId: admin.userId,
    })
    return {
      warning: result.warning ?? null,
    }
  })
