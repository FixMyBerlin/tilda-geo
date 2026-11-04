import db from '@/server/db.server'
import { planMapLayerOrderSync } from '../syncMapLayerOrder'
import { TILDA_LAYER_KEYS } from '../tildaLayerKeys'

/**
 * Gives every TILDA layer of the code exactly one row, see `planMapLayerOrderSync`. The
 * layers only change with the code, so this runs once per server start.
 */
async function syncMapLayerOrder() {
  const rows = await db.mapLayerOrder.findMany({ select: { layerKey: true, position: true } })
  const { add, remove } = planMapLayerOrderSync(rows, TILDA_LAYER_KEYS)
  if (remove.length > 0) {
    await db.mapLayerOrder.deleteMany({ where: { layerKey: { in: remove } } })
  }
  if (add.length > 0) {
    await db.mapLayerOrder.createMany({ data: add })
  }
}

let synced: Promise<void> | undefined

/** The order of all TILDA layers, the bottom layer first. Public: every map needs it. */
export async function getMapLayerOrder() {
  synced ??= syncMapLayerOrder().catch((error: unknown) => {
    synced = undefined
    throw error
  })
  await synced

  return db.mapLayerOrder.findMany({
    orderBy: { position: 'asc' },
    select: { layerKey: true, beforeId: true },
  })
}

export type MapLayerOrderEntry = Awaited<ReturnType<typeof getMapLayerOrder>>[number]
