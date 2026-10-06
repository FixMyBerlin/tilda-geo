import { createFileRoute } from '@tanstack/react-router'
import { getExternalNote, updateExternalNote } from '@/server/api/notes/externalNotes.server'
import { externalApiPreflightResponse } from '@/server/api/util/externalApiCors.server'
import { handleExternalApiRequest } from '@/server/api/util/externalApiResponses.server'

export const Route = createFileRoute('/api/notes/$regionSlug/$folderId/$noteId')({
  ssr: false,
  server: {
    handlers: {
      OPTIONS: ({ request }) => externalApiPreflightResponse(request),
      GET: ({ request, params }) =>
        handleExternalApiRequest(request, async () => ({
          status: 200,
          body: await getExternalNote(request, params),
        })),
      PATCH: ({ request, params }) =>
        handleExternalApiRequest(request, async () => ({
          status: 200,
          body: await updateExternalNote(request, params),
        })),
    },
  },
})
