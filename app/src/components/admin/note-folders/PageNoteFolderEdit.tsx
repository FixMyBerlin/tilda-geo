import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { AdminDeleteButton } from '@/components/admin/AdminDeleteButton'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTechnicalDetails } from '@/components/admin/AdminTechnicalDetails'
import { toAdminAsideSections } from '@/components/admin/aside/adminAsideSection'
import { AuditHistoryPanel } from '@/components/admin/audit-log/AuditHistoryPanel'
import { toastSuccess } from '@/components/shared/toast/toastSuccess'
import { adminNavCountsQueryOptions } from '@/server/admin/adminNavQueryOptions'
import { deleteNoteFolderForAdminFn } from '@/server/notes/notes.functions'
import { noteFolderConfigToFormValues } from '@/server/notes/schemas'
import { NoteFolderForm } from './pageNoteFolders/NoteFolderForm'

const routeApi = getRouteApi('/admin/note-folders/$id/edit')

/** Sections after the two form field groups (`NoteFolderForm`). */
const pageSectionLabels = {
  history: 'Änderungsverlauf',
  technical: 'Technische Details',
} satisfies Record<string, string>

export function PageNoteFolderEdit() {
  const { folder, regions, auditHistory } = routeApi.useLoaderData()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const deleteFolder = useMutation({
    mutationFn: () => deleteNoteFolderForAdminFn({ data: { id: folder.id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminNavCountsQueryOptions().queryKey })
      toastSuccess('Gelöscht.')
      await navigate({ to: '/admin/note-folders' })
    },
  })

  return (
    <>
      <AdminPageHeader
        title={folder.name}
        parent={{ label: 'Hinweis-Ordner', to: '/admin/note-folders' }}
        intro={`${folder.noteCount} Hinweise`}
      />

      <NoteFolderForm
        key={`${folder.id}:${folder.regionSlugs.join(',')}`}
        folderId={folder.id}
        initialValues={noteFolderConfigToFormValues({
          name: folder.name,
          regionSlugs: folder.regionSlugs,
        })}
        regions={regions}
        pageExtras={{
          sections: toAdminAsideSections(pageSectionLabels),
          content: (
            <>
              <AuditHistoryPanel
                id="history"
                rows={auditHistory}
                model="NoteFolder"
                recordId={String(folder.id)}
              />
              <AdminTechnicalDetails
                id="technical"
                dumps={[{ title: 'Hinweis-Ordner', data: folder }]}
              />
            </>
          ),
          destructiveAction: (
            <AdminDeleteButton
              label="Ordner löschen"
              title={`Ordner „${folder.name}“ löschen?`}
              description={
                folder.noteCount > 0 ? 'Nur leere Ordner können gelöscht werden.' : undefined
              }
              onDelete={async () => {
                await deleteFolder.mutateAsync()
              }}
            />
          ),
        }}
      />
    </>
  )
}
