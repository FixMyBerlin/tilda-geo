import { getRouteApi } from '@tanstack/react-router'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { adminHeaderActionButtonClassName, HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { Link } from '@/components/shared/links/Link'
import { QaConfigCard } from './pageQaConfigs/QaConfigCard'

const routeApi = getRouteApi('/admin/qa-configs/')

export function PageQaConfigs() {
  const { qaConfigs } = routeApi.useLoaderData()

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb pages={[{ href: '/admin/qa-configs', name: 'QA Konfigurationen' }]} />
        <Link to="/admin/qa-configs/new" button className={adminHeaderActionButtonClassName}>
          Neue QA Konfiguration
        </Link>
      </HeaderWrapper>

      <div className="space-y-4">
        {qaConfigs.map((config) => (
          <QaConfigCard key={config.id} config={config} />
        ))}
      </div>
    </>
  )
}
