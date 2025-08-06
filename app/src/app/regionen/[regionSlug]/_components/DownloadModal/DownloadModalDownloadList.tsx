import { LinkExternal } from '@/src/app/_components/links/LinkExternal'
import { ogrFormats } from '@/src/app/api/export-ogr/[regionSlug]/[tableName]/_utils/ogrFormats.const'
import {
  getExportApiBboxUrl,
  getExportOgrApiBboxUrl,
} from '../../../../_components/utils/getExportApiUrl'
import { sources } from '../../_mapData/mapDataSources/sources.const'
import { useRegion } from '../regionUtils/useRegion'
import { useRegionSlug } from '../regionUtils/useRegionSlug'

export const DownloadModalDownloadList = () => {
  const exportEnabledSources = sources.filter((source) => source.export.enabled)

  const regionSlug = useRegionSlug()

  // Get the bbox from our region data
  const { bbox } = useRegion()
  if (!bbox) return null

  return (
    <ul className="mb-2 divide-y divide-gray-200 border-y border-gray-200">
      {exportEnabledSources.map((sourceData) => {
        if (!sourceData.export.apiIdentifier) return null

        return (
          <li key={sourceData.id} className="py-5">
            <h3 className="mb-1 text-sm font-bold text-purple-800">{sourceData.export.title}:</h3>

            <table className="my-2 text-sm text-gray-500">
              <tbody>
                <tr>
                  <th className="w-24 align-top text-xs font-medium text-gray-900">
                    Beschreibung:
                  </th>
                  <td className="pl-2">{sourceData.export.desc}</td>
                </tr>
                <tr>
                  <th className="w-24 align-top text-xs font-medium text-gray-900">Attribution:</th>
                  <td
                    className="pl-2"
                    dangerouslySetInnerHTML={{
                      __html:
                        sourceData.attributionHtml !== 'todo' ? sourceData.attributionHtml : '',
                    }}
                  />
                </tr>
                <tr>
                  <th className="w-24 align-top text-xs font-medium text-gray-900">Lizenz:</th>
                  <td className="pl-2">{sourceData.licence}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex gap-2">
              <LinkExternal
                href={getExportApiBboxUrl(regionSlug!, sourceData.export.apiIdentifier, bbox)}
                classNameOverwrite="w-28 flex-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm hover:bg-yellow-50 focus:ring-1 focus:ring-yellow-500"
                download
                blank
              >
                <strong className="mb-0.5 block text-xs font-medium text-gray-900">
                  Download:
                </strong>
                <span className="block w-full border-0 p-0 font-mono text-gray-500 placeholder-gray-500 focus:ring-0 sm:text-sm">
                  FlatGeoBuf
                </span>
              </LinkExternal>

              <div className="grow rounded-md border border-gray-300 px-3 py-2 shadow-sm focus-within:border-yellow-500 focus-within:ring-1 focus-within:ring-yellow-500">
                <label
                  htmlFor={sourceData.id}
                  className="mb-0.5 block text-xs font-medium text-gray-900"
                >
                  Vector Tile URL:
                </label>
                <input
                  type="text"
                  name={sourceData.id}
                  id={sourceData.id}
                  className="block w-full border-0 p-0 font-mono text-gray-500 placeholder-gray-500 focus:ring-0 sm:text-sm"
                  placeholder="Vector Tile URL"
                  defaultValue={sourceData.tiles}
                  onFocus={(event) => event.target.select()}
                />
              </div>
            </div>
            <div className="mt-1 space-x-3 text-xs">
              <>
                Beta:{' '}
                {Object.entries(ogrFormats).map(([param, name]) => {
                  return (
                    <LinkExternal
                      key={param}
                      href={getExportOgrApiBboxUrl(
                        regionSlug!,
                        sourceData.export.apiIdentifier!,
                        bbox,
                        param as 'geojson' | 'gpkg' | 'fgb',
                      )}
                      className="text-xs"
                      download
                      blank
                    >
                      {name}
                    </LinkExternal>
                  )
                })}
              </>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
