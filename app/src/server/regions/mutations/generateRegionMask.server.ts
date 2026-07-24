import { z } from 'zod'
import { adminFormAuditContext, runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import {
  deleteRegionMaskUpload,
  generateRegionMask,
} from '@/server/regions/masks/generateRegionMask.server'
import { parseOsmRelationIds } from '@/server/regions/masks/parseOsmRelationIds.server'
import { updateRegionMaskConfig } from '@/server/regions/mutations/updateRegionMaskConfig.server'

const trueOrFalse = z.enum(['true', 'false']).transform((v) => v === 'true')

export const RegionMaskFormRawSchema = z
  .object({
    maskEnabled: z.enum(['true', 'false']),
    maskOsmRelationIds: z.string(),
    maskBufferKm: z.string(),
  })
  .refine((form) => form.maskEnabled === 'false' || form.maskOsmRelationIds.trim().length > 0, {
    message: 'Mindestens eine OSM Relation ID ist erforderlich.',
    path: ['maskOsmRelationIds'],
  })

export type RegionMaskFormInput = z.input<typeof RegionMaskFormRawSchema>

export const RegionMaskActionSchema = z
  .object({
    slug: z.string(),
    maskEnabled: trueOrFalse,
    maskOsmRelationIds: z.string(),
    maskBufferKm: z.coerce.number(),
  })
  // Report invalid input via ctx.addIssue (NOT throw): a throw inside a zod transform escapes
  // safeParse and 500s the server fn instead of returning the friendly { success: false } result.
  .transform((form, ctx) => {
    const maskEnabled = form.maskEnabled
    let maskOsmRelationIds: number[] = []
    if (maskEnabled) {
      try {
        maskOsmRelationIds = parseOsmRelationIds(form.maskOsmRelationIds)
      } catch (error) {
        ctx.addIssue({
          code: 'custom',
          message: error instanceof Error ? error.message : 'Ungültige OSM-Relation-IDs',
          path: ['maskOsmRelationIds'],
        })
      }
    }

    return {
      slug: form.slug,
      maskOsmRelationIds,
      // When mask is off, relation IDs are cleared; buffer stays at default 10 km (inert).
      maskBufferKm: maskEnabled ? form.maskBufferKm : 10,
    }
  })

export async function generateRegionMaskWithData(
  input: z.infer<typeof RegionMaskActionSchema>,
  headers: Headers,
) {
  const admin = await requireAdmin(headers)

  return runWithAuditContextAsync(adminFormAuditContext(headers, admin.userId), async () => {
    if (input.maskOsmRelationIds.length === 0) {
      await updateRegionMaskConfig({
        slug: input.slug,
        maskOsmRelationIds: input.maskOsmRelationIds,
        maskBufferKm: input.maskBufferKm,
      })
      await deleteRegionMaskUpload(input.slug)
      return { success: true as const, message: 'Maske deaktiviert und Upload entfernt.' }
    }

    const result = await generateRegionMask({
      regionSlug: input.slug,
      maskOsmRelationIds: input.maskOsmRelationIds,
      maskBufferKm: input.maskBufferKm,
    })

    await updateRegionMaskConfig({
      slug: input.slug,
      maskOsmRelationIds: input.maskOsmRelationIds,
      maskBufferKm: input.maskBufferKm,
    })

    return {
      success: true as const,
      message: 'Maske aktualisiert.',
      mapRenderUrl: result.mapRenderUrl,
    }
  })
}
