import { useMutation } from '@tanstack/react-query'
import { getRouteApi, useNavigate, useRouter } from '@tanstack/react-router'
import { AdminPageTitleEdit, AdminPageTitleEditLabel } from '@/components/admin/adminPageTitle'
import { AdminTrashIconButton } from '@/components/admin/AdminTrashIconButton'
import { AuditHistoryPanel } from '@/components/admin/audit-log/AuditHistoryPanel'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { toastError } from '@/components/shared/toast/toastError'
import {
  deleteRegionContractFn,
  updateRegionContractFn,
} from '@/server/region-contracts/region-contracts.functions'
import {
  regionContractConfigToFormValues,
  UpdateRegionContractFormSchema,
} from '@/server/region-contracts/regionContractSchema'
import { RegionContractForm } from './pageRegionContracts/RegionContractForm'

const routeApi = getRouteApi('/admin/region-contracts/$slug/edit')

export function PageRegionContractEdit() {
  const { contract, regions, auditHistory } = routeApi.useLoaderData()
  const router = useRouter()
  const navigate = useNavigate()

  const { mutate: deleteMutation, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteRegionContractFn({ data: { slug: contract.slug } }),
    onSuccess: async () => {
      await router.invalidate()
      navigate({ to: '/admin/region-contracts' })
    },
    // Surface the server's guard message (e.g. "… hat noch N zugewiesene Region(en). Bitte zuerst
    // Regionen entfernen.") — otherwise a blocked delete looks like nothing happened.
    onError: (error) => toastError(error, 'Löschen fehlgeschlagen'),
  })

  const handleDelete = () => {
    if (window.confirm(`Auftrag »${contract.name}« unwiderruflich löschen?`)) {
      deleteMutation()
    }
  }

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/region-contracts', name: 'Regionen-Aufträge' },
            {
              href: `/admin/region-contracts/${contract.slug}/edit`,
              name: <AdminPageTitleEditLabel name={contract.name} variant="breadcrumb" />,
            },
          ]}
        />
      </HeaderWrapper>

      <AdminPageTitleEdit name={contract.name} />

      <RegionContractForm
        actionBarRight={
          <AdminTrashIconButton
            ariaLabel={`Auftrag ${contract.name} löschen`}
            disabled={isDeleting}
            size="comfortable"
            onClick={handleDelete}
          />
        }
        schema={UpdateRegionContractFormSchema}
        defaultValues={regionContractConfigToFormValues({
          slug: contract.slug,
          name: contract.name,
          status: contract.status,
          regionSlugs: contract.regionSlugs,
        })}
        submitLabel="Auftrag aktualisieren"
        editingContractId={contract.id}
        regions={regions.map((r) => ({
          slug: r.slug,
          name: r.name,
          contract: r.contract ? { id: r.contract.id, name: r.contract.name } : null,
        }))}
        slugDisabled
        onSubmit={async (values) =>
          updateRegionContractFn({ data: { ...values, slug: contract.slug } })
        }
      />

      <AuditHistoryPanel
        rows={auditHistory}
        model="RegionContract"
        recordId={String(contract.id)}
      />
    </>
  )
}
