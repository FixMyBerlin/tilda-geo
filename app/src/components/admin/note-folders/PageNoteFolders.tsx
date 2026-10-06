import { getRouteApi } from '@tanstack/react-router'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminRegionFilter } from '@/components/admin/AdminRegionFilter'
import { NoteFoldersTable } from './pageNoteFolders/NoteFoldersTable'

const routeApi = getRouteApi('/admin/note-folders/')

export function PageNoteFolders() {
  const { folders } = routeApi.useLoaderData()
  const { regionSlug } = routeApi.useSearch()

  return (
    <>
      <AdminPageHeader
        title="Hinweis-Ordner"
        intro="Neue Ordner werden in der Region im Modus Hinweise angelegt. Das können Mitglieder und Admins tun."
      />

      <div className="mb-6">
        <AdminRegionFilter />
      </div>

      {folders.length === 0 ? (
        <AdminEmptyState>
          {regionSlug ? 'Keine Hinweis-Ordner für diese Region.' : 'Noch keine Ordner angelegt.'}
        </AdminEmptyState>
      ) : (
        <NoteFoldersTable folders={folders} />
      )}
    </>
  )
}
