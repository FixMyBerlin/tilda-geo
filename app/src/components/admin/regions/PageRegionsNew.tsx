import { getRouteApi } from '@tanstack/react-router'
import { useMemo } from 'react'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { staticRegion } from '@/data/regions.const'
import { RegionFormNew } from './pageRegions/RegionFormNew'

const routeApi = getRouteApi('/admin/regions/new')

export function PageRegionsNew() {
  const { regions } = routeApi.useLoaderData()
  const { slug } = routeApi.useSearch()

  const creatableRegions = useMemo(() => {
    const existing = new Set(regions.map((r) => r.slug))
    return staticRegion.filter((r) => !existing.has(r.slug))
  }, [regions])

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/regions', name: 'Regionen' },
            { href: '/admin/regions/new', name: 'Anlegen' },
          ]}
        />
      </HeaderWrapper>

      <RegionFormNew creatableRegions={creatableRegions} initialSlug={slug || undefined} />
    </>
  )
}
