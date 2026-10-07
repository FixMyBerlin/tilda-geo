import { z } from 'zod'
import { slugSchema } from '@/lib/slugSchema'

const tilesUrlSchema = z
  .string()
  .trim()
  .regex(/^https:\/\/\S+$/, 'Muss mit https:// beginnen und darf keine Leerzeichen enthalten')
  .refine(
    (url) => ['{z}', '{x}', '{y}'].every((placeholder) => url.includes(placeholder)),
    'Muss die Platzhalter {z}, {x} und {y} enthalten',
  )

const zoomSchema = z.number().int().min(0).max(24).nullable()

/** Typed shape of one source, used by the write service and the admin MCP. */
export const PrivateBackgroundConfigSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1),
  tilesUrl: tilesUrlSchema,
  // Rendered as HTML by the map, like the attributions of the code catalog. Not sanitized: only
  // admins write it.
  attributionHtml: z.string().default(''),
  minzoom: zoomSchema.default(null),
  maxzoom: zoomSchema.default(null),
  tileSize: z.union([z.literal(256), z.literal(512)]).default(256),
  regionSlugs: z.array(z.string().min(1)).default([]),
})

export type PrivateBackgroundConfig = z.infer<typeof PrivateBackgroundConfigSchema>

/** Update leaves the stored URL (token) untouched when `tilesUrl` is omitted. */
export const PrivateBackgroundUpdateSchema = PrivateBackgroundConfigSchema.extend({
  tilesUrl: tilesUrlSchema.optional(),
})

export type PrivateBackgroundUpdate = z.infer<typeof PrivateBackgroundUpdateSchema>

export function assertZoomRange({
  minzoom,
  maxzoom,
}: Pick<PrivateBackgroundUpdate, 'minzoom' | 'maxzoom'>) {
  if (minzoom != null && maxzoom != null && minzoom > maxzoom) {
    throw new Error('minzoom darf nicht größer als maxzoom sein.')
  }
}
