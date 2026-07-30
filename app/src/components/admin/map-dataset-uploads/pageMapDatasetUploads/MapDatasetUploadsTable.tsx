import { adminBulletedListClassName } from '@/components/admin/adminListClasses'
import { AdminViewActionLink } from '@/components/admin/adminPageTitle'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { Pill } from '@/components/shared/text/Pill'
import type { TUpload } from '@/server/uploads/queries/getUploads.server'

export const MapDatasetUploadsTable = ({ uploads }: { uploads: TUpload[] }) => {
  return (
    <AdminTable header={['Slug', 'Zugriff', 'Regionen', 'Ansichten', '']}>
      {uploads.map((upload) => {
        return (
          <tr key={upload.id}>
            <td className={adminTableClasses.td}>
              <strong>{upload.slug}</strong>
            </td>
            <td className={adminTableClasses.td}>
              {upload.public ? (
                <Pill color="purple">Public</Pill>
              ) : (
                <Pill color="green">Login</Pill>
              )}
            </td>
            <td className={adminTableClasses.td}>
              <ul className={adminBulletedListClassName}>
                {upload.regions.map((region) => (
                  <li key={region.slug}>{region.slug}</li>
                ))}
              </ul>
            </td>
            <td className={adminTableClasses.td}>
              <ul className={adminBulletedListClassName}>
                {upload.layerConfigs.map((layerConfig) => (
                  <li key={layerConfig.id}>
                    {layerConfig.name} — Category: {layerConfig.categoryKey || '-'}
                  </li>
                ))}
              </ul>
            </td>
            <td className={adminTableClasses.td}>
              <AdminViewActionLink
                to="/admin/map-dataset-uploads/$slug"
                params={{ slug: upload.slug }}
              />
            </td>
          </tr>
        )
      })}
    </AdminTable>
  )
}
