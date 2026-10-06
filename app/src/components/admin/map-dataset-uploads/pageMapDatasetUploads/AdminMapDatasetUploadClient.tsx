import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { AdminDeleteButton } from '@/components/admin/AdminDeleteButton'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTechnicalDetails } from '@/components/admin/AdminTechnicalDetails'
import { AdminAsideActions } from '@/components/admin/aside/AdminAsideActions'
import { AdminAsideBackLink } from '@/components/admin/aside/AdminAsideBackLink'
import { AdminAsideLayout } from '@/components/admin/aside/AdminAsideLayout'
import { toAdminAsideSections } from '@/components/admin/aside/adminAsideSection'
import { AuditHistoryPanel } from '@/components/admin/audit-log/AuditHistoryPanel'
import { formatDateTimeBerlin } from '@/components/shared/date/formatDateBerlin'
import { toastSuccess } from '@/components/shared/toast/toastSuccess'
import { adminNavCountsQueryOptions } from '@/server/admin/adminNavQueryOptions'
import type { AuditLogRow } from '@/server/audit/queries/listAuditLog.server'
import type { getUploadWithRegions } from '@/server/uploads/queries/getUploadWithRegions.server'
import { deleteUploadFn } from '@/server/uploads/uploads.functions'
import { MapDatasetUploadLayersSection } from './MapDatasetUploadLayersSection'
import { MapDatasetUploadOverviewSection } from './MapDatasetUploadOverviewSection'
import { MapDatasetUploadRegionsSection } from './MapDatasetUploadRegionsSection'

type Upload = Awaited<ReturnType<typeof getUploadWithRegions>>

type Props = {
  upload: Upload
  auditHistory: AuditLogRow[]
}

/** Section ids (jump list + URL hash) and titles, in page order. */
const sectionLabels = {
  overview: 'Übersicht',
  regions: 'Regionen',
  layers: 'Ansichten',
  history: 'Änderungsverlauf',
  technical: 'Technische Details',
} satisfies Record<string, string>

export function AdminMapDatasetUploadClient({ upload, auditHistory }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const deleteUpload = useMutation({
    mutationFn: async () => {
      await deleteUploadFn({ data: { uploadSlug: upload.slug } })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminNavCountsQueryOptions().queryKey })
      toastSuccess('Gelöscht.')
      await navigate({ to: '/admin/map-dataset-uploads' })
    },
  })

  return (
    <>
      <AdminPageHeader
        title={upload.slug}
        parent={{ label: 'Uploads', to: '/admin/map-dataset-uploads' }}
      />

      <AdminAsideLayout
        sections={toAdminAsideSections(sectionLabels)}
        actions={
          <AdminAsideActions
            primary={<AdminAsideBackLink to="/admin/map-dataset-uploads" label="Zur Liste" />}
            destructive={
              <AdminDeleteButton
                label="Upload löschen"
                title={`Upload „${upload.slug}“ löschen?`}
                description={`Der Upload „${upload.slug}“ wird unwiderruflich gelöscht.`}
                onDelete={() => deleteUpload.mutateAsync()}
              />
            }
          />
        }
      >
        <MapDatasetUploadOverviewSection
          id="overview"
          title={sectionLabels.overview}
          upload={upload}
        />
        <MapDatasetUploadRegionsSection
          id="regions"
          title={sectionLabels.regions}
          uploadSlug={upload.slug}
          regions={upload.regions}
        />
        <MapDatasetUploadLayersSection
          id="layers"
          title={sectionLabels.layers}
          uploadSlug={upload.slug}
          layerConfigs={upload.layerConfigs}
          regions={upload.regions}
        />
        <AuditHistoryPanel
          id="history"
          rows={auditHistory}
          model="MapDatasetUpload"
          recordId={String(upload.id)}
        />
        <AdminTechnicalDetails
          id="technical"
          items={[
            { label: 'ID', value: upload.id },
            {
              label: 'Erstellt',
              value: `${formatDateTimeBerlin(upload.createdAt)} (${upload.createdBy})`,
            },
            { label: 'Aktualisiert', value: formatDateTimeBerlin(upload.updatedAt) },
          ]}
          dumps={[
            { title: 'Upload', data: upload },
            ...upload.layerConfigs.map((layerConfig) => ({
              title: `Ansicht ${layerConfig.name} (${layerConfig.id})`,
              data: layerConfig,
            })),
          ]}
        />
      </AdminAsideLayout>
    </>
  )
}
