import { createFileRoute } from '@tanstack/react-router'
import { bboxPolygon, booleanPointInPolygon } from '@turf/turf'
import { z } from 'zod'
import { formatDateTimeBerlin } from '@/components/shared/date/formatDateBerlin'

const OSMCommentSchema = z.object({
  date: z.string(),
  uid: z.number().optional(),
  user: z.string().optional(),
  user_url: z.string().optional(),
  action: z.string().optional(),
  text: z.string().optional(),
  html: z.string().optional(),
})

const OSMNotePropertiesSchema = z.object({
  id: z.number(),
  url: z.string(),
  reopen_url: z.string().optional(),
  comment_url: z.string().optional(),
  close_url: z.string().optional(),
  date_created: z.string(),
  status: z.string(),
  closed_at: z.string().optional(),
  comments: z.array(OSMCommentSchema),
})

const OSMFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: z.object({
    type: z.string(),
    coordinates: z.array(z.number()),
  }),
  properties: OSMNotePropertiesSchema,
})

const OSMFeatureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(OSMFeatureSchema),
})

type OSMFeature = z.infer<typeof OSMFeatureSchema>
type OSMComment = z.infer<typeof OSMCommentSchema>

export const Route = createFileRoute('/api/osm-notes/rss')({
  ssr: true,
  server: {
    handlers: {
      GET: async ({ request }) => {
        const searchParams = new URL(request.url).searchParams
        const q = z.string().trim().min(3).catch('TILDA').parse(searchParams.get('q'))

        const baseUrl = 'https://api.openstreetmap.org/api/0.6/notes/search.json'
        const params = {
          q,
          from: '2025-03-01',
          closed: '-1',
          sort: 'updated_at',
          order: 'newest',
          limit: '100',
        }
        const apiUrl = new URL(baseUrl)
        apiUrl.search = new URLSearchParams(params).toString()

        const response = await fetch(apiUrl.toString(), { cache: 'force-cache' })
        let rssItems = ''

        const germanyBbox: [number, number, number, number] = [5.866, 47.27, 15.042, 55.058]
        const germanyPolygon = bboxPolygon(germanyBbox)

        if (!response.ok) {
          rssItems = `
            <item>
              <title>Fetch Error</title>
              <description><![CDATA[Fetch failed: ${response.status} ${response.statusText}\n${apiUrl.toString()}]]></description>
              <pubDate>${new Date().toUTCString()}</pubDate>
              <guid isPermaLink="false">fetch-error</guid>
            </item>
          `
        } else {
          const data = await response.json()
          const parsed = OSMFeatureCollectionSchema.safeParse(data)

          if (!parsed.success) {
            console.error('app/src/routes/api/osm-notes/rss.ts Zod validation ERROR', parsed)
            rssItems = `
              <item>
                <title>Invalid OSM Notes Data</title>
                <description><![CDATA[Failed to validate OSM Notes data.]]></description>
                <pubDate>${new Date().toUTCString()}</pubDate>
                <guid isPermaLink="false">invalid-data</guid>
              </item>
            `
          } else {
            rssItems = parsed.data.features

              .filter((feature: OSMFeature) => {
                const coords = feature.geometry.coordinates
                return booleanPointInPolygon(coords, germanyPolygon)
              })

              .map((feature: OSMFeature) => {
                const props = feature.properties
                const id = props.id
                const status = props.status
                const comments = props.comments || []
                const lastComment = comments[comments.length - 1]
                const updatedAt = lastComment !== undefined ? lastComment.date : props.date_created

                let lastStatus: string | null = null
                const description = comments

                  .map((comment: OSMComment, idx: number) => {
                    const user = comment.user || 'Anonymous'
                    const date = comment.date
                    const text = comment.text
                    let statusChange = ''
                    if (comment.action === 'closed' && lastStatus !== 'closed') {
                      statusChange = '<em>Status: open ⇒ closed</em><br>'
                      lastStatus = 'closed'
                    } else if (
                      (comment.action === 'opened' || comment.action === 'reopened') &&
                      lastStatus === 'closed'
                    ) {
                      statusChange = '<em>Status: closed ⇒ open</em><br>'
                      lastStatus = 'open'
                    } else if (
                      idx === 0 &&
                      (comment.action === 'opened' || comment.action === 'reopened')
                    ) {
                      lastStatus = 'open'
                    }
                    return `<p><strong>${user} – ${formatDateTimeBerlin(date)}:</strong></p>${statusChange}<blockquote>${text}</blockquote>`
                  })
                  .join('<hr>')

                return `
                  <item>
                    <title>Note #${id} (${status})</title>
                    <link>https://www.openstreetmap.org/note/${id}</link>
                    <guid isPermaLink="false">${id}</guid>
                    <pubDate>${new Date(updatedAt).toUTCString()}</pubDate>
                    <description><![CDATA[${description}]]></description>
                  </item>
                `
              })
              .join('')
          }
        }

        const rssFeed = `
          <rss version="2.0">
            <channel>
              <title>OSM Notes »${q}« in Deutschland</title>
              <link>https://tilda-geo.de/regionen/radinfra?map=6.1/51.312/10.529&config=1ops5da.7h39.3cw&v=2&osmNotes=true</link>
              <description>OSM Notes für das Suchwort »${q}« in Deutschland ab dem ${params.from}</description>
              <language>de</language>
              ${rssItems}
            </channel>
          </rss>
        `.trim()

        return new Response(rssFeed, {
          headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
          },
        })
      },
    },
  },
})
