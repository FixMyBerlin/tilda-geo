import db from '@/server/db.server'
import {
  privateBackgroundParam,
  privateBackgroundTilesPath,
} from '@/server/private-backgrounds/privateBackgroundParam'

/**
 * What the region map needs to offer the private background sources of a region. Callers must have
 * checked member/admin access. `tilesUrl` (the token) is deliberately not selected: the map gets
 * the path of the proxy route instead.
 */
export async function getPrivateBackgroundsForRegion(regionSlug: string) {
  const sources = await db.privateBackgroundSource.findMany({
    where: { regions: { some: { slug: regionSlug } } },
    select: {
      slug: true,
      name: true,
      attributionHtml: true,
      minzoom: true,
      maxzoom: true,
      tileSize: true,
    },
    orderBy: { name: 'asc' },
  })

  return sources.map(({ slug, ...source }) => ({
    ...source,
    id: privateBackgroundParam(slug),
    tilesPath: privateBackgroundTilesPath(slug),
  }))
}

export type TPrivateBackground = Awaited<ReturnType<typeof getPrivateBackgroundsForRegion>>[number]
