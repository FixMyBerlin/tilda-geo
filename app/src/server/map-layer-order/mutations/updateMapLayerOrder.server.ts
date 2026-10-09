import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { UpdateMapLayerOrderSchema, type UpdateMapLayerOrderInput } from '../schemas'

export async function updateMapLayerOrder(input: UpdateMapLayerOrderInput, headers: Headers) {
  await requireAdmin(headers)
  const { entries } = UpdateMapLayerOrderSchema.parse(input)

  await db.$transaction([
    db.mapLayerOrder.deleteMany({}),
    db.mapLayerOrder.createMany({
      data: entries.map(({ layerKey, beforeId }, position) => ({ layerKey, beforeId, position })),
    }),
  ])
}
