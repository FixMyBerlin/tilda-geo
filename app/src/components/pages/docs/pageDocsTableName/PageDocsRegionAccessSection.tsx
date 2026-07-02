import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { twMerge } from 'tailwind-merge'
import { OgrFormatDownloadLinks } from '@/components/regionen/pageRegionSlug/DownloadModal/OgrFormatDownloadLinks'
import type { SourceExportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import { RegionTitleStatusIcon } from '@/components/regionen/regionMeta/RegionTitleStatusIcon'
import { Link } from '@/components/shared/links/Link'
import { DOCS_PAGE_SECTION_H2_CLASSNAME, DOCS_PAGE_SECTION_IDS } from './docsSectionIds.const'
import { deriveRegionDatasetsFromCategories } from './regionDatasetsFromCategories'
import type { DocsPageRegion } from './types'

type Props = {
  region: NonNullable<DocsPageRegion>
  regionSlug: string
  tableName: SourceExportApiIdentifier
  hasDownloadPermissions: boolean
  showDownloads: boolean
}

export const PageDocsRegionAccessSection = ({
  region,
  regionSlug,
  tableName,
  hasDownloadPermissions,
  showDownloads,
}: Props) => {
  const regionDatasets = deriveRegionDatasetsFromCategories(region)

  return (
    <section
      className="relative mt-12 rounded-lg border border-gray-300 bg-gray-50/80 p-4 print:hidden"
      aria-labelledby={DOCS_PAGE_SECTION_IDS.regionAccess}
    >
      <div className="absolute top-3 right-3">
        <RegionTitleStatusIcon status={region.status} />
      </div>

      <h2
        className={twMerge(DOCS_PAGE_SECTION_H2_CLASSNAME, 'mt-0 mb-2')}
        id={DOCS_PAGE_SECTION_IDS.regionAccess}
      >
        {region.fullName}
      </h2>

      <p className="mt-3">
        <Link to="/regionen/$regionSlug" params={{ regionSlug }} button>
          Zur Region
        </Link>
      </p>

      {regionDatasets.length > 0 ? (
        <div className="mt-6">
          <h3 className="mb-1 text-sm font-medium text-gray-900">Verfügbare Datensätze</h3>
          <div className="not-prose text-sm text-gray-500">
            {regionDatasets.map((dataset, index) => (
              <span key={dataset.tableName}>
                {index > 0 ? <span className="text-gray-400">, </span> : null}
                <Link
                  to="/docs/$tableName"
                  params={{ tableName: dataset.tableName }}
                  search={{ r: regionSlug }}
                  className="whitespace-nowrap"
                >
                  {dataset.label}
                </Link>
                {hasDownloadPermissions && dataset.isDownloadable ? (
                  <ArrowDownTrayIcon
                    className="ml-0.5 inline-flex size-3 align-text-bottom text-gray-500"
                    aria-hidden
                  />
                ) : null}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {showDownloads && region.bbox ? (
        <>
          <h2
            className={twMerge(
              DOCS_PAGE_SECTION_H2_CLASSNAME,
              'mt-6 mb-1 text-sm font-medium text-gray-900',
            )}
            id={DOCS_PAGE_SECTION_IDS.downloads}
          >
            Downloads
          </h2>
          <div className="not-prose flex flex-wrap gap-2">
            <OgrFormatDownloadLinks
              regionSlug={region.slug}
              tableName={tableName}
              bbox={region.bbox}
            />
          </div>
        </>
      ) : null}
    </section>
  )
}
