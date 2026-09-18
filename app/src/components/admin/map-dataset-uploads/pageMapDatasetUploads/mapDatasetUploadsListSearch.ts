import type { MapDatasetUploadsSearchInput, UploadKind } from '@/lib/mapDatasetUploadsSearchSchema'

type BuildUploadsListSearchInput = {
  kind?: UploadKind | string
  regionSlug?: string
  q?: string
  pageSize?: number
}

/** Build uploads list search on page 1; omit default `kind=datasets` from the URL. */
export function buildUploadsListSearch(input: BuildUploadsListSearchInput = {}) {
  const kind = input.kind === 'system' ? 'system' : undefined
  const regionSlug = input.regionSlug?.trim() || undefined

  return {
    kind,
    regionSlug,
    q: input.q,
    pageSize: input.pageSize,
  } satisfies MapDatasetUploadsSearchInput
}
