import db from '@/server/db.server'

export async function getRegionIdBySlug(slug: string) {
  const region = await db.region.findFirstOrThrow({
    where: { slug },
    select: { id: true },
  })
  return region.id
}
