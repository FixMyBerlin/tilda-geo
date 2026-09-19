import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { noteFoldersInRegionWhere } from '@/server/regions/regionScopedWhere'
import { optionalTrimmed } from '@/server/utils/searchString'

export async function getNoteFoldersForAdmin(input: { regionSlug?: string }, headers: Headers) {
  await requireAdmin(headers)

  const regionSlug = optionalTrimmed(input.regionSlug)
  const folders = await db.noteFolder.findMany({
    where: regionSlug ? noteFoldersInRegionWhere(regionSlug) : undefined,
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      regions: { select: { slug: true, name: true }, orderBy: { slug: 'asc' } },
      _count: { select: { notes: true } },
    },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  })

  return folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
    regionSlugs: folder.regions.map((region) => region.slug),
    regionNames: folder.regions.map((region) => region.name),
    noteCount: folder._count.notes,
  }))
}
