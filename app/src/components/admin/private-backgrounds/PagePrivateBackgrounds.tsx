import { getRouteApi } from '@tanstack/react-router'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'

const routeApi = getRouteApi('/admin/private-backgrounds/')

const header = ['Name', 'Slug', 'Zoom', 'Kachelgröße', 'Kachel-URL gesetzt', 'Regionen']

export function PagePrivateBackgrounds() {
  const { sources } = routeApi.useLoaderData()

  return (
    <>
      <AdminPageHeader
        title="Private Hintergrundkarten"
        intro="Hintergrundkarten, deren Kachel-URL einen geheimen Token enthält. Nur angemeldete Mitglieder der zugeordneten Regionen (und Admins) sehen sie; die Kacheln lädt der Server, der Token erreicht den Browser nie. Anlegen, Ändern und Löschen geht nur über das Admin-MCP (private_backgrounds_*); die Kachel-URL wird nirgends wieder ausgegeben."
      />

      {sources.length === 0 ? (
        <AdminEmptyState>Noch keine privaten Hintergrundkarten vorhanden.</AdminEmptyState>
      ) : (
        <AdminTable header={header}>
          {sources.map((source) => (
            <tr key={source.slug}>
              <th scope="row" className={adminTableClasses.thRow}>
                {source.name}
              </th>
              <td className={adminTableClasses.td}>
                <code className="text-xs text-gray-700">{source.slug}</code>
              </td>
              <td className={adminTableClasses.td}>
                {source.minzoom ?? 0}–{source.maxzoom ?? 22}
              </td>
              <td className={adminTableClasses.td}>{source.tileSize} px</td>
              <td className={adminTableClasses.td}>
                {source.tilesUrlChangedAt.toLocaleDateString('de-DE')}
              </td>
              <td className={adminTableClasses.td}>
                {source.regionSlugs.length === 0 ? (
                  <span className="text-gray-400">—</span>
                ) : (
                  source.regionSlugs.join(', ')
                )}
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </>
  )
}
