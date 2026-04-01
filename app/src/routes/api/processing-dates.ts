import { createFileRoute } from '@tanstack/react-router'
import { isProd } from '@/components/shared/utils/isEnv'
import { getProcessingMeta } from '@/server/api/util/getProcessingMeta.server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
}

export const Route = createFileRoute('/api/processing-dates')({
  ssr: true,
  server: {
    handlers: {
      GET: async () => {
        try {
          const parsed = await getProcessingMeta()

          return Response.json(parsed, { headers: corsHeaders })
        } catch (error) {
          console.error(error)
          return Response.json(
            {
              error: 'Internal Server Error',
              info: isProd ? undefined : error,
            },
            { status: 500, headers: corsHeaders },
          )
        }
      },
    },
  },
})
