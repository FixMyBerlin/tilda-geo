import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { hasEveryAtlasLayer } from '../atlasLayerKeys'
import { UpdateMapLayerOrderSchema, type UpdateMapLayerOrderInput } from '../schemas'

export async function updateMapLayerOrder(input: UpdateMapLayerOrderInput, headers: Headers) {
  await requireAdmin(headers)
  const { entries } = UpdateMapLayerOrderSchema.parse(input)

  // The table has exactly one row per layer of the code, see `getMapLayerOrder`.
  if (!hasEveryAtlasLayer(entries.map((entry) => entry.layerKey))) {
    throw new Error(
      'Die Liste passt nicht zu den Layern im Code. Bitte die Seite neu laden und erneut sortieren.',
    )
  }

  await db.$transaction([
    db.mapLayerOrder.deleteMany({}),
    db.mapLayerOrder.createMany({
      data: entries.map(({ layerKey, beforeId }, position) => ({ layerKey, beforeId, position })),
    }),
  ])
}
