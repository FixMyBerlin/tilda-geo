import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { isProd } from '@/components/shared/utils/isEnv'
import { maprouletteRebuildTasks } from '@/scripts/MaprouletteRebuild/utils/maprouletteRebuildTasks'
import { guardEndpoint } from '@/server/api/private/guardEndpoint'

const Schema = z.object({
  apiKey: z.string(),
})

export const Route = createFileRoute('/api/private/generate-maproulette-tasks')({
  ssr: true,
  server: {
    handlers: {
      GET: ({ request }) => {
        const { access, response } = guardEndpoint(request, Schema)
        if (access === false) return response
        try {
          const filter = undefined
          maprouletteRebuildTasks(filter)
          return Response.json({ message: 'TRIGGERED' }, { status: 200 })
        } catch (e) {
          console.error(e)
          if (!isProd) throw e
          return Response.json({ message: 'Internal Server Error' }, { status: 500 })
        }
      },
    },
  },
})
