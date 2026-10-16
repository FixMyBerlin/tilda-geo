import { tz } from '@date-fns/tz'
import { parse } from 'date-fns'
import { z } from 'zod'

const OSM_API_DATE_FORMAT = "yyyy-MM-dd HH:mm:ss 'UTC'"

export const parseOsmApiDate = (value: string) =>
  new Date(parse(value, OSM_API_DATE_FORMAT, new Date(), { in: tz('UTC') }))

const osmApiDateSchema = z.string().transform(parseOsmApiDate)

const osmApiDateSchemaNullish = z
  .string()
  .nullish()
  .transform((value) => (value ? parseOsmApiDate(value) : null))

const osmNotesCommentSchema = z.object({
  date: osmApiDateSchema,
  action: z.enum(['opened', 'commented', 'closed', 'reopened']),
  // Apparently can be blank, see https://github.com/openstreetmap/openstreetmap-website/blob/master/app/views/api/notes/_note.xml.builder#L30-L33
  text: z.string().optional(),
  html: z.string(),
  // Optional author fields, see https://github.com/openstreetmap/openstreetmap-website/blob/master/app/views/api/notes/_note.xml.builder#L22-L26
  uid: z.number().optional(),
  user: z.string().optional(),
  user_url: z.url().optional(), // `https://api.openstreetmap.org/user/${string}.json`
})

const osmApiNoteSchema = z.object({
  id: z.number(),
  url: z.url(), // `https://api.openstreetmap.org/api/0.6/notes/${number}.json`
  status: z.enum(['open', 'closed']),
  date_created: osmApiDateSchema,
  closed_at: osmApiDateSchemaNullish, // ONLY when `status=closed`
  comment_url: z.url().nullish(), // ONLY when `status=open` `https://api.openstreetmap.org/api/0.6/notes/${number}/comment.json`
  reopen_url: z.url().nullish(), // ONLY when `status=closed` `https://api.openstreetmap.org/api/0.6/notes/${number}/reopen.json`
  close_url: z.url().nullish(), // ONLY when `status=open` `https://api.openstreetmap.org/api/0.6/notes/${number}/close.json`
  comments: z.array(osmNotesCommentSchema),
})

export type OsmApiNotesThreadType = z.infer<typeof osmApiNoteSchema>

/** OSM stores the original note as `comments[0]`. TILDA counts only later replies. */
export const osmNoteReplyCount = (comments: { length: number } | undefined) =>
  Math.max(0, (comments?.length ?? 0) - 1)

const osmNoteSchema = osmApiNoteSchema.extend({ tilda: z.boolean() })

const sharedFeaturePointSchema = z.object({
  type: z.literal('Feature'),
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]), // [longitude, latitude]
  }),
})
const osmApiFeaturePointSchema = sharedFeaturePointSchema.extend({
  properties: osmApiNoteSchema,
})
const osmFeaturePointSchema = sharedFeaturePointSchema.extend({
  id: z.number(),
  properties: osmNoteSchema,
})
export type OsmFeaturePointType = z.infer<typeof osmFeaturePointSchema>

export const osmApiFeatureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(osmApiFeaturePointSchema),
})

const osmFeatureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(osmFeaturePointSchema),
})
export type OsmFeatureCollectionType = z.infer<typeof osmFeatureCollectionSchema>
