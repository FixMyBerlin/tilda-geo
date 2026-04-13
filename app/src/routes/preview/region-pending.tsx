import { createFileRoute } from '@tanstack/react-router'
import RegionPagePending from '@/components/regionen/pageRegionSlug/RegionPagePending'

export const Route = createFileRoute('/preview/region-pending')({
  ssr: true,
  component: RegionPagePending,
})
