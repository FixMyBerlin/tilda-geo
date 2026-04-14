import type { SourceExportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import { Link } from '@/components/shared/links/Link'
import { getExportOgrApiBboxUrl } from '@/components/shared/utils/getExportApiUrl'
import type { StaticRegion } from '@/data/regions.const'
import type { Formats } from '@/server/api/export/ogrFormats.const'
import { ogrFormats } from '@/server/api/export/ogrFormats.const'

export const downloadFormatLinkClasses =
  'min-w-28 w-max flex-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-left shadow-sm hover:bg-yellow-50 focus:ring-1 focus:ring-yellow-500'

type Props = {
  regionSlug: string
  tableName: SourceExportApiIdentifier
  bbox: NonNullable<StaticRegion['bbox']>
}

export const OgrFormatDownloadLinks = ({ regionSlug, tableName, bbox }: Props) => {
  return (
    <>
      {Object.entries(ogrFormats).map(([param, format]) => (
        <Link
          key={param}
          href={getExportOgrApiBboxUrl(regionSlug, tableName, bbox, param as Formats)}
          classNameOverwrite={downloadFormatLinkClasses}
          download
          blank
        >
          <strong className="mb-0.5 block text-xs font-medium text-gray-500">Download</strong>
          <span className="block border-0 p-0 font-mono text-gray-900 focus:ring-0 sm:text-sm">
            {format.driver}
          </span>
        </Link>
      ))}
    </>
  )
}
