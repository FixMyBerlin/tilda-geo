import { LinkExternal } from '@/src/app/_components/links/LinkExternal'
import {
  Formats,
  ogrFormats,
} from '@/src/app/api/export-ogr/[regionSlug]/[tableName]/_utils/ogrFormats.const'
import { useMemo } from 'react'
import { getExportOgrApiBboxUrl } from '../../../../_components/utils/getExportApiUrl'
import { exports } from '../../_mapData/mapDataSources/exports/exports.const'
import { SourcesId } from '../../_mapData/mapDataSources/sources.const'
import { getCategoryData, getSourceData } from '../../_mapData/utils/getMapDataUtils'
import { useRegion } from '../regionUtils/useRegion'
import { useRegionSlug } from '../regionUtils/useRegionSlug'

export const DownloadModalDownloadList = () => {
  const regionSlug = useRegionSlug()

  const { bbox, exports: regionExports } = useRegion()
  if (regionExports === null) return null
  const availableExports = exports.filter((exportData) => regionExports.includes(exportData.id))

  return (
    <ul className="mb-2 divide-y divide-gray-200 border-y border-gray-200">
      {availableExports.map((exportData) => {
        return (
          <li key={exportData.id} className="pb-4 pt-5">
            <h3 className="mb-1 text-sm font-bold text-purple-800">{exportData.title}:</h3>

            <table className="my-2 text-sm text-gray-500">
              <tbody>
                <tr>
                  <th className="w-24 align-top text-xs font-medium text-gray-900">
                    Beschreibung:
                  </th>
                  <td className="pl-2">{exportData.desc}</td>
                </tr>
                <tr>
                  <th className="w-24 align-top text-xs font-medium text-gray-900">Attribution:</th>
                  <td
                    className="pl-2"
                    dangerouslySetInnerHTML={{
                      __html:
                        exportData.attributionHtml !== 'todo' ? exportData.attributionHtml : '',
                    }}
                  />
                </tr>
                <tr>
                  <th className="w-24 align-top text-xs font-medium text-gray-900">Lizenz:</th>
                  <td className="pl-2">{exportData.licence}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex flex-wrap gap-2">
              {Object.entries(ogrFormats).map(([param, name]) => {
                return (
                  <LinkExternal
                    key={param}
                    href={getExportOgrApiBboxUrl(
                      regionSlug!,
                      exportData.id,
                      bbox,
                      param as Formats,
                    )}
                    classNameOverwrite="w-28 flex-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm hover:bg-yellow-50 focus:ring-1 focus:ring-yellow-500"
                    download
                    blank
                  >
                    <strong className="mb-0.5 block text-xs font-medium text-gray-500">
                      Download
                    </strong>
                    <span className="block w-full border-0 p-0 font-mono text-gray-900 focus:ring-0 sm:text-sm">
                      {name}
                    </span>
                  </LinkExternal>
                )
              })}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

const VectorTileUrlsSection = () => {
  const region = useRegion()

  // Collect all unique sources from region categories
  const vectorTileSources = useMemo(() => {
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
      } catch (error) {
        // Skip sources that don't exist (e.g., mapillary sources, static datasets)
        // These are not in sources.const but may be referenced in categories
      }
    })

    return Array.from(sourceMap.values())
  }, [region.categories])

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
              <div className="break-all font-mono text-xs text-gray-600">{source.tiles}</div>
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}

export const DownloadModalDownloadListWithVectorTiles = () => {
  // Get the bbox and allowed exports from our region data
  const { exports: regionExports } = useRegion()
  if (regionExports === null) return null

  return (
    <>
      <DownloadModalDownloadList />
      <VectorTileUrlsSection />
    </>
  )
}
