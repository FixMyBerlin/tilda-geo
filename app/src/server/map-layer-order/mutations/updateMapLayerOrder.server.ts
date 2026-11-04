import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { UpdateMapLayerOrderSchema, type UpdateMapLayerOrderInput } from '../schemas'
import { hasEveryTildaLayer } from '../tildaLayerKeys'

export async function updateMapLayerOrder(input: UpdateMapLayerOrderInput, headers: Headers) {
  await requireAdmin(headers)
  const { entries } = UpdateMapLayerOrderSchema.parse(input)

  // The table has exactly one row per layer of the code, see `getMapLayerOrder`.
  if (!hasEveryTildaLayer(entries.map((entry) => entry.layerKey))) {
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
