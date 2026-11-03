import db from '@/server/db.server'

export async function markRunsStaleForArea(areaId: number) {
  await db.spaceFinderRun.updateMany({
    where: {
      variant: { areaId },
      status: { in: ['COMPLETE', 'EMPTY'] },
      stale: false,
    },
    data: { stale: true },
  })
}

export async function markRunsStaleForVariant(variantId: number) {
  await db.spaceFinderRun.updateMany({
    where: {
      variantId,
      status: { in: ['COMPLETE', 'EMPTY'] },
      stale: false,
    },
    data: { stale: true },
  })
}

export async function markRunsFreshForVariant(variantId: number) {
  await db.spaceFinderRun.updateMany({
    where: {
      variantId,
      status: { in: ['COMPLETE', 'EMPTY'] },
      stale: true,
    },
    data: { stale: false },
  })
}
