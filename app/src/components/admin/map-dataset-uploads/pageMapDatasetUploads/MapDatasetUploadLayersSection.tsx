import { AdminTable, adminTableClasses } from '@/components/admin/AdminTable'
import { AdminTableExternalLink } from '@/components/admin/AdminTableActions'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import { createSourceKeyStaticDatasets } from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'

type LayerConfig = { id: number; name: string; subId: string | null; categoryKey: string | null }
type Region = { id: number; slug: string }

type Props = {
  id: string
  title: string
  uploadSlug: string
  layerConfigs: LayerConfig[]
  regions: Region[]
}

/** „Ansichten“ — the upload's layer configs, with quick links to open each in its regions' maps. */
export const MapDatasetUploadLayersSection = ({
  id,
  title,
  uploadSlug,
  layerConfigs,
  regions,
}: Props) => (
  <AdminFormSection id={id} title={title}>
    <AdminTable header={['Ansicht', 'Kategorie', 'In Region öffnen']}>
      {layerConfigs.map((layerConfig) => {
        const sourceKey = createSourceKeyStaticDatasets(uploadSlug, layerConfig.subId ?? undefined)
        return (
          <tr key={layerConfig.id}>
            <th scope="row" className={adminTableClasses.thRow}>
              {layerConfig.name}
            </th>
            <td className={adminTableClasses.td}>
              {layerConfig.categoryKey ? (
                <code className="text-xs text-gray-700">{layerConfig.categoryKey}</code>
              ) : (
                '—'
              )}
            </td>
            <td className={adminTableClasses.td}>
              {regions.length === 0 ? (
                '—'
              ) : (
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {regions.map((region) => (
                    <AdminTableExternalLink
                      key={region.id}
                      href={`/regionen/${region.slug}?data=${sourceKey}&debugMap=true`}
                    >
                      {region.slug}
                    </AdminTableExternalLink>
                  ))}
                </div>
              )}
            </td>
          </tr>
        )
      })}
    </AdminTable>
  </AdminFormSection>
)
