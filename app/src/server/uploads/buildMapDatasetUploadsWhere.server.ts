import { resolveUploadKind, type UploadKind } from '@/lib/mapDatasetUploadsSearchSchema'
import type { Prisma } from '@/prisma/generated/client'
import { optionalTrimmed, searchTerms } from '@/server/utils/searchString'

type UploadsFilterInput = {
  regionSlug?: string
  q?: string
}

export function buildMapDatasetUploadsWhere(
  input: UploadsFilterInput & { kind?: UploadKind },
): Prisma.MapDatasetUploadWhereInput {
  const kind = resolveUploadKind(input.kind)

  return {
    systemLayer: kind === 'system',
    ...buildMapDatasetUploadsFilterWhere(input),
  }
}

/**
 * Region and `?q=` clauses without the kind — used for the kind chip counts, so they match the
 * active filters. Every whitespace-separated term of `q` must match the slug or a view (layer
 * config) name, case-insensitively.
 */
export function buildMapDatasetUploadsFilterWhere({
  regionSlug,
  q,
}: UploadsFilterInput): Prisma.MapDatasetUploadWhereInput {
  const slug = optionalTrimmed(regionSlug)
  const terms = searchTerms(q)

  return {
    ...(slug ? { regions: { some: { slug } } } : {}),
    ...(terms.length
      ? {
          AND: terms.map((term) => {
            const contains = { contains: term, mode: 'insensitive' } as const
            return { OR: [{ slug: contains }, { layerConfigs: { some: { name: contains } } }] }
          }),
        }
      : {}),
  }
}
