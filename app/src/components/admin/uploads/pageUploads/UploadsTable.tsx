import { adminBulletedListClassName } from '@/components/admin/adminListClasses'
import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { Link } from '@/components/shared/links/Link'
import { Pill } from '@/components/shared/text/Pill'
import type { MetaData } from '@/scripts/StaticDatasets/types'
import type { TUpload } from '@/server/uploads/queries/getUploads.server'

type ConfigItem = MetaData['configs'][number]

export const UploadsTable = ({ uploads }: { uploads: TUpload[] }) => {
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
                {Array.isArray(upload.configs) &&
                  (upload.configs as unknown as MetaData['configs']).map((config: ConfigItem) => {
                    const { name, category } = config
                    return (
                      <li key={name}>
                        {name} — Category: {category || '-'}
                      </li>
                    )
                  })}
              </ul>
            </td>
            <td className={adminTableClasses.td}>
              <Link to="/admin/uploads/$slug" params={{ slug: upload.slug }}>
                Details
              </Link>
            </td>
          </tr>
        )
      })}
    </AdminTable>
  )
}
