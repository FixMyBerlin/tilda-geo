import { z } from 'zod'
import { ATLAS_APP_ANCHOR_IDS } from '@/components/regionen/pageRegionSlug/mapData/types'

export const AtlasAppAnchorIdSchema = z.enum(ATLAS_APP_ANCHOR_IDS)

// Full-list replace: the admin UI always saves the complete ordered list (bottom-first).
// `position` is derived from the array index on write.
export const UpdateMapLayerOrderSchema = z.object({
  entries: z
    .array(
      z.object({
        layerKey: z.string().min(1),
        // Constrained to the known basemap anchors so an invalid beforeId can never
        // reach the DB (maplibre silently drops layers with unknown beforeId targets).
        beforeId: AtlasAppAnchorIdSchema.nullable(),
      }),
    )
    // An empty list would wipe the global order for all regions — reject it. Clearing
    // must be a deliberate manual/DB operation, not a drifted admin save.
    .min(1)
    .refine(
      (entries) => new Set(entries.map((e) => e.layerKey)).size === entries.length,
      'layerKey entries must be unique',
    ),
  // Simple concurrency guard: the entry count the client loaded. A mismatch means
  // someone else saved in between — reject instead of silently clobbering.
  baselineCount: z.number().int().min(0),
})

export type UpdateMapLayerOrderInput = z.infer<typeof UpdateMapLayerOrderSchema>
