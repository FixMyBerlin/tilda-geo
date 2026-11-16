import { createHash } from 'node:crypto'
import {
  BACKGROUND_STYLE_IDS,
  type BackgroundStyleId,
} from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/backgroundStyles.const'
import { SPRITE_VERSION } from './spriteVersion.const'
import atlas from './styles/atlas.json'
import dataviz from './styles/dataviz.json'

const styles = { atlas, dataviz } satisfies Record<BackgroundStyleId, object>

// styles/*.json are the downloaded base styles — keep app-only
// MapLibre overrides here (sprite URL, sky), not in those files.
// Built once per process: the styles, the sprite version and VITE_APP_ORIGIN are all fixed at startup.
const responses = Object.fromEntries(
  BACKGROUND_STYLE_IDS.map((id) => {
    const body = JSON.stringify({
      ...styles[id],
      sprite: `${process.env.VITE_APP_ORIGIN}/map-style/sprite?v=${SPRITE_VERSION}`,
      // Empty object enables MapLibre sky with style-spec defaults (visible when pitched).
      sky: {},
    })
    const etag = `"${createHash('sha256').update(body).digest('hex').slice(0, 16)}"`
    return [id, { body, etag }]
  }),
) as Record<BackgroundStyleId, { body: string; etag: string }>

const matchesEtag = (ifNoneMatch: string | null, etag: string) => {
  if (!ifNoneMatch) return false
  if (ifNoneMatch.trim() === '*') return true
  return ifNoneMatch.split(',').some((tag) => tag.trim().replace(/^W\//, '') === etag)
}

// The sprite URL changes with the sprite, so a new sprite never comes from the browser cache.
// `no-cache` makes the browser revalidate this style on every load; the ETag turns an unchanged style into a 304.
export const mapStyleResponse = (request: Request, styleId: BackgroundStyleId) => {
  const { body, etag } = responses[styleId]
  const headers = { 'Cache-Control': 'no-cache', ETag: etag }
  if (matchesEtag(request.headers.get('if-none-match'), etag)) {
    return new Response(null, { status: 304, headers })
  }
  return new Response(body, { headers: { ...headers, 'Content-Type': 'application/json' } })
}
