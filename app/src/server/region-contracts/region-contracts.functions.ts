import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { createRegionContractWithData } from '@/server/region-contracts/mutations/createRegionContract.server'
import { deleteRegionContract } from '@/server/region-contracts/mutations/deleteRegionContract.server'
import { updateRegionContractWithData } from '@/server/region-contracts/mutations/updateRegionContract.server'
import {
  CreateRegionContractFormSchema,
  DeleteRegionContractSchema,
  RegionContractConfigSchema,
} from '@/server/region-contracts/regionContractSchema'

const UpdateRegionContractInput = z.object({ slug: z.string() }).and(RegionContractConfigSchema)

export const createRegionContractFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CreateRegionContractFormSchema>) =>
    CreateRegionContractFormSchema.parse(data),
  )
  .handler(async ({ data }) => createRegionContractWithData(data, getRequestHeaders()))

export const updateRegionContractFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdateRegionContractInput>) =>
    UpdateRegionContractInput.parse(data),
  )
  .handler(async ({ data }) => updateRegionContractWithData(data.slug, data, getRequestHeaders()))

export const deleteRegionContractFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof DeleteRegionContractSchema>) =>
    DeleteRegionContractSchema.parse(data),
  )
  .handler(async ({ data }) => deleteRegionContract(data, getRequestHeaders()))
