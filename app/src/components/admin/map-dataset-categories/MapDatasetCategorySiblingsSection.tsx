import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import { Link } from '@/components/shared/links/Link'

type StaticDatasetSiblingRow = {
  key: string
  categoryKey: string
  sortOrder: number
  title: string
}

type Props = {
  id: string
  title: string
  groupKey: string
  rows: StaticDatasetSiblingRow[]
}

/** Other categories in the same group — helps keep sort order and naming consistent. */
export function MapDatasetCategorySiblingsSection({ id, title, groupKey, rows }: Props) {
  return (
    <AdminFormSection
      id={id}
      title={title}
      description={`Gruppe „${groupKey}“ (wie in den Upload-Konfigurationen).`}
    >
      {rows.length === 0 ? (
        <AdminEmptyState bare>Keine weiteren Kategorien in dieser Gruppe.</AdminEmptyState>
      ) : (
        <AdminTable header={['Sortierung', 'Kategorie', 'Titel']}>
          {rows.map((row) => (
            <tr key={row.key}>
              <td className={adminTableClasses.td}>{row.sortOrder}</td>
              <td className={adminTableClasses.td}>
                <Link
                  to="/admin/map-dataset-categories/$categoryKey"
                  params={{ categoryKey: row.key }}
                  blank
                  classNameOverwrite="font-mono text-sm font-medium text-yellow-800 underline hover:text-yellow-950"
                >
                  {row.categoryKey}
                </Link>
              </td>
              <td className={adminTableClasses.td}>{row.title}</td>
            </tr>
          ))}
        </AdminTable>
      )}
    </AdminFormSection>
  )
}
