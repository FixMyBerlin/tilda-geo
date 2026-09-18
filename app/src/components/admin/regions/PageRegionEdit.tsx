import {
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CloudArrowUpIcon,
  MapIcon,
  UsersIcon,
} from '@heroicons/react/20/solid'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { AdminDeleteButton } from '@/components/admin/AdminDeleteButton'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTechnicalDetails } from '@/components/admin/AdminTechnicalDetails'
import { AdminAsideLink } from '@/components/admin/aside/AdminAsideActions'
import { toAdminAsideSections } from '@/components/admin/aside/adminAsideSection'
import { buildUploadsListSearch } from '@/components/admin/map-dataset-uploads/pageMapDatasetUploads/mapDatasetUploadsListSearch'
import { toastSuccess } from '@/components/shared/toast/toastSuccess'
import { adminNavCountsQueryOptions } from '@/server/admin/adminNavQueryOptions'
import { regionenIndexQueryKey } from '@/server/regions/regionenIndexQueryOptions'
import { deleteRegionFn } from '@/server/regions/regions.functions'
import { RegionFormEdit } from './pageRegions/RegionFormEdit'

const routeApi = getRouteApi('/admin/regions/$regionSlug/edit')

/** Sections after the 12 form field groups (`RegionForm`). */
const pageSectionLabels = {
  technical: 'Technische Details',
} satisfies Record<string, string>

export function PageRegionEdit() {
  const { region, formConfig, formValues, contracts, linkCounts } = routeApi.useLoaderData()
  const regionSearch = { regionSlug: region.slug }
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const deleteRegion = useMutation({
    mutationFn: async () => {
      const result = await deleteRegionFn({ data: { slug: region.slug } })
      if (!result.success) throw new Error(result.message)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: regionenIndexQueryKey }),
        queryClient.invalidateQueries({ queryKey: adminNavCountsQueryOptions().queryKey }),
      ])
      toastSuccess('Gelöscht.')
      await navigate({ to: '/admin/regions' })
    },
  })

  return (
    <>
      <AdminPageHeader title={region.name} parent={{ label: 'Regionen', to: '/admin/regions' }} />

      <RegionFormEdit
        formConfig={formConfig}
        formValues={formValues}
        contracts={contracts}
        regionId={region.id}
        pageExtras={{
          sections: toAdminAsideSections(pageSectionLabels),
          content: (
            <AdminTechnicalDetails
              id="technical"
              items={[
                { label: 'ID', value: region.id },
                { label: 'Slug', value: <code>{region.slug}</code> },
              ]}
              dumps={[
                { title: 'Region', data: region },
                { title: 'Gespeicherte Konfiguration', data: formConfig },
              ]}
            />
          ),
          secondaryActions: (
            <>
              <AdminAsideLink
                icon={MapIcon}
                blank
                to="/regionen/$regionSlug"
                params={{ regionSlug: region.slug }}
              >
                Karte öffnen
              </AdminAsideLink>
              <AdminAsideLink
                icon={UsersIcon}
                to="/admin/memberships"
                search={regionSearch}
                count={linkCounts.memberships}
              >
                Mitglieder
              </AdminAsideLink>
              <AdminAsideLink
                icon={CloudArrowUpIcon}
                to="/admin/map-dataset-uploads"
                search={buildUploadsListSearch(regionSearch)}
                count={linkCounts.uploads}
              >
                Uploads
              </AdminAsideLink>
              <AdminAsideLink
                icon={CheckBadgeIcon}
                to="/admin/qa-configs"
                search={regionSearch}
                count={linkCounts.qaConfigs}
              >
                QA-Konfigurationen
              </AdminAsideLink>
              <AdminAsideLink
                icon={ClipboardDocumentListIcon}
                to="/admin/review-lists"
                search={regionSearch}
                count={linkCounts.reviewLists}
              >
                Prüflisten
              </AdminAsideLink>
              <AdminAsideLink
                icon={ClockIcon}
                to="/admin/audit-log"
                search={regionSearch}
                count={linkCounts.auditLog}
              >
                Änderungsverlauf
              </AdminAsideLink>
              <AdminAsideLink
                icon={ArrowDownTrayIcon}
                href={`/api/regions/${region.slug}/uploads-csv`}
                download
              >
                Uploads als CSV
              </AdminAsideLink>
            </>
          ),
          destructiveAction: (
            <AdminDeleteButton
              label="Region löschen"
              title={`Region „${region.name}“ löschen?`}
              description={`Die Region »${region.slug}« wird unwiderruflich gelöscht.`}
              onDelete={() => deleteRegion.mutateAsync()}
            />
          ),
        }}
      />
    </>
  )
}
