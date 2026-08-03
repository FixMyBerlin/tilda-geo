import {
  deleteRegionMaskUpload,
  generateRegionMask,
} from '@/server/regions/masks/generateRegionMask.server'
import { updateRegionMaskConfig } from '@/server/regions/mutations/updateRegionMaskConfig.server'

export type RegionMaskWriteParams = {
  maskOsmRelationIds: number[]
  maskBufferKm: number
}

export function formatRegionMaskSyncError(cause: string) {
  return `Region gespeichert, aber Maske konnte nicht aktualisiert werden: ${cause}. Ändern Sie ein Masken-Attribut (z. B. den Buffer) und speichern Sie erneut.`
}

export class RegionMaskSyncError extends Error {
  constructor(cause: string) {
    super(formatRegionMaskSyncError(cause))
    this.name = 'RegionMaskSyncError'
  }
}

export function maskParamsEqual(a: RegionMaskWriteParams, b: RegionMaskWriteParams) {
  if (a.maskBufferKm !== b.maskBufferKm) return false
  if (a.maskOsmRelationIds.length !== b.maskOsmRelationIds.length) return false
  return a.maskOsmRelationIds.every((id, index) => id === b.maskOsmRelationIds[index])
}

/**
 * Sync mask upload + Region mask columns after the region row exists.
 * Non-empty IDs: upsert geometry (stable `region-{slug}`); empty IDs: delete upload so the map
 * stops showing the systemLayer.
 */
export async function syncRegionMaskAfterWrite(input: {
  slug: string
  maskOsmRelationIds: number[]
  maskBufferKm: number
}) {
  if (input.maskOsmRelationIds.length === 0) {
    await updateRegionMaskConfig({
      slug: input.slug,
      maskOsmRelationIds: [],
      maskBufferKm: input.maskBufferKm,
    })
    await deleteRegionMaskUpload(input.slug)
    return
  }

  await generateRegionMask({
    regionSlug: input.slug,
    maskOsmRelationIds: input.maskOsmRelationIds,
    maskBufferKm: input.maskBufferKm,
  })
  await updateRegionMaskConfig({
    slug: input.slug,
    maskOsmRelationIds: input.maskOsmRelationIds,
    maskBufferKm: input.maskBufferKm,
  })
}
