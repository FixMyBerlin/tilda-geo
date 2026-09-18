import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { AdminTableActions, AdminTableEditLink } from '@/components/admin/AdminTableActions'
import { buildMapDatasetCategoriesListSearch } from './mapDatasetCategoriesListSearch'

type CategoryRow = {
  id: number
  key: string
  groupKey: string
  categoryKey: string
  sortOrder: number
  title: string
  subtitle: string | null
}

const header = [
  'Sortierung',
  'Kategorie',
  'Titel',
  'Untertitel',
  { id: 'actions', label: 'Aktionen', srOnly: true, align: 'right' as const },
]

export const MapDatasetCategoriesTable = ({
  categories,
  listGroupKey,
}: {
  categories: CategoryRow[]
  listGroupKey?: string
}) => {
  const sections: Array<{ kind: 'group'; groupKey: string } | { kind: 'row'; row: CategoryRow }> =
    []
  let prevGroup: string | null = null
  for (const row of categories) {
    if (row.groupKey !== prevGroup) {
      sections.push({ kind: 'group', groupKey: row.groupKey })
      prevGroup = row.groupKey
    }
    sections.push({ kind: 'row', row })
  }

  return (
    <AdminTable header={header}>
      {sections.map((item) => {
        if (item.kind === 'group') {
          return (
            <tr key={`g:${item.groupKey}`} className={adminTableClasses.groupRow}>
              <th
                colSpan={header.length}
                scope="colgroup"
                className={adminTableClasses.groupHeader}
              >
                {item.groupKey}
              </th>
            </tr>
          )
        }
        const row = item.row
        const subtitlePreview =
          row.subtitle && row.subtitle.length > 80 ? `${row.subtitle.slice(0, 80)}…` : row.subtitle
        return (
          <tr key={row.id}>
            <td className={adminTableClasses.td}>{row.sortOrder}</td>
            <td className={adminTableClasses.td}>
              <code className="text-xs text-gray-700">{row.categoryKey}</code>
            </td>
            <td className={adminTableClasses.td}>{row.title}</td>
            <td className={adminTableClasses.td} title={row.subtitle ?? undefined}>
              <span className="line-clamp-2 max-w-md text-gray-600">{subtitlePreview || '—'}</span>
            </td>
            <td className={adminTableClasses.td}>
              <AdminTableActions>
                <AdminTableEditLink
                  to="/admin/map-dataset-categories/$categoryKey"
                  params={{ categoryKey: row.key }}
                  search={buildMapDatasetCategoriesListSearch(listGroupKey)}
                />
              </AdminTableActions>
            </td>
          </tr>
        )
      })}
    </AdminTable>
  )
}
