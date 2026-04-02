import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { createQaConfigWithData } from './mutations/createQaConfig.server'
import { CreateQaEvaluationSchema, createQaEvaluation } from './mutations/createQaEvaluation.server'
import { deleteQaConfig } from './mutations/deleteQaConfig.server'
import { updateQaConfigWithData } from './mutations/updateQaConfig.server'
import { getQaAreasByStatus } from './queries/getQaAreasByStatus.server'
import { getQaConfigsForRegion } from './queries/getQaConfigsForRegion.server'
import { getQaConfigStatsForAdmin } from './queries/getQaConfigStatsForAdmin.server'
import { getQaDataForMap } from './queries/getQaDataForMap.server'
import { getQaDecisionDataForArea } from './queries/getQaDecisionDataForArea.server'
import { getQaEvaluationsForArea } from './queries/getQaEvaluationsForArea.server'
import { getQaUsersForConfig } from './queries/getQaUsersForConfig.server'
import { CreateQaConfigFormSchema, DeleteQaConfigSchema, UpdateQaConfigFormSchema } from './schemas'

export type CreateQaEvaluationInput = z.infer<typeof CreateQaEvaluationSchema>

const QaConfigStatsForAdminInput = z.object({ configId: z.number() })
const QaAreasByStatusInput = z.object({
  configSlug: z.string(),
  regionSlug: z.string(),
  styleKey: z.string(),
})
const QaDataForMapInput = z.object({
  configId: z.number(),
  regionSlug: z.string(),
  userIds: z.array(z.string()).optional(),
})
const QaUsersForConfigInput = z.object({ configId: z.number(), regionSlug: z.string() })
const QaAreaInput = z.object({
  configSlug: z.string(),
  areaId: z.string(),
  regionSlug: z.string(),
})
const GetQaConfigsForRegionInput = z.object({ regionSlug: z.string() })

export const getQaConfigStatsForAdminFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof QaConfigStatsForAdminInput>) =>
    QaConfigStatsForAdminInput.parse(data),
  )
  .handler(async ({ data }) => getQaConfigStatsForAdmin(data, getRequestHeaders()))

export const getQaAreasByStatusFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof QaAreasByStatusInput>) => QaAreasByStatusInput.parse(data))
  .handler(async ({ data }) => getQaAreasByStatus(data, getRequestHeaders()))

export const getQaDataForMapFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof QaDataForMapInput>) => QaDataForMapInput.parse(data))
  .handler(async ({ data }) => getQaDataForMap(data, getRequestHeaders()))

export const getQaUsersForConfigFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof QaUsersForConfigInput>) =>
    QaUsersForConfigInput.parse(data),
  )
  .handler(async ({ data }) => getQaUsersForConfig(data, getRequestHeaders()))

export const getQaEvaluationsForAreaFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof QaAreaInput>) => QaAreaInput.parse(data))
  .handler(async ({ data }) => getQaEvaluationsForArea(data, getRequestHeaders()))

export const getQaDecisionDataForAreaFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof QaAreaInput>) => QaAreaInput.parse(data))
  .handler(async ({ data }) => getQaDecisionDataForArea(data, getRequestHeaders()))

export const getQaConfigsForRegionFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof GetQaConfigsForRegionInput>) =>
    GetQaConfigsForRegionInput.parse(data),
  )
  .handler(async ({ data }) => getQaConfigsForRegion(data, getRequestHeaders()))

export const createQaEvaluationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof CreateQaEvaluationSchema>) =>
    CreateQaEvaluationSchema.parse(data),
  )
  .handler(async ({ data }) => createQaEvaluation(data, getRequestHeaders()))

export const createQaConfigFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof CreateQaConfigFormSchema>) =>
    CreateQaConfigFormSchema.parse(data),
  )
  .handler(async ({ data }) => createQaConfigWithData(data, getRequestHeaders()))

export const updateQaConfigFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdateQaConfigFormSchema>) =>
    UpdateQaConfigFormSchema.parse(data),
  )
  .handler(async ({ data }) => updateQaConfigWithData(data, getRequestHeaders()))

export const deleteQaConfigFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof DeleteQaConfigSchema>) => DeleteQaConfigSchema.parse(data))
  .handler(async ({ data }) => deleteQaConfig(data, getRequestHeaders()))
