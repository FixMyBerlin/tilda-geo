import { useMutation } from '@tanstack/react-query'
import { getRouteApi, useNavigate, useRouter } from '@tanstack/react-router'
import { AdminConsoleDumpButton } from '@/components/admin/AdminConsoleDumpButton'
import { AdminPageTitleEdit, AdminPageTitleEditLabel } from '@/components/admin/adminPageTitle'
import { AdminTrashIconButton } from '@/components/admin/AdminTrashIconButton'
import { AuditHistoryPanel } from '@/components/admin/audit-log/AuditHistoryPanel'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { toastError } from '@/components/shared/toast/toastError'
import { deleteQaConfigFn, updateQaConfigFn } from '@/server/qa-configs/qa-configs.functions'
import { UpdateQaConfigFormSchema } from '@/server/qa-configs/schemas'
import { QaConfigExportSection } from './pageQaConfigs/QaConfigExportSection'
import { QaConfigForm } from './pageQaConfigs/QaConfigForm'

const routeApi = getRouteApi('/admin/qa-configs/$id/edit')

export function PageQaConfigEdit() {
  const { qaConfig, regions, auditHistory } = routeApi.useLoaderData()
  const router = useRouter()
  const navigate = useNavigate()

  const { mutate: deleteQaConfigMutation, isPending: isDeletingQaConfig } = useMutation({
    mutationFn: () => deleteQaConfigFn({ data: { id: qaConfig.id } }),
    onSuccess: async () => {
      await router.invalidate()
      navigate({ to: '/admin/qa-configs' })
    },
    onError: (error) => toastError(error, 'QA-Konfiguration konnte nicht gelöscht werden'),
  })

  const handleDeleteQaConfig = () => {
    if (
      window.confirm(
        `QA Konfiguration »${qaConfig.label}« (ID ${qaConfig.id}) unwiderruflich löschen?`,
      )
    ) {
      deleteQaConfigMutation()
    }
  }

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/qa-configs', name: 'QA Konfigurationen' },
            {
              href: `/admin/qa-configs/${qaConfig.id}/edit`,
              name: <AdminPageTitleEditLabel name={qaConfig.label} variant="breadcrumb" />,
            },
          ]}
        />
      </HeaderWrapper>

      <AdminPageTitleEdit name={qaConfig.label} />

      <div className="my-10">
        <AdminConsoleDumpButton name={qaConfig.slug} data={qaConfig} />
      </div>

      <QaConfigExportSection
        configId={qaConfig.id}
        label={qaConfig.label}
        slug={qaConfig.slug}
        mapTable={qaConfig.mapTable}
      />

      <QaConfigForm
        actionBarRight={
          <AdminTrashIconButton
            ariaLabel={`QA Konfiguration ${qaConfig.label} löschen`}
            disabled={isDeletingQaConfig}
            size="comfortable"
            onClick={handleDeleteQaConfig}
          />
        }
        schema={UpdateQaConfigFormSchema}
        defaultValues={{
          id: qaConfig.id,
          slug: qaConfig.slug,
          label: qaConfig.label,
          isActive: qaConfig.isActive ? 'true' : 'false',
          mapTable: qaConfig.mapTable,
          mapAttribution: qaConfig.mapAttribution ?? '',
          goodThreshold: qaConfig.goodThreshold.toString(),
          needsReviewThreshold: qaConfig.needsReviewThreshold.toString(),
          absoluteDifferenceThreshold: qaConfig.absoluteDifferenceThreshold.toString(),
          regionId: qaConfig.regionId.toString(),
        }}
        submitLabel="QA Konfiguration aktualisieren"
        regions={regions}
        onSubmit={async (values) => updateQaConfigFn({ data: values })}
      />

      <AuditHistoryPanel rows={auditHistory} model="QaConfig" recordId={String(qaConfig.id)} />
    </>
  )
}
