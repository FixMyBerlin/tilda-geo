import { LinkExternal } from '@/src/app/_components/links/LinkExternal'
import {
  Formats,
  ogrFormats,
} from '@/src/app/api/export-ogr/[regionSlug]/[tableName]/_utils/ogrFormats.const'
import { getExportOgrApiBboxUrl } from '../../../../_components/utils/getExportApiUrl'
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

            <div className="flex flex-wrap gap-2">
              {Object.entries(ogrFormats).map(([param, name]) => {
                return (
                  <LinkExternal
                    key={param}
                    href={getExportOgrApiBboxUrl(
                      regionSlug!,
                      sourceData.export.apiIdentifier!,
                      bbox,
                      param as Formats,
                    )}
                    className="text-xs"
                    download
                    blank
                  >
                    {name}
                  </LinkExternal>
                )
              })}
            </div>
            <div className="mt-2">
              <div className="rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                <label
                  htmlFor={sourceData.id}
                  className="mb-0.5 block text-[10px] font-medium text-gray-700"
                >
                  Vector Tile URL
                </label>
                <input
                  type="text"
                  name={sourceData.id}
                  id={sourceData.id}
                  className="block w-full border-0 p-0 font-mono text-xs text-gray-500 placeholder-gray-400 focus:ring-0"
                  placeholder="Vector Tile URL"
                  defaultValue={sourceData.tiles}
                  onFocus={(event) => event.target.select()}
                  readOnly
                />
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
