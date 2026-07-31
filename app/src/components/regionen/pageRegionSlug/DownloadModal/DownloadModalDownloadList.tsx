import { useRegionLoaderData } from '@/components/regionen/pageRegionSlug/hooks/useRegionLoaderData'
import { getMapDataSourceTilesUrl } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/getMapDataSourceTilesUrl'
import type { SourcesId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sources.const'
import {
  getCategoryData,
  getSourceData,
} from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import { useRegionSlug } from '../regionUtils/useRegionSlug'
import { OgrFormatDownloadLinks } from './OgrFormatDownloadLinks'
import { RegionDatasetDocLink } from './RegionDatasetDocLink'
import type { RegionModalAccess, RegionModalDataset } from './regionModalAccess'
import { RegionModalDocLinksSection } from './RegionModalDocLinksSection'

type Props = {
  datasets: RegionModalDataset[]
}

const DownloadModalDownloadList = ({ datasets }: Props) => {
  const regionSlug = useRegionSlug()
  const { region } = useRegionLoaderData()
  const { bbox } = region
  if (bbox === null) return null

  return (
    <ul className="mb-2 divide-y divide-gray-200 border-y border-gray-200">
      {datasets.map((dataset) => (
        <li key={dataset.tableName} className="pt-5 pb-4">
          <h3 className="mb-1 text-sm font-bold text-purple-800">{dataset.title}:</h3>

          {dataset.desc || dataset.attributionHtml || dataset.licence ? (
            <table className="my-2 text-sm text-gray-500">
              <tbody>
                {dataset.desc ? (
                  <tr>
                    <th className="w-24 align-top text-xs font-medium text-gray-900">
                      Beschreibung:
                    </th>
                    <td className="pl-2">{dataset.desc}</td>
                  </tr>
                ) : null}
                {dataset.attributionHtml && dataset.attributionHtml !== 'todo' ? (
                  <tr>
                    <th className="w-24 align-top text-xs font-medium text-gray-900">
                      Attribution:
                    </th>
                    <td
                      className="pl-2"
                      // oxlint-disable-next-line react/no-danger -- attribution HTML from dataset config
                      dangerouslySetInnerHTML={{ __html: dataset.attributionHtml }}
                    />
                  </tr>
                ) : null}
                {dataset.licence ? (
                  <tr>
                    <th className="w-24 align-top text-xs font-medium text-gray-900">Lizenz:</th>
                    <td className="pl-2">{dataset.licence}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <RegionDatasetDocLink
              regionSlug={regionSlug}
              tableName={dataset.tableName}
              hasStructuredDocs={dataset.hasStructuredDocs}
            />
            <OgrFormatDownloadLinks regionSlug={regionSlug} tableName={dataset.tableName} />
          </div>
        </li>
      ))}
    </ul>
  )
}

// Category-mapped datasets without export/download; doc links only. Shown below the
// downloadable section when regionModalAccess.showOtherDatasetsSectionInDownloadModal.
const DownloadModalOtherDatasetsSection = ({ datasets }: { datasets: RegionModalDataset[] }) => {
  const regionSlug = useRegionSlug()

  if (datasets.length === 0) return null

  return (
    <section className="mt-6 border-t border-gray-200 pt-6">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">Weitere Datensätze</h3>
      <RegionModalDocLinksSection regionSlug={regionSlug} datasets={datasets} />
    </section>
  )
}

const VectorTileUrlsSection = () => {
  const { region } = useRegionLoaderData()

  // Collect all unique sources from region categories
  // React Compiler automatically memoizes this computation
  const sourceIds = new Set<string>()
  const sourceMap = new Map<string, ReturnType<typeof getSourceData>>()

  // Iterate through all categories in the region
  region.categories.forEach((categoryId) => {
    const categoryData = getCategoryData(categoryId)
    // Iterate through all subcategories
    categoryData.subcategories.forEach((subcategory) => {
      if (subcategory.sourceId) {
        sourceIds.add(subcategory.sourceId)
      }
    })
  })

  // Get source data for each unique source ID
  sourceIds.forEach((sourceId) => {
    // Skip mapillary_coverage
    if (sourceId === 'mapillary_coverage') return
    try {
      const sourceData = getSourceData(sourceId as SourcesId)
      sourceMap.set(sourceId, sourceData)
    } catch {
      // Skip sources that don't exist (e.g., mapillary sources, static datasets)
      // These are not in sources.const but may be referenced in categories
    }
  })

  const vectorTileSources = Array.from(sourceMap.values())

  if (vectorTileSources.length === 0) return null

  return (
    <details className="mt-6 border-t border-gray-200 pt-6">
      <summary className="cursor-pointer text-sm font-semibold text-gray-900 hover:text-gray-700">
        Vector Tile URLs
      </summary>
      <div className="mt-4 space-y-3">
        <p className="text-xs text-gray-500">
          Alle Vector Tile URLs für die in dieser Region verfügbaren Datenquellen:
        </p>
        <ul className="space-y-2">
          {vectorTileSources.map((source) => (
            <li key={source.id} className="rounded-md bg-gray-50 p-3">
              <div className="mb-1 text-xs font-medium text-gray-900">{source.id}</div>
              <div className="font-mono text-xs break-all text-gray-600">
                {getMapDataSourceTilesUrl(source)}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}

// Downloadable exports, optional "Weitere Datensätze", and vector tile URLs — gated by
// regionModalAccess and hasPermissions (vector tiles only for permitted users).
export const DownloadModalDatasetSections = ({
  modalAccess,
  showVectorTiles,
}: {
  modalAccess: RegionModalAccess
  showVectorTiles: boolean
}) => {
  return (
    <>
      {modalAccess.showDownloadableSectionInDownloadModal ? (
        <DownloadModalDownloadList datasets={modalAccess.downloadable} />
      ) : null}
      {modalAccess.showOtherDatasetsSectionInDownloadModal ? (
        <DownloadModalOtherDatasetsSection datasets={modalAccess.other} />
      ) : null}
      {showVectorTiles ? <VectorTileUrlsSection /> : null}
    </>
  )
}
