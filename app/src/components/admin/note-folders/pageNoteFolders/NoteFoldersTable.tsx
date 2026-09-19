import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { AdminTableActions, AdminTableEditLink } from '@/components/admin/AdminTableActions'
import type { getNoteFoldersForAdmin } from '@/server/notes/queries/getNoteFoldersForAdmin.server'

type NoteFolderRow = Awaited<ReturnType<typeof getNoteFoldersForAdmin>>[number]

type Props = {
  folders: NoteFolderRow[]
}

const header = [
  'Name',
  'Regionen',
  'Hinweise',
  { id: 'actions', label: 'Aktionen', srOnly: true, align: 'right' as const },
]

export const NoteFoldersTable = ({ folders }: Props) => (
  <AdminTable header={header}>
    {folders.map((folder) => (
      <tr key={folder.id}>
        <th scope="row" className={adminTableClasses.thRow}>
          {folder.name}
        </th>
        <td className={adminTableClasses.td}>
          {folder.regionSlugs.length === 0 ? (
            <span className="text-gray-400">—</span>
          ) : (
            folder.regionSlugs.join(', ')
          )}
        </td>
        <td className={adminTableClasses.td}>{folder.noteCount}</td>
        <td className={adminTableClasses.td}>
          <AdminTableActions>
            <AdminTableEditLink
              to="/admin/note-folders/$id/edit"
              params={{ id: String(folder.id) }}
            />
          </AdminTableActions>
        </td>
      </tr>
    ))}
  </AdminTable>
)
