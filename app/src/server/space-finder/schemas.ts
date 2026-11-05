import { check } from '@placemarkio/check-geojson'
import { z } from 'zod'
import { extractStudyAreaGeometry } from '@/components/regionen/pageRegionSlug/modes/spaceFinder/area/extractStudyAreaGeometry'
import { MAX_STUDY_AREA_KM2, studyAreaSizeKm2 } from '@/lib/spaceFinderStudyAreaLimit'
import { sanitizeUserDatasets } from '@/lib/spaceFinderUserGeojson'
import type { MergedFactorConfig } from './mergeFactorConfig'

// Merged config (variant + area) — used by UI for map layers and worker payload.
export type FactorConfig = MergedFactorConfig

export const StudyAreaSchema = z.unknown().transform((val, ctx) => {
  if (val == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Bitte genau ein Polygon oder MultiPolygon hochladen.',
    })
    return z.NEVER
  }
  let parsed: GeoJSON.GeoJSON
  try {
    parsed = check(JSON.stringify(val))
  } catch (error) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Ungültiges GeoJSON: ${(error as Error).message}`,
    })
    return z.NEVER
  }
  try {
    const geom = extractStudyAreaGeometry(parsed)
    if (studyAreaSizeKm2(geom) > MAX_STUDY_AREA_KM2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Das Berechnungsgebiet darf maximal ${MAX_STUDY_AREA_KM2} km² groß sein.`,
      })
      return z.NEVER
    }
    return geom
  } catch (e) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: (e as Error).message })
    return z.NEVER
  }
})

// The dataset list always replaces the full list (add, rename, remove, change mode).
// `undefined` = leave unchanged.
export const UserDatasetsSchema = z
  .any()
  .optional()
  .transform((val, ctx) => {
    if (val === undefined) return undefined
    try {
      return sanitizeUserDatasets(val ?? [])
    } catch (e) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: (e as Error).message })
      return z.NEVER
    }
  })

export const AreaGeometryInputSchema = z.object({
  studyArea: StudyAreaSchema,
  userDatasets: UserDatasetsSchema,
})

export const RegionSlugInput = z.object({ regionSlug: z.string() })
export const AreaIdInput = z.object({ areaId: z.number().int() })
export const VariantIdInput = z.object({ variantId: z.number().int() })
export const JobIdInput = z.object({ jobId: z.number().int() })
