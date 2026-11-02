import { createFileRoute } from '@tanstack/react-router'
import { servePlanningTile } from '@/server/planning/servePlanningTile.server'

export const Route = createFileRoute('/api/regions/$regionSlug/planning-tiles/$layer/$z/$x/$y')({
  ssr: false,
  server: {
    handlers: {
      GET: async ({ request, params }) => servePlanningTile(request, params),
    },
  },
})
