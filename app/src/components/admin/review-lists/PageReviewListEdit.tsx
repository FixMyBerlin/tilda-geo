import { useMutation } from '@tanstack/react-query'
import { getRouteApi, useNavigate, useRouter } from '@tanstack/react-router'
import { AdminConsoleDumpButton } from '@/components/admin/AdminConsoleDumpButton'
import { AdminPageTitleEdit, AdminPageTitleEditLabel } from '@/components/admin/adminPageTitle'
import { AdminTrashIconButton } from '@/components/admin/AdminTrashIconButton'
import { AuditHistoryPanel } from '@/components/admin/audit-log/AuditHistoryPanel'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'
import { toastError } from '@/components/shared/toast/toastError'
import {
  deleteReviewListForAdminFn,
  updateReviewListForAdminFn,
} from '@/server/review-lists/review-lists.functions'
import {
  reviewListConfigToFormValues,
  UpdateReviewListFormSchema,
} from '@/server/review-lists/schemas'
import { ReviewListForm } from './pageReviewLists/ReviewListForm'

const routeApi = getRouteApi('/admin/review-lists/$id/edit')

export function PageReviewListEdit() {
  const { list, regions, auditHistory } = routeApi.useLoaderData()
  const router = useRouter()
  const navigate = useNavigate()

  const { mutate: deleteMutation, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteReviewListForAdminFn({ data: { id: list.id } }),
    onSuccess: async () => {
      await router.invalidate()
      navigate({ to: '/admin/review-lists' })
    },
    onError: (error) => toastError(error, 'Prüfliste konnte nicht gelöscht werden'),
  })

  const handleDelete = () => {
    const entryHint =
      list.entryCount > 0
        ? ` Die ${list.entryCount} Einträge (inkl. Kommentare) werden mitgelöscht.`
        : ''
    if (window.confirm(`Prüfliste »${list.name}« unwiderruflich löschen?${entryHint}`)) {
      deleteMutation()
    }
  }

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb
          pages={[
            { href: '/admin/review-lists', name: 'Prüflisten' },
            {
              href: `/admin/review-lists/${list.id}/edit`,
              name: <AdminPageTitleEditLabel name={list.name} variant="breadcrumb" />,
            },
          ]}
        />
      </HeaderWrapper>

      <AdminPageTitleEdit name={list.name} />

      <div className="my-10">
        <AdminConsoleDumpButton name={list.name} data={list} />
        <p className="mt-2 text-sm text-gray-500">{list.entryCount} Einträge</p>
      </div>

      <ReviewListForm
        actionBarRight={
          <AdminTrashIconButton
            ariaLabel={`Prüfliste ${list.name} löschen`}
            disabled={isDeleting}
            size="comfortable"
            onClick={handleDelete}
          />
        }
        schema={UpdateReviewListFormSchema}
        defaultValues={reviewListConfigToFormValues({
          name: list.name,
          regionSlugs: list.regionSlugs,
        })}
        submitLabel="Prüfliste aktualisieren"
        regions={regions.map((r) => ({ slug: r.slug, name: r.name }))}
        onSubmit={async (values) =>
          updateReviewListForAdminFn({ data: { id: list.id, ...values } })
        }
      />

      <AuditHistoryPanel rows={auditHistory} model="ReviewList" recordId={String(list.id)} />
    </>
  )
}
