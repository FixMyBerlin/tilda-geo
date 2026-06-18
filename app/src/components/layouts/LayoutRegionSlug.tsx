import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import { PageRegionSlug } from '@/components/regionen/PageRegionSlug'

export function LayoutRegionSlug() {
  return (
    <NuqsAdapter>
      <PageRegionSlug />
    </NuqsAdapter>
  )
}
