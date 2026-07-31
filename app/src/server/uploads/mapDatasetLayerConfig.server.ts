import type { Prisma } from '@/prisma/generated/client'
import { prismaJsonField } from '@/server/prismaJsonField.server'
import type { MapDatasetUploadConfigEntry } from '@/server/uploads/mapDatasetUploadConfigs.schema'

/**
 * Map a `MapDatasetUpload.configs[]` JSON array to nested-create `MapDatasetLayerConfig` rows.
 * Upload create stores the raw configs JSON and synced layerConfigs rows; admin UI reads
 * layerConfigs. `layers`/`inspector` default when omitted (NOT NULL columns).
 */
export function layerConfigsCreateFromConfigs(configs: MapDatasetUploadConfigEntry[]) {
  return configs.map((config) => ({
    subId: config.subId ?? null,
    name: config.name,
    categoryKey: config.categoryKey ?? null,
    layers: (config.layers ?? []) as Prisma.InputJsonValue,
    inspector: (config.inspector ?? {}) as Prisma.InputJsonValue,
    legends: prismaJsonField(config.legends),
    osmIdConfig: prismaJsonField(config.osmIdConfig),
    description: config.description ?? null,
  })) satisfies Prisma.MapDatasetLayerConfigCreateWithoutMapDatasetUploadInput[]
}
