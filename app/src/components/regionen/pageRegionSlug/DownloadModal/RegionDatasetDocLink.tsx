import type { SourceExportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import { Link } from '@/components/shared/links/Link'
import { downloadFormatLinkClasses } from './OgrFormatDownloadLinks'

export const docsLinkClassesWithStructuredDocs =
  'min-w-28 w-max flex-none rounded-md border border-purple-800 bg-purple-700 px-3 py-2 text-left shadow-md no-underline hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1'

type Props = {
  regionSlug: string
  tableName: SourceExportApiIdentifier
  hasStructuredDocs: boolean
}

export const RegionDatasetDocLink = ({ regionSlug, tableName, hasStructuredDocs }: Props) => {
  return (
    <Link
      to="/docs/$tableName"
      params={{ tableName }}
      search={{ r: regionSlug }}
      classNameOverwrite={
        hasStructuredDocs ? docsLinkClassesWithStructuredDocs : downloadFormatLinkClasses
      }
    >
      <strong
        className={`mb-0.5 block text-xs font-medium ${hasStructuredDocs ? 'text-purple-200' : 'text-gray-500'}`}
      >
        Attribute
      </strong>
      <span
        className={`block border-0 p-0 font-mono focus:ring-0 sm:text-sm ${hasStructuredDocs ? 'text-white' : 'text-gray-900'}`}
      >
        Dokumentation
      </span>
    </Link>
  )
}
