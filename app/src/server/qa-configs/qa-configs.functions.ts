import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { createQaConfigWithData } from './mutations/createQaConfig.server'
import {
  CreateQaEvaluationsSchema,
  createQaEvaluations,
} from './mutations/createQaEvaluations.server'
import { deleteQaConfig } from './mutations/deleteQaConfig.server'
import { updateQaConfigWithData } from './mutations/updateQaConfig.server'
import {
  UpdateQaEvaluationBodySchema,
  updateQaEvaluationBody,
} from './mutations/updateQaEvaluationBody.server'
import { getQaAreaList, QaAreaListSchema } from './queries/getQaAreaList.server'
import { getQaConfigsForRegion } from './queries/getQaConfigsForRegion.server'
import { getQaDataForMap } from './queries/getQaDataForMap.server'
import { getQaDecisionDataForArea } from './queries/getQaDecisionDataForArea.server'
import { getQaUsersForConfig } from './queries/getQaUsersForConfig.server'
import {
  PreviewQaIndicatorThresholdsSchema,
  previewQaIndicatorThresholds,
} from './queries/previewQaIndicatorThresholds.server'
import { CreateQaConfigFormSchema, DeleteQaConfigSchema, UpdateQaConfigFormSchema } from './schemas'

const QaDataForMapInput = z.object({
  configSlug: z.string(),
  regionSlug: z.string(),
  userIds: z.array(z.string()).optional(),
  search: z.string().optional(),
})
const QaUsersForConfigInput = z.object({ configId: z.number(), regionSlug: z.string() })
const QaAreaInput = z.object({
  configSlug: z.string(),
  areaId: z.string(),
  regionSlug: z.string(),
})
const GetQaConfigsForRegionInput = z.object({ regionSlug: z.string() })

export const getQaAreaListFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof QaAreaListSchema>) => QaAreaListSchema.parse(data))
  .handler(async ({ data }) => getQaAreaList(data, getRequestHeaders()))

export const getQaDataForMapFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof QaDataForMapInput>) => QaDataForMapInput.parse(data))
  .handler(async ({ data }) => getQaDataForMap(data, getRequestHeaders()))

export const getQaUsersForConfigFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof QaUsersForConfigInput>) => QaUsersForConfigInput.parse(data))
  .handler(async ({ data }) => getQaUsersForConfig(data, getRequestHeaders()))

export const getQaDecisionDataForAreaFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof QaAreaInput>) => QaAreaInput.parse(data))
  .handler(async ({ data }) => getQaDecisionDataForArea(data, getRequestHeaders()))

export const getQaConfigsForRegionFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof GetQaConfigsForRegionInput>) =>
    GetQaConfigsForRegionInput.parse(data),
  )
  .handler(async ({ data }) => getQaConfigsForRegion(data, getRequestHeaders()))

export const createQaEvaluationsFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateQaEvaluationsSchema>) =>
    CreateQaEvaluationsSchema.parse(data),
  )
  .handler(async ({ data }) => createQaEvaluations(data, getRequestHeaders()))

export const createQaConfigFn = createServerFn({ method: 'POST' })
  .validator((data: z.input<typeof CreateQaConfigFormSchema>) =>
    CreateQaConfigFormSchema.parse(data),
  )
  .handler(async ({ data }) => createQaConfigWithData(data, getRequestHeaders()))

export const updateQaConfigFn = createServerFn({ method: 'POST' })
  .validator((data: z.input<typeof UpdateQaConfigFormSchema>) =>
    UpdateQaConfigFormSchema.parse(data),
  )
  .handler(async ({ data }) => updateQaConfigWithData(data, getRequestHeaders()))

export const deleteQaConfigFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof DeleteQaConfigSchema>) => DeleteQaConfigSchema.parse(data))
  .handler(async ({ data }) => deleteQaConfig(data, getRequestHeaders()))

export const updateQaEvaluationBodyFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdateQaEvaluationBodySchema>) =>
    UpdateQaEvaluationBodySchema.parse(data),
  )
  .handler(async ({ data }) => updateQaEvaluationBody(data, getRequestHeaders()))

// Admin-only threshold workbench preview — POST because it is an explicit action
// triggered by a button, not page data.
export const previewQaIndicatorThresholdsFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof PreviewQaIndicatorThresholdsSchema>) =>
    PreviewQaIndicatorThresholdsSchema.parse(data),
  )
  .handler(async ({ data }) => previewQaIndicatorThresholds(data, getRequestHeaders()))
