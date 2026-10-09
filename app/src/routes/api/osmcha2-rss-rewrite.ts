import { createFileRoute } from '@tanstack/react-router'
import { parseFeedUrl, transformChangesetFeed } from '@/server/api/osmcha2/changesetFeed'

// `?url=` is an OSMCha saved filter feed (https://osmcha.org/api/v1/aoi/<id>/changesets/feed/)
// or a WhoDidIt feed (https://simon04.dev.openstreetmap.org/whodidit/scripts/rss.php?bbox=<bbox>).
// Nothing is stored; the source feed is fetched and converted on every request.
export const Route = createFileRoute('/api/osmcha2-rss-rewrite')({
  ssr: false,
  server: {
    handlers: {
      GET: async ({ request }) => {
        const feedUrl = parseFeedUrl(new URL(request.url).searchParams.get('url'))
        if (!feedUrl) {
          return new Response('`url` has to be an https feed of osmcha.org or WhoDidIt.', {
            status: 400,
          })
        }

        try {
          const response = await fetch(feedUrl, { redirect: 'error' })
          if (!response.ok) throw new Error(`Status ${response.status}`)

          return new Response(transformChangesetFeed(await response.text(), feedUrl), {
            headers: {
              'Content-Type': 'application/rss+xml; charset=utf-8',
              'Cache-Control': 'public, max-age=300',
            },
          })
        } catch (error) {
          return new Response(`Could not convert ${feedUrl.href}: ${String(error)}`, {
            status: 502,
          })
        }
      },
    },
  },
})
