import { z } from 'zod'
import { ATLAS_APP_ANCHOR_IDS } from '@/components/regionen/pageRegionSlug/mapData/types'

export const AtlasAppAnchorIdSchema = z.enum(ATLAS_APP_ANCHOR_IDS)

// The admin UI always saves the complete list, the bottom layer first; `position` is the index.
export const UpdateMapLayerOrderSchema = z.object({
  entries: z
    .array(
      z.object({
        layerKey: z.string().min(1),
        // Only anchors of the basemap style: maplibre does not add a layer whose `beforeId` does
        // not exist. `null` keeps the position from the config.
        beforeId: AtlasAppAnchorIdSchema.nullable(),
      }),
    )
    // An empty list would reset the order for all regions.
    .min(1)
    .refine(
      (entries) => new Set(entries.map((e) => e.layerKey)).size === entries.length,
      'layerKey entries must be unique',
    ),
})

export type UpdateMapLayerOrderInput = z.infer<typeof UpdateMapLayerOrderSchema>
