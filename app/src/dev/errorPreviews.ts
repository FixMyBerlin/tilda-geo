import { notFound } from '@tanstack/react-router'
import { isProd } from '@/components/shared/utils/isEnv'

export function assertNonProdErrorPreviewRoute() {
  if (isProd) throw notFound()
}

export const DEV_REGION_ERROR_QUERY_KEY = '__regionError'

export const DEV_ERROR_PREVIEW_DEFAULT_REGION_SLUG = 'berlin'

export function devRegionErrorPreviewHref(regionSlug = DEV_ERROR_PREVIEW_DEFAULT_REGION_SLUG) {
  return `/regionen/${regionSlug}?${DEV_REGION_ERROR_QUERY_KEY}=1`
}
