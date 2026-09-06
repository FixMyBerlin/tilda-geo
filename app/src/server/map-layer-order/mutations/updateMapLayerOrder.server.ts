import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { UpdateMapLayerOrderSchema, type UpdateMapLayerOrderInput } from '../schemas'

export async function updateMapLayerOrder(input: UpdateMapLayerOrderInput, headers: Headers) {
  await requireAdmin(headers)
  const { entries, baselineCount } = UpdateMapLayerOrderSchema.parse(input)

  return db.$transaction(async (tx) => {
    const currentCount = await tx.mapLayerOrder.count()
    if (currentCount !== baselineCount) {
      throw new Error(
        `Die Layer-Reihenfolge wurde zwischenzeitlich geändert (${currentCount} statt ${baselineCount} Einträge). Bitte Seite neu laden und erneut sortieren.`,
      )
    }
    await tx.mapLayerOrder.deleteMany({})
    await tx.mapLayerOrder.createMany({
      data: entries.map(({ layerKey, beforeId }, position) => ({ layerKey, beforeId, position })),
    })
    return tx.mapLayerOrder.count()
  })
}
