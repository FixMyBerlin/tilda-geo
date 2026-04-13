import { getRouteApi } from '@tanstack/react-router'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { QaConfigFormWrapper } from './pageQaConfigs/QaConfigFormWrapper'

const routeApi = getRouteApi('/admin/qa-configs/new')

export function PageQaConfigsNew() {
  const { regions } = routeApi.useLoaderData()

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/qa-configs', name: 'QA Konfigurationen' },
            { href: '/admin/qa-configs/new', name: 'Neue QA Konfiguration' },
          ]}
        />
      </HeaderWrapper>

      <QaConfigFormWrapper regions={regions} />
    </>
  )
}
