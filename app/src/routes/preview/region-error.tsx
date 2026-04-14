import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import RegionError from '@/components/regionen/pageRegionSlug/RegionError'
import { DEV_ERROR_PREVIEW_DEFAULT_REGION_SLUG } from '@/dev/errorPreviews'
import { optionalSearchString } from '@/lib/searchParamsSchema'

const searchSchema = z.object({
  regionSlug: optionalSearchString(),
})

export const Route = createFileRoute('/preview/region-error')({
  ssr: true,
  validateSearch: (search) => searchSchema.parse(search),
  component: PreviewRegionError,
})

function PreviewRegionError() {
  const { regionSlug } = Route.useSearch()
  return (
    <RegionError
      error={new Error('Region error UI preview (non-production)')}
      reset={() => {}}
      previewRegionSlug={regionSlug ?? DEV_ERROR_PREVIEW_DEFAULT_REGION_SLUG}
    />
  )
}
