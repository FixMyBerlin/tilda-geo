import { getRouteApi } from '@tanstack/react-router'
import { AdminPageTitleNew, AdminPageTitleNewLabel } from '@/components/admin/adminPageTitle'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { createQaConfigFn } from '@/server/qa-configs/qa-configs.functions'
import { CreateQaConfigFormSchema } from '@/server/qa-configs/schemas'
import { QaConfigForm, QaConfigFormInputSchema } from './pageQaConfigs/QaConfigForm'

const routeApi = getRouteApi('/admin/qa-configs/new')

export function PageQaConfigsNew() {
  const { regions } = routeApi.useLoaderData()

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/qa-configs', name: 'QA Konfigurationen' },
            {
              href: '/admin/qa-configs/new',
              name: <AdminPageTitleNewLabel label="Neue QA Konfiguration" variant="breadcrumb" />,
            },
          ]}
        />
      </HeaderWrapper>

      <AdminPageTitleNew label="Neue QA Konfiguration" />

      <QaConfigForm
        schema={CreateQaConfigFormSchema}
        defaultValues={{
          slug: QaConfigFormInputSchema.slug,
          label: QaConfigFormInputSchema.label,
          isActive: QaConfigFormInputSchema.isActive,
          mapTable: QaConfigFormInputSchema.mapTable,
          mapAttribution: QaConfigFormInputSchema.mapAttribution,
          goodThreshold: QaConfigFormInputSchema.goodThreshold,
          needsReviewThreshold: QaConfigFormInputSchema.needsReviewThreshold,
          absoluteDifferenceThreshold: QaConfigFormInputSchema.absoluteDifferenceThreshold,
          regionId: QaConfigFormInputSchema.regionId,
        }}
        submitLabel="QA Konfiguration erstellen"
        regions={regions}
        onSubmit={async (values) => createQaConfigFn({ data: values })}
      />
    </>
  )
}
