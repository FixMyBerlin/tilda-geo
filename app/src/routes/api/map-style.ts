import { createFileRoute } from '@tanstack/react-router'
import data from '@/server/api/map-style/style.json'

export const Route = createFileRoute('/api/map-style')({
  ssr: false,
  server: {
    handlers: {
      GET: () => {
        // style.json is overwritten by `bun run mapbox-styles-update` — keep app-only
        // MapLibre overrides here (sprite URL, sky), not in that downloaded file.
        return Response.json({
          ...data,
          sprite: `${process.env.VITE_APP_ORIGIN}/map-style/sprite`,
          // Empty object enables MapLibre sky with style-spec defaults (visible when pitched).
          sky: {},
        })
      },
    },
  },
})
