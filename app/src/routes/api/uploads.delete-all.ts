import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { checkApiKey, parseData } from '@/server/api/util/checkApiKey.server'
import db from '@/server/db.server'

const Schema = z.object({
  apiKey: z.string().nullish(),
})

export const Route = createFileRoute('/api/uploads/delete-all')({
  ssr: true,
  server: {
    handlers: {
      DELETE: async ({ request }) => {
        const parsed = parseData(await request.json(), Schema)
        if (!parsed.ok) return parsed.errorResponse
        const { data } = parsed

        const check = checkApiKey(data)
        if (!check.ok) return check.errorResponse

        try {
          await db.upload.deleteMany({ where: { createdBy: 'SCRIPT' } })
        } catch (e) {
          return Response.json(
            { statusText: 'Internal Server Error', message: e.message },
            { status: 500 },
          )
        }

        return Response.json({ statusText: 'Deleted' }, { status: 200 })
      },
    },
  },
})
