import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { AdminDeleteButton } from '@/components/admin/AdminDeleteButton'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTechnicalDetails } from '@/components/admin/AdminTechnicalDetails'
import { toAdminAsideSections } from '@/components/admin/aside/adminAsideSection'
import { AuditHistoryPanel } from '@/components/admin/audit-log/AuditHistoryPanel'
import { toastSuccess } from '@/components/shared/toast/toastSuccess'
import { adminNavCountsQueryOptions } from '@/server/admin/adminNavQueryOptions'
import { deleteRegionContractFn } from '@/server/region-contracts/region-contracts.functions'
import { regionContractConfigToFormValues } from '@/server/region-contracts/regionContractSchema'
import { RegionContractForm } from './pageRegionContracts/RegionContractForm'

const routeApi = getRouteApi('/admin/region-contracts/$slug/edit')

/** Sections after the two form field groups (`RegionContractForm`). */
const pageSectionLabels = {
  history: 'Änderungsverlauf',
  technical: 'Technische Details',
} satisfies Record<string, string>

export function PageRegionContractEdit() {
  const { contract, regions, auditHistory } = routeApi.useLoaderData()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const deleteContract = useMutation({
    mutationFn: () => deleteRegionContractFn({ data: { slug: contract.slug } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminNavCountsQueryOptions().queryKey })
      toastSuccess('Gelöscht.')
      await navigate({ to: '/admin/region-contracts' })
    },
  })

  return (
    <>
      <AdminPageHeader
        title={contract.name}
        parent={{ label: 'Regionen-Aufträge', to: '/admin/region-contracts' }}
      />

      <RegionContractForm
        mode="edit"
        contractId={contract.id}
        contractSlug={contract.slug}
        initialValues={regionContractConfigToFormValues({
          slug: contract.slug,
          name: contract.name,
          status: contract.status,
          regionSlugs: contract.regionSlugs,
        })}
        regions={regions.map((r) => ({
          slug: r.slug,
          name: r.name,
          contract: r.contract ? { id: r.contract.id, name: r.contract.name } : null,
        }))}
        pageExtras={{
          sections: toAdminAsideSections(pageSectionLabels),
          content: (
            <>
              <AuditHistoryPanel
                id="history"
                rows={auditHistory}
                model="RegionContract"
                recordId={String(contract.id)}
              />
              <AdminTechnicalDetails
                id="technical"
                items={[
                  { label: 'ID', value: contract.id },
                  { label: 'Slug', value: <code>{contract.slug}</code> },
                ]}
                dumps={[{ title: 'Auftrag', data: contract }]}
              />
            </>
          ),
          destructiveAction: (
            <AdminDeleteButton
              label="Auftrag löschen"
              title={`Auftrag „${contract.name}“ löschen?`}
              description={`Der Auftrag »${contract.slug}« wird unwiderruflich gelöscht.`}
              onDelete={async () => {
                await deleteContract.mutateAsync()
              }}
            />
          ),
        }}
      />
    </>
  )
}
