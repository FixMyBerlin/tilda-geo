import { getRouteApi } from '@tanstack/react-router'
import { AdminEditActionLink } from '@/components/admin/adminPageTitle'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { Breadcrumb } from '@/components/admin/Breadcrumb'
import { HeaderWrapper } from '@/components/admin/HeaderWrapper'

const routeApi = getRouteApi('/admin/review-lists/')

export function PageReviewLists() {
  const { lists } = routeApi.useLoaderData()

  return (
    <>
      <HeaderWrapper>
        <Breadcrumb pages={[{ href: '/admin/review-lists', name: 'Prüflisten' }]} />
      </HeaderWrapper>

      <p className="mb-6 text-sm text-gray-500">
        Neue Prüflisten werden in der Region unter Prüflisten angelegt (Mitglieder und Admins).
      </p>

      {lists.length === 0 ? (
        <p className="text-sm text-gray-500">Noch keine Prüflisten angelegt.</p>
      ) : (
        <AdminTable header={['Name', 'Regionen', 'Einträge', { id: 'edit', label: '' }]}>
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
                <AdminEditActionLink
                  to="/admin/review-lists/$id/edit"
                  params={{ id: String(list.id) }}
                />
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </>
  )
}
