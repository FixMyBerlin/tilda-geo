import { createFileRoute } from '@tanstack/react-router'
import { proxyPrivateBackgroundTile } from '@/server/private-backgrounds/proxyPrivateBackgroundTile.server'

export const Route = createFileRoute('/api/private-backgrounds/$slug/$z/$x/$y')({
  ssr: false,
  server: {
    handlers: {
      GET: async ({ request, params }) => proxyPrivateBackgroundTile(request, params),
    },
  },
})
