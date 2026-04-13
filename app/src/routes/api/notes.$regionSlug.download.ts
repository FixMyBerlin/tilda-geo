import { Parser } from '@json2csv/plainjs'
import { createFileRoute } from '@tanstack/react-router'
import { featureCollection, point } from '@turf/turf'
import { z } from 'zod'
import type { Prisma } from '@/prisma/generated/client'
import { badRequestJson, notFoundJson } from '@/server/api/util/apiJsonResponses.server'
import { guardRegionMembership } from '@/server/api/util/authGuards.server'
import { compareApiKeyTimingSafe } from '@/server/api/util/checkApiKey.server'
import { corsHeaders } from '@/server/api/util/cors'
import db from '@/server/db.server'

const notesDownloadSearchSchema = z.object({
  format: z.enum(['raw', 'points', 'csv', 'geojson']).default('geojson'),
  apiKey: z.string().optional(),
})

type NoteWithComments = Prisma.NoteGetPayload<{ include: { noteComments: true } }>

type NoteOrCommentRow = {
  type: 'note' | 'comment'
  threadId: number
  id: number
  status: 'open' | 'closed' | null
  subject: string | null
  body: string | null
  author: string
  latitude: number
  longitude: number
  createdAt: Date
  lastUpdateAt: Date
}

function buildPoints(notes: NoteWithComments[], userNameById: Record<string, string>) {
  const points: NoteOrCommentRow[] = []
  for (const note of notes) {
    points.push({
      type: 'note',
      threadId: note.id,
      id: note.id,
      status: note.resolvedAt ? 'closed' : 'open',
      subject: note.subject,
      body: note.body,
      author: userNameById[note.userId] ?? 'n/a',
      latitude: note.latitude,
      longitude: note.longitude,
      createdAt: note.createdAt,
      lastUpdateAt: note.updatedAt,
    })
    for (const comment of note.noteComments) {
      points.push({
        type: 'comment',
        threadId: note.id,
        id: comment.id,
        status: null,
        subject: null,
        author: userNameById[comment.userId] ?? 'n/a',
        body: comment.body,
        createdAt: comment.createdAt,
        lastUpdateAt: comment.updatedAt,
        latitude: note.latitude,
        longitude: note.longitude,
      })
    }
  }
  return points
}

export const Route = createFileRoute('/api/notes/$regionSlug/download')({
  ssr: true,
  validateSearch: (search) => notesDownloadSearchSchema.parse(search),
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { regionSlug } = params
        // Server handler context has request/params/pathname only — no pre-validated search.
        // `notesDownloadSearchSchema` sets the default format 'geojson'
        const search = Object.fromEntries(new URL(request.url).searchParams)
        const searchResult = notesDownloadSearchSchema.safeParse(search)
        if (!searchResult.success) {
          return badRequestJson({
            headers: corsHeaders,
            info: z.flattenError(searchResult.error),
          })
        }
        const { format, apiKey } = searchResult.data

        const region = await db.region.findFirst({ where: { slug: regionSlug } })
        if (!region) {
          return notFoundJson({ headers: corsHeaders })
        }

        const notes = await db.note.findMany({
          where: { regionId: region.id },
          orderBy: { createdAt: 'asc' },
          include: { noteComments: true },
        })

        if (!compareApiKeyTimingSafe(apiKey)) {
          const authResponse = await guardRegionMembership({
            headers: request.headers,
            regionIds: [region.id],
            responseHeaders: corsHeaders,
          })
          if (authResponse) {
            return authResponse
          }
        }

        const users = await db.user.findMany()
        const userNameById = Object.fromEntries(users.map((u) => [u.id, u.osmName ?? 'n/a']))
        const points = buildPoints(notes, userNameById)

        switch (format) {
          case 'raw':
            return Response.json({ notes }, { headers: corsHeaders })
          case 'points':
            return Response.json({ points }, { headers: corsHeaders })
          case 'csv':
            return new Response(new Parser().parse(points), {
              headers: {
                ...corsHeaders,
                'Content-type': 'text/csv',
                'Content-Disposition': `attachment; filename=${regionSlug}-notes.csv`,
              },
            })
          case 'geojson': {
            const features = points.map((p) => {
              const { latitude, longitude, ...properties } = p
              return point([longitude, latitude], properties)
            })
            return Response.json(featureCollection(features), { headers: corsHeaders })
          }
        }
      },
    },
  },
})
