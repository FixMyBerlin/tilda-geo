import db from '@/server/db.server'

// Public read: the map needs the order for every visitor.
// Returns the global Atlas-Geo layer order, bottom-first.
export async function getMapLayerOrder() {
  return db.mapLayerOrder.findMany({
    orderBy: { position: 'asc' },
    select: { layerKey: true, beforeId: true },
  })
}

export type MapLayerOrderEntry = Awaited<ReturnType<typeof getMapLayerOrder>>[number]
