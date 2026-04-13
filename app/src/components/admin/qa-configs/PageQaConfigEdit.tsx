import { getRouteApi } from '@tanstack/react-router'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { ObjectDump } from '@/components/admin/ObjectDump'
import { EditQaConfigFormClient } from './pageQaConfigs/EditQaConfigFormClient'

const routeApi = getRouteApi('/admin/qa-configs/$id/edit')

export function PageQaConfigEdit() {
  const { qaConfig, regions, id } = routeApi.useLoaderData()

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/qa-configs', name: 'QA Konfigurationen' },
            { href: `/admin/qa-configs/${id}/edit`, name: 'Bearbeiten' },
          ]}
        />
      </HeaderWrapper>

      <ObjectDump data={qaConfig} className="my-10" />

      <EditQaConfigFormClient qaConfig={qaConfig} regions={regions} />
    </>
  )
}
