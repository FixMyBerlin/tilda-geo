import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/export-ogr/$regionSlug/$tableName')({
  ssr: true,
  server: {
    handlers: {
      GET: ({ request, params }) => {
        const targetUrl = new URL(
          `/api/export/${params.regionSlug}/${params.tableName}`,
          request.url,
        )
        targetUrl.search = new URL(request.url).searchParams.toString()
        return Response.redirect(targetUrl.toString(), 302)
      },
    },
  },
})
