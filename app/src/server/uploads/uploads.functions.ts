import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import type { TsrSerializable } from '@tanstack/router-core'
import { z } from 'zod'
import { deleteUpload } from './mutations/deleteUpload.server'
import { deleteUploadRegion } from './mutations/deleteUploadRegion.server'
import {
  getUploadsForRegionSystemLayer,
  getUploadsForRegionUser,
  type RegionDatasetSystemLayer,
  type RegionDatasetUser,
} from './queries/getUploadsForRegion.server'

const RegionSlugInput = z.object({ regionSlug: z.string() })
const DeleteUploadInput = z.object({ uploadSlug: z.string() })
const DeleteUploadRegionInput = z.object({
  uploadSlug: z.string(),
  regionSlug: z.string(),
})

export const getUploadsForRegionUserFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof RegionSlugInput>) => RegionSlugInput.parse(data))
  .handler(async ({ data }) => {
    const result = await getUploadsForRegionUser(data, getRequestHeaders())
    return result as (RegionDatasetUser & TsrSerializable)[]
  })

export const getUploadsForRegionSystemLayerFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof RegionSlugInput>) => RegionSlugInput.parse(data))
  .handler(async ({ data }) => {
    const result = await getUploadsForRegionSystemLayer(data, getRequestHeaders())
    return result as (RegionDatasetSystemLayer & TsrSerializable)[]
  })

export const deleteUploadFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof DeleteUploadInput>) => DeleteUploadInput.parse(data))
  .handler(async ({ data }) => deleteUpload(data, getRequestHeaders()))

export const deleteUploadRegionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof DeleteUploadRegionInput>) =>
    DeleteUploadRegionInput.parse(data),
  )
  .handler(async ({ data }) => deleteUploadRegion(data, getRequestHeaders()))
