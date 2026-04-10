import { createFileRoute } from '@tanstack/react-router'
import RegionPagePending from '@/components/regionen/pageRegionSlug/RegionPagePending'
import { assertNonProdErrorPreviewRoute } from '@/dev/errorPreviews'

export const Route = createFileRoute('/admin/dev/preview-region-pending')({
  ssr: true,
  beforeLoad: () => {
    assertNonProdErrorPreviewRoute()
  },
  component: RegionPagePending,
})
