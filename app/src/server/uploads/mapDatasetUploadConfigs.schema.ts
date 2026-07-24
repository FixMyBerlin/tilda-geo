import { z } from 'zod'
import type { Prisma } from '@/prisma/generated/client'
import type { StaticDatasetLayer } from '@/scripts/StaticDatasets/types'

const osmIdConfigSchema = z.union([
  z.object({ osmType: z.string(), osmId: z.string() }),
  z.object({ osmTypeId: z.string() }),
])

const legendIconTypes = z.enum(['symbol', 'line', 'border', 'circle', 'fill', 'heatmap', 'text'])

const legendSchema = z.object({
  id: z.string(),
  name: z.string(),
  desc: z.array(z.string()).optional(),
  style: z.union([
    z.object({
      type: legendIconTypes.exclude(['line']),
      color: z.string(),
    }),
    z.object({
      type: z.literal('line'),
      color: z.string(),
      width: z.number().optional(),
      dasharray: z.array(z.number()).optional(),
    }),
  ]),
})

const inspectorEditorSchema = z.object({
  name: z.string(),
  idKey: z.string().optional(),
  urlTemplate: z.templateLiteral(['https://', z.string()]),
})

/** `enabled: true` may carry a large `translations` map — keep via looseObject. */
const inspectorEnabledSchema = z.looseObject({
  enabled: z.literal(true),
  documentedKeys: z.union([z.array(z.string()), z.literal(false)]),
  editors: z.array(inspectorEditorSchema).optional(),
  disableTranslations: z.boolean().optional(),
})

const inspectorSchema = z.union([inspectorEnabledSchema, z.object({ enabled: z.literal(false) })])

/**
 * MapLibre layer specs are `StaticDatasetLayer` in TS (full paint/layout unions). Zod cannot
 * express those MapLibre types — validate id + type only; remaining keys stay via looseObject.
 */
const staticDatasetLayerSchema = z.looseObject({
  id: z.string(),
  type: z.enum(['fill', 'line', 'circle', 'symbol', 'heatmap']),
})

/**
 * One layer-config entry in `MapDatasetUpload.configs` (static-dataset `meta.ts` shape).
 * Known fields mirror StaticDatasets / mapData types; `z.looseObject()` keeps extra keys on the
 * configs JSON column.
 *
 * Exported entry type is declared explicitly — Zod 4 `looseObject` index signatures poison
 * `z.infer` field types (`name` → unknown, etc.).
 */
const mapDatasetUploadConfigEntrySchema = z.looseObject({
  name: z.string(),
  /** MapDatasetCategory.key (`groupKey/categoryKey`), or null/omit when uncategorized. */
  categoryKey: z.string().nullish(),
  description: z.string().optional(),
  subId: z.string().optional(),
  layers: z.array(staticDatasetLayerSchema).optional(),
  inspector: inspectorSchema.optional(),
  legends: z.array(legendSchema).nullish(),
  osmIdConfig: osmIdConfigSchema.nullish(),
})

export const mapDatasetUploadConfigsSchema = z
  .array(mapDatasetUploadConfigEntrySchema)
  .transform((configs) => configs as MapDatasetUploadConfigs)

export type MapDatasetUploadConfigEntry = {
  name: string
  categoryKey?: string | null
  description?: string
  subId?: string
  layers?: StaticDatasetLayer[]
  inspector?:
    | { enabled: false }
    | {
        enabled: true
        documentedKeys: string[] | false
        editors?: z.infer<typeof inspectorEditorSchema>[]
        disableTranslations?: boolean
      }
  legends?: z.infer<typeof legendSchema>[] | null
  osmIdConfig?: z.infer<typeof osmIdConfigSchema> | null
}

export type MapDatasetUploadConfigs = MapDatasetUploadConfigEntry[]

/** Fail-loud parse for DB reads and map transforms after the configs array CHECK constraint. */
export function parseMapDatasetUploadConfigs(json: unknown) {
  return mapDatasetUploadConfigsSchema.parse(json) satisfies MapDatasetUploadConfigs
}

/** Prisma `configs` column write — validated array, cast for Json input typing. */
export function mapDatasetUploadConfigsToPrismaJson(configs: MapDatasetUploadConfigs) {
  return configs as Prisma.InputJsonValue
}
