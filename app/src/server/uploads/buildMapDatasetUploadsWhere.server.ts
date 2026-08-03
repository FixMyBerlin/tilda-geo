import { resolveUploadKind, type UploadKind } from '@/lib/mapDatasetUploadsSearchSchema'
import type { Prisma } from '@/prisma/generated/client'

export function buildMapDatasetUploadsWhere(input: {
  kind?: UploadKind
  regionSlug?: string
}): Prisma.MapDatasetUploadWhereInput {
  const kind = resolveUploadKind(input.kind)
  const regionSlug = input.regionSlug?.trim()

  return {
    systemLayer: kind === 'system',
    ...(regionSlug ? { regions: { some: { slug: regionSlug } } } : {}),
  }
}

/** Region clause only — used for kind chip counts scoped to the active region filter. */
export function buildMapDatasetUploadsRegionWhere(
  regionSlug: string | undefined,
): Prisma.MapDatasetUploadWhereInput {
  const slug = regionSlug?.trim()
  if (!slug) return {}
  return { regions: { some: { slug } } }
}
