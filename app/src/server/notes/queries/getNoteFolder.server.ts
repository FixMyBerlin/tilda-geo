import { notFound } from '@tanstack/react-router'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'

export async function getNoteFolder(input: { id: number }, headers: Headers) {
  await requireAdmin(headers)

  const folder = await db.noteFolder.findUnique({
    where: { id: input.id },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      regions: { select: { slug: true, name: true }, orderBy: { slug: 'asc' } },
      _count: { select: { notes: true } },
    },
  })

  if (!folder) throw notFound()

  return {
    id: folder.id,
    name: folder.name,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
    regionSlugs: folder.regions.map((region) => region.slug),
    noteCount: folder._count.notes,
  }
}
