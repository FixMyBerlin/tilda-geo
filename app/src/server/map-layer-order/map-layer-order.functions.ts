import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import type { z } from 'zod'
import { updateMapLayerOrder } from './mutations/updateMapLayerOrder.server'
import { getMapLayerOrder } from './queries/getMapLayerOrder.server'
import { UpdateMapLayerOrderSchema } from './schemas'

export const getMapLayerOrderFn = createServerFn({ method: 'GET' }).handler(async () =>
  getMapLayerOrder(),
)

export const updateMapLayerOrderFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdateMapLayerOrderSchema>) =>
    UpdateMapLayerOrderSchema.parse(data),
  )
  .handler(async ({ data }) => updateMapLayerOrder(data, getRequestHeaders()))
