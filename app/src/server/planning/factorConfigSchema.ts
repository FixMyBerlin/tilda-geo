import { z } from 'zod'
import {
  type MergedFactorConfig,
  normalizeLegacyEigendaten,
  type VariantFactorConfig,
} from './mergeFactorConfig'

// ── factorConfig schemas ───────────────────────────────────────────────────────
// Variant config: weights and thresholds — no geometry, use-case, or size.
// Strict: validates what users send in.
export const VariantFactorConfigSchema = z
  .object({
    name: z.string().optional(),
    h3_resolution: z.number().int().min(6).max(15).optional(),
    dem_source: z.enum(['srtm', 'dgm1', 'mapterhorn']).optional(),
    weights: z.record(z.string(), z.number()).optional(),
    eigendaten_weights: z.record(z.string(), z.number().min(0).max(1)).optional(),
    vegetation_direction: z.enum(['positive', 'negative']).optional(),
    platz_direction: z.enum(['positive', 'negative']).optional(),
    cir_source: z.enum(['auto', 'bayern', 'bb', 'hessen']).optional(),
    max_cyclepath_dist_m: z.number().optional(),
    exclude_carriageways: z.boolean().optional(),
    intersection_radius_m: z.number().optional(),
    parken_radius_m: z.number().optional(),
    fussgaengerzone_radius_m: z.number().optional(),
    bestand_default_diameter_m: z.number().optional(),
    bewohnerbedarf_radius_m: z.number().optional(),
    bewohnerbedarf_saettigung_ew: z.number().optional(),
    zielort_category_shares: z.record(z.string(), z.number().min(0).max(100)).optional(),
    oepnv_category_shares: z.record(z.string(), z.number().min(0).max(100)).optional(),
    min_score_threshold: z.number().min(0).max(100).optional(),
    min_area_m2: z.number().min(0).nullable().optional(),
  })
  .passthrough()

// Tolerant: reads what is stored. Gespeicherte Configs (und eingefrorene Run-Snapshots) können
// älter sein als das aktuelle Schema. Ein Wert, der nicht mehr passt, fällt weg und der Default
// greift — statt dass die ganze Variantenseite wirft.
const VariantFactorConfigReadSchema = z
  .object(
    Object.fromEntries(
      Object.entries(VariantFactorConfigSchema.shape).map(([key, schema]) => [
        key,
        (schema as z.ZodType).catch(({ input }: { input: unknown }) => {
          console.warn(`factorConfig: ignoring stored value for "${key}"`, input)
          return undefined
        }),
      ]),
    ),
  )
  .passthrough()
  .catch(({ input }) => {
    console.warn('factorConfig: ignoring stored value that is not an object', input)
    return {}
  })

export const parseVariantFactorConfig = (value: unknown) =>
  VariantFactorConfigReadSchema.parse(value) as VariantFactorConfig

/** Run snapshot as stored; snapshots from the single-upload time are lifted to `user_datasets`. */
export const parseFactorConfigSnapshot = (value: unknown) =>
  normalizeLegacyEigendaten(VariantFactorConfigReadSchema.parse(value) as MergedFactorConfig)
