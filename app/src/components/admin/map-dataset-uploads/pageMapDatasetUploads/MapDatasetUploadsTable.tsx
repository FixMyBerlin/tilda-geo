import { adminBulletedListClassName } from '@/components/admin/adminListClasses'
import { AdminViewActionLink } from '@/components/admin/adminPageTitle'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { buildUploadsListSearch } from '@/components/admin/map-dataset-uploads/pageMapDatasetUploads/mapDatasetUploadsListSearch'
import { Link } from '@/components/shared/links/Link'
import { Pill } from '@/components/shared/text/Pill'
import type { UploadKind } from '@/lib/mapDatasetUploadsSearchSchema'
import type { TUpload } from '@/server/uploads/queries/getUploads.server'

export const MapDatasetUploadsTable = ({
  uploads,
  listKind,
}: {
  uploads: TUpload[]
  listKind?: UploadKind
}) => {
  return (
    <AdminTable header={['Slug', 'Zugriff', 'Regionen', 'Ansichten', '']}>
      {uploads.map((upload) => {
        return (
          <tr key={upload.id}>
            <td className={adminTableClasses.td}>
              <div className="flex flex-wrap items-center gap-2">
                <strong>{upload.slug}</strong>
                {upload.systemLayer ? <Pill color="gray">System</Pill> : null}
              </div>
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
                  <li key={region.slug}>
                    <Link
                      to="/admin/map-dataset-uploads"
                      search={buildUploadsListSearch({
                        kind: listKind,
                        regionSlug: region.slug,
                      })}
                    >
                      {region.slug}
                    </Link>
                  </li>
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
