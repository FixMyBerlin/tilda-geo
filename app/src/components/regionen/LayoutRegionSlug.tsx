import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import { PageRegionSlug } from './PageRegionSlug'

export function LayoutRegionSlug() {
  return (
    <NuqsAdapter>
      <PageRegionSlug />
    </NuqsAdapter>
  )
}
