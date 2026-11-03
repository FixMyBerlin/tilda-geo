import { z } from 'zod'
import {
  type MergedFactorConfig,
  normalizeLegacyEigendaten,
  type VariantFactorConfig,
} from './mergeFactorConfig'

// ── factorConfig schemas ───────────────────────────────────────────────────────
// Variant config: weights and thresholds — no geometry, use-case, or size.
const variantFactorConfigShape = {
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
}

// Strict about values: validates what users send in. Unknown keys are dropped. The bounds live
// only here, so stored configs from before them still read (see the read schema below).
export const VariantFactorConfigSchema = z.object({
  ...variantFactorConfigShape,
  // Stored as 0–1 (see `weightScale.ts`).
  weights: z.record(z.string(), z.number().min(0).max(1)).optional(),
  max_cyclepath_dist_m: z.number().min(0).optional(),
  intersection_radius_m: z.number().min(0).optional(),
  parken_radius_m: z.number().min(0).optional(),
  fussgaengerzone_radius_m: z.number().min(0).optional(),
  bestand_default_diameter_m: z.number().min(0).optional(),
  bewohnerbedarf_radius_m: z.number().min(0).optional(),
  bewohnerbedarf_saettigung_ew: z.number().min(0).optional(),
  // Markers of the merged config the editor sends back. `stripAutoSaettigung` needs them to
  // decide whether `bewohnerbedarf_saettigung_ew` is the census suggestion, then drops them.
  bewohnerbedarf_saettigung_auto: z.boolean().optional(),
  bewohnerbedarf_saettigung_auto_ew: z.number().nullable().optional(),
  bewohnerbedarf_ew_pro_ha: z.number().nullable().optional(),
})

// Tolerant: reads what is stored. Stored configs (and frozen run snapshots) may be older than
// the current schema. A value that no longer fits is dropped and the default applies —
// instead of the whole variant page throwing.
const VariantFactorConfigReadSchema = z
  .object(
    Object.fromEntries(
      Object.entries(variantFactorConfigShape).map(([key, schema]) => [
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
