import { createFileRoute } from '@tanstack/react-router'
import { getProcessingMeta } from '@/server/api/util/getProcessingMeta.server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
}

export const Route = createFileRoute('/api/processing-dates')({
  ssr: false,
  server: {
    handlers: {
      GET: async () => {
        const parsed = await getProcessingMeta()
        if (!parsed) {
          return Response.json(
            { error: 'No processing metadata' },
            { status: 404, headers: corsHeaders },
          )
        }

        return Response.json(parsed, { headers: corsHeaders })
      },
    },
  },
})
