import { getRouteApi } from '@tanstack/react-router'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { RegionFormNew } from './pageRegions/RegionFormNew'

const routeApi = getRouteApi('/admin/regions/new')

export function PageRegionsNew() {
  const { slug } = routeApi.useSearch()
  const { contracts } = routeApi.useLoaderData()

  return (
    <>
      <AdminPageHeader title="Neue Region" parent={{ label: 'Regionen', to: '/admin/regions' }} />
      <RegionFormNew initialSlug={slug || undefined} contracts={contracts} />
    </>
  )
}
