import { createFileRoute } from '@tanstack/react-router'
import { checkApiKey } from '@/server/api/util/checkApiKey.server'
import db from '@/server/db.server'

export const Route = createFileRoute('/api/uploads')({
  ssr: true,
  server: {
    handlers: {
      GET: async ({ request }) => {
        const check = checkApiKey(request)
        if (!check.ok) return check.errorResponse

        return Response.json(await db.upload.findMany())
      },
    },
  },
})
