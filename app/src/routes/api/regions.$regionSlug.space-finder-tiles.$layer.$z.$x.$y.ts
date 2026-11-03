import { createFileRoute } from '@tanstack/react-router'
import { serveSpaceFinderTile } from '@/server/spaceFinder/serveSpaceFinderTile.server'

export const Route = createFileRoute('/api/regions/$regionSlug/space-finder-tiles/$layer/$z/$x/$y')(
  {
    ssr: false,
    server: {
      handlers: {
        GET: async ({ request, params }) => serveSpaceFinderTile(request, params),
      },
    },
  },
)
