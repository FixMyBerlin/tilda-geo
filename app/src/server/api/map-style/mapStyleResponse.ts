import { createHash } from 'node:crypto'
import { SPRITE_VERSION } from './spriteVersion.const'
import data from './style.json'

// style.json is the downloaded base style — keep app-only
// MapLibre overrides here (sprite URL, sky), not in that file.
// Built once per process: the style, the sprite version and VITE_APP_ORIGIN are all fixed at startup.
const body = JSON.stringify({
  ...data,
  sprite: `${process.env.VITE_APP_ORIGIN}/map-style/sprite?v=${SPRITE_VERSION}`,
  // Empty object enables MapLibre sky with style-spec defaults (visible when pitched).
  sky: {},
})
const etag = `"${createHash('sha256').update(body).digest('hex').slice(0, 16)}"`

const matchesEtag = (ifNoneMatch: string | null) => {
  if (!ifNoneMatch) return false
  if (ifNoneMatch.trim() === '*') return true
  return ifNoneMatch.split(',').some((tag) => tag.trim().replace(/^W\//, '') === etag)
}

// The sprite URL changes with the sprite, so a new sprite never comes from the browser cache.
// `no-cache` makes the browser revalidate this style on every load; the ETag turns an unchanged style into a 304.
export const mapStyleResponse = (request: Request) => {
  const headers = { 'Cache-Control': 'no-cache', ETag: etag }
  if (matchesEtag(request.headers.get('if-none-match'))) {
    return new Response(null, { status: 304, headers })
  }
  return new Response(body, { headers: { ...headers, 'Content-Type': 'application/json' } })
}
