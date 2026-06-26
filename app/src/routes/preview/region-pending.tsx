import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import RegionPagePending from '@/components/regionen/pageRegionSlug/RegionPagePending'
import { DEV_ERROR_PREVIEW_DEFAULT_REGION_SLUG } from '@/dev/errorPreviews'
import { optionalSearchString } from '@/lib/searchParamsSchema'

const searchSchema = z.object({
  regionSlug: optionalSearchString(),
})

export const Route = createFileRoute('/preview/region-pending')({
  ssr: true,
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [{ title: 'Regions-Lade-Vorschau – TILDA' }],
  }),
  component: PreviewRegionPending,
})

function PreviewRegionPending() {
  const { regionSlug } = Route.useSearch()
  return (
    <RegionPagePending previewRegionSlug={regionSlug ?? DEV_ERROR_PREVIEW_DEFAULT_REGION_SLUG} />
  )
}
