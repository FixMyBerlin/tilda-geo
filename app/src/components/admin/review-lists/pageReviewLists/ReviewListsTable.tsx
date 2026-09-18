import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { AdminTableActions, AdminTableEditLink } from '@/components/admin/AdminTableActions'
import type { getReviewListsForAdmin } from '@/server/review-lists/queries/getReviewListsForAdmin.server'

type ReviewListRow = Awaited<ReturnType<typeof getReviewListsForAdmin>>[number]

type Props = {
  lists: ReviewListRow[]
}

const header = [
  'Name',
  'Regionen',
  'Einträge',
  { id: 'actions', label: 'Aktionen', srOnly: true, align: 'right' as const },
]

export const ReviewListsTable = ({ lists }: Props) => (
  <AdminTable header={header}>
    {lists.map((list) => (
      <tr key={list.id}>
        <th scope="row" className={adminTableClasses.thRow}>
          {list.name}
        </th>
        <td className={adminTableClasses.td}>
          {list.regionSlugs.length === 0 ? (
            <span className="text-gray-400">—</span>
          ) : (
            list.regionSlugs.join(', ')
          )}
        </td>
        <td className={adminTableClasses.td}>{list.entryCount}</td>
        <td className={adminTableClasses.td}>
          <AdminTableActions>
            <AdminTableEditLink
              to="/admin/review-lists/$id/edit"
              params={{ id: String(list.id) }}
            />
          </AdminTableActions>
        </td>
      </tr>
    ))}
  </AdminTable>
)
