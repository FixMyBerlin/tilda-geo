import { createFileRoute } from '@tanstack/react-router'
import { getMapillaryCoverageMetadataLoaderFn } from '@/server/api/docs.functions'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
}

export const Route = createFileRoute('/api/processing-dates-mapillary')({
  ssr: false,
  server: {
    handlers: {
      GET: async () => {
        const metadata = await getMapillaryCoverageMetadataLoaderFn()

        if (!metadata) {
          return Response.json(
            { error: 'No metadata available' },
            { status: 404, headers: corsHeaders },
          )
        }

        return Response.json(metadata, { headers: corsHeaders })
      },
    },
  },
})
