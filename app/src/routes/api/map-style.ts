import { createFileRoute } from '@tanstack/react-router'
import data from '@/server/api/map-style/style.json'

export const Route = createFileRoute('/api/map-style')({
  ssr: true,
  server: {
    handlers: {
      GET: () => {
        data.sprite = `${process.env.VITE_APP_ORIGIN}/map-style/sprite`
        return Response.json(data)
      },
    },
  },
})
