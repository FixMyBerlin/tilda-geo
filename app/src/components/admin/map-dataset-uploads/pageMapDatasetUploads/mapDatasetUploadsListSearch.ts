import type { MapDatasetUploadsSearch, UploadKind } from '@/lib/mapDatasetUploadsSearchSchema'

type BuildUploadsListSearchInput = {
  kind?: UploadKind | string
  regionSlug?: string
  take?: number
}

/** Build uploads list search; omit default `kind=datasets` from the URL. */
export function buildUploadsListSearch(
  input: BuildUploadsListSearchInput = {},
): MapDatasetUploadsSearch {
  const kind = input.kind === 'system' ? 'system' : undefined
  const regionSlug = input.regionSlug?.trim() || undefined

  return {
    kind,
    regionSlug,
    skip: undefined,
    take: input.take,
  }
}
