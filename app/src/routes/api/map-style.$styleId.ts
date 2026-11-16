import { createFileRoute } from '@tanstack/react-router'
import { isBackgroundStyleId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/backgroundStyles.const'
import { mapStyleResponse } from '@/server/api/map-style/mapStyleResponse'

export const Route = createFileRoute('/api/map-style/$styleId')({
  ssr: false,
  server: {
    handlers: {
      GET: ({ request, params }) => {
        if (!isBackgroundStyleId(params.styleId)) {
          return new Response('Unknown map style', { status: 404 })
        }
        return mapStyleResponse(request, params.styleId)
      },
    },
  },
})
