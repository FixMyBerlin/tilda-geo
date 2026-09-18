import { getRouteApi } from '@tanstack/react-router'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { QaConfigForm, qaConfigFormEmptyDefaults } from './pageQaConfigs/QaConfigForm'

const routeApi = getRouteApi('/admin/qa-configs/new')

export function PageQaConfigsNew() {
  const { regions } = routeApi.useLoaderData()

  return (
    <>
      <AdminPageHeader
        title="Neue QA-Konfiguration"
        parent={{ label: 'QA-Konfigurationen', to: '/admin/qa-configs' }}
      />
      <QaConfigForm mode="create" defaultValues={qaConfigFormEmptyDefaults} regions={regions} />
    </>
  )
}
