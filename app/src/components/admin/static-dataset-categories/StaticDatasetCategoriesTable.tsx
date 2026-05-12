import { adminTableClasses } from '@/components/admin/AdminTable'
import { Link } from '@/components/shared/links/Link'

type CategoryRow = {
  id: number
  key: string
  groupKey: string
  categoryKey: string
  sortOrder: number
  title: string
  subtitle: string | null
}

export const StaticDatasetCategoriesTable = ({ categories }: { categories: CategoryRow[] }) => {
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
    <div className="mt-6">
      <table className={adminTableClasses.table}>
        <thead>
          <tr className={adminTableClasses.headRow}>
            {['Sortierung', 'Kategorie', 'Titel', 'Untertitel', ''].map((cell) => (
              <th key={cell} scope="col" className={adminTableClasses.th}>
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={adminTableClasses.body}>
          {sections.map((item) => {
            if (item.kind === 'group') {
              return (
                <tr key={`g:${item.groupKey}`} className="bg-gray-100/90">
                  <th
                    colSpan={5}
                    scope="colgroup"
                    className="px-3 py-2 text-left text-xs font-semibold tracking-wide text-gray-600 uppercase"
                  >
                    {item.groupKey}
                  </th>
                </tr>
              )
            }
            const row = item.row
            const subtitlePreview =
              row.subtitle && row.subtitle.length > 80
                ? `${row.subtitle.slice(0, 80)}…`
                : row.subtitle
            return (
              <tr key={row.id}>
                <td className={adminTableClasses.td}>{row.sortOrder}</td>
                <td className={adminTableClasses.td}>
                  <code className="text-xs text-gray-700">{row.categoryKey}</code>
                </td>
                <td className={adminTableClasses.td}>{row.title}</td>
                <td className={adminTableClasses.td} title={row.subtitle ?? undefined}>
                  <span className="line-clamp-2 max-w-md text-gray-600">
                    {subtitlePreview || '—'}
                  </span>
                </td>
                <td className={adminTableClasses.td}>
                  <Link
                    to="/admin/static-dataset-categories/$categoryKey"
                    params={{ categoryKey: row.key }}
                  >
                    Bearbeiten
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
