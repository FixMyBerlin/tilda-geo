import { getRouteApi } from '@tanstack/react-router'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { adminHeaderActionButtonClassName, HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { Link } from '@/components/shared/links/Link'
import { MissingRegions } from './pageRegions/MissingRegions'
import { RegionsTable } from './pageRegions/RegionsTable'

const routeApi = getRouteApi('/admin/regions/')

export function PageRegions() {
  const { regions } = routeApi.useLoaderData()

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb pages={[{ href: '/admin/regions', name: 'Regionen' }]} />
        <Link to="/admin/regions/new" button className={adminHeaderActionButtonClassName}>
          Neue Region
        </Link>
      </HeaderWrapper>

      <RegionsTable regions={regions} />
      <MissingRegions regions={regions} />
    </>
  )
}
