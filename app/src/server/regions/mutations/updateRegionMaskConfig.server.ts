import db from '@/server/db.server'

export async function updateRegionMaskConfig(input: {
  slug: string
  maskOsmRelationIds: number[]
  maskBufferKm: number
}) {
  return db.region.update({
    where: { slug: input.slug },
    data: {
      maskOsmRelationIds: input.maskOsmRelationIds,
      maskBufferKm: input.maskBufferKm,
    },
  })
}
