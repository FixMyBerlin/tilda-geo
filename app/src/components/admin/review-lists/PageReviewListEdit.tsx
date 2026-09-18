import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { AdminDeleteButton } from '@/components/admin/AdminDeleteButton'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTechnicalDetails } from '@/components/admin/AdminTechnicalDetails'
import { toAdminAsideSections } from '@/components/admin/aside/adminAsideSection'
import { AuditHistoryPanel } from '@/components/admin/audit-log/AuditHistoryPanel'
import { toastSuccess } from '@/components/shared/toast/toastSuccess'
import { adminNavCountsQueryOptions } from '@/server/admin/adminNavQueryOptions'
import { deleteReviewListForAdminFn } from '@/server/review-lists/review-lists.functions'
import { reviewListConfigToFormValues } from '@/server/review-lists/schemas'
import { ReviewListForm } from './pageReviewLists/ReviewListForm'

const routeApi = getRouteApi('/admin/review-lists/$id/edit')

/** Sections after the two form field groups (`ReviewListForm`). */
const pageSectionLabels = {
  history: 'Änderungsverlauf',
  technical: 'Technische Details',
} satisfies Record<string, string>

export function PageReviewListEdit() {
  const { list, regions, auditHistory } = routeApi.useLoaderData()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const deleteList = useMutation({
    mutationFn: () => deleteReviewListForAdminFn({ data: { id: list.id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminNavCountsQueryOptions().queryKey })
      toastSuccess('Gelöscht.')
      await navigate({ to: '/admin/review-lists' })
    },
  })

  return (
    <>
      <AdminPageHeader
        title={list.name}
        parent={{ label: 'Prüflisten', to: '/admin/review-lists' }}
        intro={`${list.entryCount} Einträge`}
      />

      <ReviewListForm
        key={`${list.id}:${list.regionSlugs.join(',')}`}
        listId={list.id}
        initialValues={reviewListConfigToFormValues({
          name: list.name,
          regionSlugs: list.regionSlugs,
        })}
        regions={regions}
        pageExtras={{
          sections: toAdminAsideSections(pageSectionLabels),
          content: (
            <>
              <AuditHistoryPanel
                id="history"
                rows={auditHistory}
                model="ReviewList"
                recordId={String(list.id)}
              />
              <AdminTechnicalDetails id="technical" dumps={[{ title: 'Prüfliste', data: list }]} />
            </>
          ),
          destructiveAction: (
            <AdminDeleteButton
              label="Prüfliste löschen"
              title={`Prüfliste „${list.name}“ löschen?`}
              description={
                list.entryCount > 0
                  ? `Die ${list.entryCount} Einträge (inkl. Kommentare) werden mitgelöscht.`
                  : undefined
              }
              onDelete={async () => {
                await deleteList.mutateAsync()
              }}
            />
          ),
        }}
      />
    </>
  )
}
