import { createFileRoute } from '@tanstack/react-router'
import { getExternalNote, updateExternalNote } from '@/server/api/notes/externalNotes.server'
import {
  externalApiPreflightResponse,
  handleExternalApiRequest,
} from '@/server/api/util/externalApiResponses.server'

export const Route = createFileRoute('/api/notes/$regionSlug/$folderId/$noteId')({
  ssr: false,
  server: {
    handlers: {
      OPTIONS: () => externalApiPreflightResponse(),
      GET: ({ request, params }) =>
        handleExternalApiRequest(async () => ({
          status: 200,
          body: await getExternalNote(request, params),
        })),
      PATCH: ({ request, params }) =>
        handleExternalApiRequest(async () => ({
          status: 200,
          body: await updateExternalNote(request, params),
        })),
    },
  },
})
