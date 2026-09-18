import { ArrowDownTrayIcon, MapIcon } from '@heroicons/react/20/solid'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { AdminDeleteButton } from '@/components/admin/AdminDeleteButton'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTechnicalDetails } from '@/components/admin/AdminTechnicalDetails'
import { AdminAsideLink } from '@/components/admin/aside/AdminAsideActions'
import { toAdminAsideSections } from '@/components/admin/aside/adminAsideSection'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import { AuditHistoryPanel } from '@/components/admin/audit-log/AuditHistoryPanel'
import { toastSuccess } from '@/components/shared/toast/toastSuccess'
import { adminNavCountsQueryOptions } from '@/server/admin/adminNavQueryOptions'
import { getQaConfigExportFilename } from '@/server/qa-configs/export/getQaConfigExportFilename'
import { deleteQaConfigFn } from '@/server/qa-configs/qa-configs.functions'
import { fractionToPercent } from '@/shared/qaThresholdPercent'
import { QaConfigExportSection } from './pageQaConfigs/QaConfigExportSection'
import { QaConfigForm } from './pageQaConfigs/QaConfigForm'
import { QaConfigOrphanedEvaluationsSection } from './pageQaConfigs/QaConfigOrphanedEvaluationsSection'
import { QaConfigStatsTable } from './pageQaConfigs/QaConfigStatsTable'

const routeApi = getRouteApi('/admin/qa-configs/$id/edit')

/** Sections after the form field groups (`QaConfigForm`); `orphaned` only when there are any. */
const pageSectionLabels = {
  stats: 'Statistiken',
  export: 'Datenexport (CSV)',
  orphaned: 'Verwaiste Bewertungen',
  history: 'Änderungsverlauf',
  technical: 'Technische Details',
} satisfies Record<string, string>

export function PageQaConfigEdit() {
  const { qaConfig, regions, auditHistory, orphanedEvaluations, stats } = routeApi.useLoaderData()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const hasOrphaned = orphanedEvaluations.total > 0
  const { orphaned: _orphaned, ...labelsWithoutOrphaned } = pageSectionLabels
  const sections = toAdminAsideSections(hasOrphaned ? pageSectionLabels : labelsWithoutOrphaned)

  const deleteQaConfig = useMutation({
    mutationFn: async () => {
      await deleteQaConfigFn({ data: { id: qaConfig.id } })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminNavCountsQueryOptions().queryKey })
      toastSuccess('Gelöscht.')
      await navigate({ to: '/admin/qa-configs' })
    },
  })

  return (
    <>
      <AdminPageHeader
        title={qaConfig.label}
        parent={{ label: 'QA-Konfigurationen', to: '/admin/qa-configs' }}
      />

      <QaConfigForm
        mode="edit"
        id={qaConfig.id}
        regions={regions}
        defaultValues={{
          slug: qaConfig.slug,
          label: qaConfig.label,
          isActive: qaConfig.isActive ? 'true' : 'false',
          mapTable: qaConfig.mapTable,
          mapAttribution: qaConfig.mapAttribution ?? '',
          goodThreshold: fractionToPercent(qaConfig.goodThreshold).toString(),
          needsReviewThreshold: fractionToPercent(qaConfig.needsReviewThreshold).toString(),
          absoluteDifferenceThreshold: qaConfig.absoluteDifferenceThreshold.toString(),
          regionId: qaConfig.regionId.toString(),
          trustedOsmUsernames: qaConfig.trustedOsmUsernames.join('\n'),
          referenceFrozenAt: qaConfig.referenceFrozenAt.toISOString().slice(0, 10),
        }}
        pageExtras={{
          sections,
          content: (
            <>
              <AdminFormSection
                id="stats"
                title={pageSectionLabels.stats}
                description="Aktueller Status der Bereiche nach letzter Bewertung."
              >
                <QaConfigStatsTable stats={stats} />
              </AdminFormSection>
              <QaConfigExportSection
                id="export"
                title={pageSectionLabels.export}
                slug={qaConfig.slug}
                mapTable={qaConfig.mapTable}
              />
              {hasOrphaned ? (
                <QaConfigOrphanedEvaluationsSection
                  id="orphaned"
                  title={pageSectionLabels.orphaned}
                  orphanedEvaluations={orphanedEvaluations}
                />
              ) : null}
              <AuditHistoryPanel
                id="history"
                rows={auditHistory}
                model="QaConfig"
                recordId={String(qaConfig.id)}
              />
              <AdminTechnicalDetails
                id="technical"
                items={[
                  { label: 'ID', value: qaConfig.id },
                  { label: 'Slug', value: <code>{qaConfig.slug}</code> },
                ]}
                dumps={[{ title: 'QA-Konfiguration', data: qaConfig }]}
              />
            </>
          ),
          secondaryActions: (
            <>
              <AdminAsideLink
                icon={ArrowDownTrayIcon}
                href={`/api/admin/qa-configs/${qaConfig.id}/export-csv`}
                download={getQaConfigExportFilename(qaConfig.slug)}
              >
                CSV exportieren
              </AdminAsideLink>
              <AdminAsideLink
                icon={MapIcon}
                blank
                to="/regionen/$regionSlug"
                params={{ regionSlug: qaConfig.region.slug }}
              >
                Karte öffnen
              </AdminAsideLink>
            </>
          ),
          destructiveAction: (
            <AdminDeleteButton
              label="Löschen"
              title={`QA-Konfiguration „${qaConfig.label}“ löschen?`}
              description={`Die QA-Konfiguration »${qaConfig.slug}« (ID ${qaConfig.id}) wird unwiderruflich gelöscht. Solange Bewertungen existieren, schlägt das Löschen fehl.`}
              onDelete={() => deleteQaConfig.mutateAsync()}
            />
          ),
        }}
      />
    </>
  )
}
