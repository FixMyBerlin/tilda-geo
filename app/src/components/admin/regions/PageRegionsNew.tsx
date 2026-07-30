import { getRouteApi } from '@tanstack/react-router'
import { AdminPageTitleNew, AdminPageTitleNewLabel } from '@/components/admin/adminPageTitle'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { RegionFormNew } from './pageRegions/RegionFormNew'

const routeApi = getRouteApi('/admin/regions/new')

export function PageRegionsNew() {
  const { slug } = routeApi.useSearch()
  const { contracts } = routeApi.useLoaderData()

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/regions', name: 'Regionen' },
            {
              href: '/admin/regions/new',
              name: <AdminPageTitleNewLabel label="Neue Region" variant="breadcrumb" />,
            },
          ]}
        />
      </HeaderWrapper>

      <AdminPageTitleNew label="Neue Region" />

      <RegionFormNew initialSlug={slug || undefined} contracts={contracts} />
    </>
  )
}
