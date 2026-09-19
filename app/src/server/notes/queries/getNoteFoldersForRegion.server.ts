import { z } from 'zod'
import { getAppSession } from '@/server/auth/session.server'
import { canAccessMemberModeForRegion } from '@/server/authorization/canAccessMemberModeForRegion.server'
import db from '@/server/db.server'

const Schema = z.object({ regionSlug: z.string() })

type NoteFolderRegion = {
  slug: string
  name: string
}

export type NoteFolderForRegion = {
  id: number
  name: string
  noteCount: number
  /** Every region this folder is linked to. >1 means shared (UI hint). */
  regions: NoteFolderRegion[]
}

/** Note folders linked to a region, with note counts + shared-region info, oldest first ("Allgemein" first). */
export async function getNoteFoldersForRegion(input: z.infer<typeof Schema>, headers: Headers) {
  const { regionSlug } = Schema.parse(input)

  const session = await getAppSession(headers)
  const { isAuthorized } = await canAccessMemberModeForRegion(session, regionSlug)
  if (!isAuthorized) return { folders: [] as NoteFolderForRegion[] }

  const folders = await db.noteFolder.findMany({
    where: { regions: { some: { slug: regionSlug } } },
    select: {
      id: true,
      name: true,
      _count: { select: { notes: true } },
      regions: { select: { slug: true, name: true }, orderBy: { name: 'asc' } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return {
    folders: folders.map((folder): NoteFolderForRegion => {
      const regions = folder.regions.map((region) => ({
        slug: region.slug,
        name: region.name.trim() || region.slug,
      }))
      return {
        id: folder.id,
        name: folder.name,
        noteCount: folder._count.notes,
        regions,
      }
    }),
  }
}
