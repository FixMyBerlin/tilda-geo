import db from '@/server/db.server'

export async function deleteVariantPostgisResults(variantId: number) {
  const runs = await db.spaceFinderRun.findMany({
    where: { variantId },
    select: { id: true },
  })
  if (runs.length === 0) return
  const runIds = runs.map((r) => r.id)
  // Fine + aggregate grids share space_finder.scenario_hexagons (resolution column).
  await db.$executeRaw`DELETE FROM space_finder.scenario_hexagons WHERE run_id = ANY(${runIds})`
  await db.$executeRaw`DELETE FROM space_finder.scenario_vegetation WHERE run_id = ANY(${runIds})`
  await db.$executeRaw`DELETE FROM space_finder.scenario_carriageways WHERE run_id = ANY(${runIds})`
}
