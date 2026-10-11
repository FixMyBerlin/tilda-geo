import { z } from 'zod'
import { LAYER_POSITIONS } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/beforeId'

export const LayerPositionSchema = z.enum(LAYER_POSITIONS)

// The admin UI always saves the complete list, the bottom layer first; `position` is the index.
export const UpdateMapLayerOrderSchema = z.object({
  entries: z
    .array(
      z.object({
        layerKey: z.string().min(1),
        // Only layers of the basemap style: maplibre does not add a layer whose `beforeId` does
        // not exist. `null` keeps the position from the config.
        beforeId: LayerPositionSchema.nullable(),
      }),
    )
    .min(1)
    .refine(
      (entries) => new Set(entries.map((e) => e.layerKey)).size === entries.length,
      'layerKey entries must be unique',
    ),
})

export type UpdateMapLayerOrderInput = z.infer<typeof UpdateMapLayerOrderSchema>
