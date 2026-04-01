import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import RegionError from '@/components/regionen/pageRegionSlug/RegionError'
import {
  assertNonProdErrorPreviewRoute,
  DEV_ERROR_PREVIEW_DEFAULT_REGION_SLUG,
} from '@/dev/errorPreviews'

const searchSchema = z.object({
  regionSlug: z.string().optional(),
})

export const Route = createFileRoute('/admin/dev/preview-region-error')({
  ssr: true,
  beforeLoad: () => {
    assertNonProdErrorPreviewRoute()
  },
  validateSearch: (search) => searchSchema.parse(search),
  component: DevPreviewRegionError,
})

function DevPreviewRegionError() {
  const { regionSlug } = Route.useSearch()
  return (
    <RegionError
      error={new Error('Region error UI preview (non-production)')}
      reset={() => {}}
      previewRegionSlug={regionSlug ?? DEV_ERROR_PREVIEW_DEFAULT_REGION_SLUG}
    />
  )
}
