import { createFileRoute } from '@tanstack/react-router'

/** Layout route for /api/notes/$regionSlug; used by its children: /download and /$folderId (external notes API). */
export const Route = createFileRoute('/api/notes/$regionSlug')({
  ssr: false,
})
