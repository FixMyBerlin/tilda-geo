import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { AdminTableActions, AdminTableExternalLink } from '@/components/admin/AdminTableActions'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import { RemoveUploadRegionButton } from './RemoveUploadRegionButton'

type Props = {
  id: string
  title: string
  uploadSlug: string
  regions: { id: number; slug: string }[]
}

export const MapDatasetUploadRegionsSection = ({ id, title, uploadSlug, regions }: Props) => (
  <AdminFormSection id={id} title={title}>
    {regions.length === 0 ? (
      <AdminEmptyState bare>Keine Regionen zugeordnet.</AdminEmptyState>
    ) : (
      <AdminTable
        header={['Region', { id: 'actions', label: 'Aktionen', srOnly: true, align: 'right' }]}
      >
        {regions.map((region) => (
          <tr key={region.id}>
            <th scope="row" className={adminTableClasses.thRow}>
              {region.slug}
            </th>
            <td className={adminTableClasses.td}>
              <AdminTableActions>
                <AdminTableExternalLink
                  to="/regionen/$regionSlug"
                  params={{ regionSlug: region.slug }}
                >
                  Karte
                </AdminTableExternalLink>
                <RemoveUploadRegionButton uploadSlug={uploadSlug} regionSlug={region.slug} />
              </AdminTableActions>
            </td>
          </tr>
        ))}
      </AdminTable>
    )}
  </AdminFormSection>
)
