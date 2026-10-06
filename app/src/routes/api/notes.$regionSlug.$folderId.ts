import { createFileRoute } from '@tanstack/react-router'
import { createExternalNote, listExternalNotes } from '@/server/api/notes/externalNotes.server'
import { externalApiPreflightResponse } from '@/server/api/util/externalApiCors.server'
import { handleExternalApiRequest } from '@/server/api/util/externalApiResponses.server'

/** Internal notes of one folder for external clients (iD); see docs/External-Notes-API.md. */
export const Route = createFileRoute('/api/notes/$regionSlug/$folderId')({
  ssr: false,
  server: {
    handlers: {
      OPTIONS: ({ request }) => externalApiPreflightResponse(request),
      GET: ({ request, params }) =>
        handleExternalApiRequest(request, async () => ({
          status: 200,
          body: await listExternalNotes(request, params),
        })),
      POST: ({ request, params }) =>
        handleExternalApiRequest(request, async () => ({
          status: 201,
          body: await createExternalNote(request, params),
        })),
    },
  },
})
