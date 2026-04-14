import { LockClosedIcon } from '@heroicons/react/24/outline'
import { twMerge } from 'tailwind-merge'
import { OgrFormatDownloadLinks } from '@/components/regionen/pageRegionSlug/DownloadModal/OgrFormatDownloadLinks'
import type { SourceExportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import { Link } from '@/components/shared/links/Link'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { DOCS_PAGE_SECTION_H2_CLASSNAME, DOCS_PAGE_SECTION_IDS } from './docsSectionIds.const'
import type { DocsPageRegion } from './types'

type Props = {
  region: NonNullable<DocsPageRegion>
  regionSlug: string
  tableName: SourceExportApiIdentifier
}

const REGION_ACCESS_TOOLTIP =
  'Nur für angemeldete Nutzer:innen mit Rechten auf der Region zu sehen.'

export const PageDocsRegionAccessSection = ({ region, regionSlug, tableName }: Props) => {
  return (
    <section
      className="relative mt-12 rounded-lg border border-gray-300 bg-gray-50/80 p-4 print:hidden"
      aria-labelledby={DOCS_PAGE_SECTION_IDS.regionAccess}
    >
      <div className="absolute top-3 right-3">
        <Tooltip className="relative" text={REGION_ACCESS_TOOLTIP}>
          <LockClosedIcon className="inline-flex size-5 shrink-0 text-gray-500" aria-hidden />
        </Tooltip>
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

      {region.bbox ? (
        <>
          <h2
            className={twMerge(DOCS_PAGE_SECTION_H2_CLASSNAME, 'mt-6 mb-2')}
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
