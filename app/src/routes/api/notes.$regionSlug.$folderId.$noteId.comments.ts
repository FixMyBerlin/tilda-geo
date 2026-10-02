import { createFileRoute } from '@tanstack/react-router'
import { createExternalNoteComment } from '@/server/api/notes/externalNotes.server'
import { externalApiPreflightResponse } from '@/server/api/util/externalApiCors.server'
import { handleExternalApiRequest } from '@/server/api/util/externalApiResponses.server'

export const Route = createFileRoute('/api/notes/$regionSlug/$folderId/$noteId/comments')({
  ssr: false,
  server: {
    handlers: {
      OPTIONS: ({ request }) => externalApiPreflightResponse(request),
      POST: ({ request, params }) =>
        handleExternalApiRequest(request, async () => ({
          status: 201,
          body: await createExternalNoteComment(request, params),
        })),
    },
  },
})
