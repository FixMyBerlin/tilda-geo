import { z } from 'zod'
import { UserRoleEnum } from '@/prisma/generated/client'
import {
  badRequestJson,
  forbiddenJson,
  notFoundJson,
  unauthorizedJson,
} from '@/server/api/util/apiJsonResponses.server'
import { getAppSession } from '@/server/auth/session.server'
import db from '@/server/db.server'

const TileParamsSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  z: z.string().regex(/^\d{1,2}$/),
  x: z.string().regex(/^\d{1,8}$/),
  y: z.string().regex(/^\d{1,8}$/),
})

type TileParams = z.infer<typeof TileParamsSchema>

// Raster formats only. `image/svg+xml` could carry script that would run on our origin.
// `image/jpg` is not a registered type, but tile servers send it.
const tileContentTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

/**
 * Members and admins only, also on PUBLIC regions — the same rule as other member-only region data
 * (docs/Permissions.md). A membership of a DEACTIVATED region does not count, as that region does
 * not open for the member either.
 */
async function findSourceForSession(session: { userId: string; role: string }, slug: string) {
  if (session.role === UserRoleEnum.ADMIN) {
    return db.privateBackgroundSource.findUnique({ where: { slug }, select: { tilesUrl: true } })
  }
  return db.privateBackgroundSource.findFirst({
    where: {
      slug,
      regions: {
        some: {
          status: { not: 'DEACTIVATED' },
          memberships: { some: { userId: session.userId } },
        },
      },
    },
    select: { tilesUrl: true },
  })
}

function buildUpstreamTileUrl(tilesUrl: string, { z, x, y }: Omit<TileParams, 'slug'>) {
  return tilesUrl.replaceAll('{z}', z).replaceAll('{x}', x).replaceAll('{y}', y)
}

/**
 * Serves one tile of a private background source. The upstream URL holds a token that must not
 * reach any browser, so the app fetches the tile and passes on the image only: no redirect, no
 * upstream headers, and no upstream error text (which may echo the request URL).
 */
export async function proxyPrivateBackgroundTile(request: Request, params: unknown) {
  const session = await getAppSession(request.headers)
  if (!session?.userId) return unauthorizedJson()

  const parsed = TileParamsSchema.safeParse(params)
  if (!parsed.success) return badRequestJson()
  const { slug, ...tile } = parsed.data

  const source = await findSourceForSession(session, slug)
  if (!source) {
    // Non-members get the same answer for an unknown slug, so the slugs cannot be probed.
    return session.role === UserRoleEnum.ADMIN ? notFoundJson() : forbiddenJson()
  }

  let upstream: Response
  try {
    upstream = await fetch(buildUpstreamTileUrl(source.tilesUrl, tile), {
      signal: AbortSignal.timeout(20_000),
    })
  } catch (error) {
    // Only the error name: the message and cause of a failed fetch can contain the URL.
    console.error(`Private background "${slug}": upstream request failed`, (error as Error).name)
    return new Response(null, { status: 502 })
  }

  if (upstream.status === 204 || upstream.status === 404) {
    await upstream.body?.cancel()
    return new Response(null, { status: upstream.status })
  }

  const contentType = upstream.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
  if (!upstream.ok || !contentType || !tileContentTypes.includes(contentType)) {
    await upstream.body?.cancel()
    console.error(`Private background "${slug}": upstream answered ${upstream.status}`)
    return new Response(null, { status: 502 })
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      // `private`: tiles are per-user content, shared caches (CDN, proxies) must not store them.
      // The browser serves cached tiles without our membership check, so this is also how long
      // they stay readable after sign-out or after a membership ends. Accepted: the imagery of a
      // source does not change, and those tiles were already delivered to that browser.
      'Cache-Control': 'private, max-age=604800',
    },
  })
}
