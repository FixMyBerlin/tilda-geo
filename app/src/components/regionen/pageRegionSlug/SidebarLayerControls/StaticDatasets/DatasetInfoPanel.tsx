import { ArrowDownTrayIcon } from '@heroicons/react/20/solid'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { useIsAdmin } from '@/components/shared/hooks/useIsAdmin'
import { Link } from '@/components/shared/links/Link'
import { Markdown } from '@/components/shared/text/Markdown'
import { getStaticDatasetUrl } from '@/components/shared/utils/getStaticDatasetUrl'
import type { RegionDataset } from '@/server/uploads/queries/getUploadsForRegion.server'
import { createSourceKeyStaticDatasets } from '../../utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { staticDatasetDisplayName } from '../../utils/staticDatasetDisplayName'
import { LEGEND_COMPACT_THRESHOLD, LegendItems } from '../Legend/Legend'
import { DatasetInfoRow } from './DatasetInfoRow'

type Props = {
  dataset: RegionDataset
  /** Shown first in the panel, e.g. the style radio buttons of a style group. */
  children?: ReactNode
}

/** The yellow info panel below an active static dataset. */
export const DatasetInfoPanel = ({ dataset, children }: Props) => {
  const {
    id,
    subId,
    dataUpdatedNote,
    description,
    dataSourceMarkdown,
    attributionHtml,
    licence,
    licenceOsmCompatible,
    legends,
    githubUrl,
    geojsonUrl,
    pmtilesUrl,
  } = dataset
  const userIsAdmin = useIsAdmin()
  const key = createSourceKeyStaticDatasets(id, subId)
  const displayName = staticDatasetDisplayName(dataset)
  const [adminOpen, setAdminOpen] = useState(false)
  const showDownloadLink = dataset.hideDownloadLink === false && Boolean(geojsonUrl)

  return (
    <div className="flex flex-col gap-2 border-2 border-t-0 border-yellow-400 bg-yellow-100 px-1.5 pt-1.5 pb-1.5 text-xs leading-4 prose-a:underline-offset-1">
      {children}
      {description &&
        (description.includes('(!)') ? (
          // Warnings stay fully visible.
          <Markdown markdown={description} className="text-xs leading-4 text-red-500" />
        ) : (
          <DatasetInfoRow storeKey={`${key}:description`} lines={2}>
            <Markdown markdown={description} className="text-xs leading-4" />
          </DatasetInfoRow>
        ))}
      <div className="flex flex-col gap-1">
        {dataUpdatedNote && (
          <DatasetInfoRow storeKey={`${key}:updated`} label="Stand">
            {dataUpdatedNote}
          </DatasetInfoRow>
        )}
        {dataSourceMarkdown && (
          <DatasetInfoRow storeKey={`${key}:source`} label="Quelle">
            <Markdown markdown={dataSourceMarkdown} className="text-xs leading-4" />
          </DatasetInfoRow>
        )}
        {attributionHtml && (
          <DatasetInfoRow storeKey={`${key}:attribution`} label="Attribution">
            <p
              // oxlint-disable-next-line react/no-danger -- attribution from dataset config
              dangerouslySetInnerHTML={{ __html: attributionHtml }}
            />
          </DatasetInfoRow>
        )}
        {licence && (
          <DatasetInfoRow storeKey={`${key}:licence`} label="Lizenz">
            {licence}
            {licenceOsmCompatible === 'licence' && ' (OSM-kompatibel)'}
            {licenceOsmCompatible === 'waiver' && ' (OSM kompatible Zusatzvereinbarung)'}
            {licenceOsmCompatible === 'no' && ' (nicht OSM kompatibel)'}
          </DatasetInfoRow>
        )}
        {legends && legends.length > 0 && (
          <DatasetInfoRow
            storeKey={key}
            label="Legende"
            canToggle={legends.length > LEGEND_COMPACT_THRESHOLD}
          >
            <LegendItems legendKey={key} legends={legends} showToggle={false} />
          </DatasetInfoRow>
        )}
        {(showDownloadLink || userIsAdmin) && (
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span className="w-17 shrink-0 text-gray-500">{showDownloadLink && 'Download'}</span>
            <div className="min-w-0">
              {showDownloadLink && (
                <Link
                  href={getStaticDatasetUrl(id, 'geojson')}
                  download={`${displayName}.geojson`}
                  className="inline-flex items-center gap-1"
                >
                  <ArrowDownTrayIcon className="size-3 shrink-0" />
                  GeoJSON
                </Link>
              )}
            </div>
            {userIsAdmin && (
              <button
                type="button"
                onClick={() => setAdminOpen(!adminOpen)}
                aria-expanded={adminOpen}
                title={adminOpen ? 'Admin-Details schließen' : 'Admin-Details öffnen'}
                className={twJoin(
                  'ml-auto shrink-0 cursor-pointer rounded-full px-1.5 text-[11px] leading-4 font-semibold text-pink-950',
                  adminOpen ? 'bg-pink-400' : 'bg-pink-300 hover:bg-pink-400',
                )}
              >
                Admin
              </button>
            )}
          </div>
        )}
      </div>
      {userIsAdmin && adminOpen && (
        <div className="flex flex-col gap-1 rounded-sm border border-pink-300 bg-pink-50 p-1.5">
          <Link blank to="/admin/map-dataset-uploads/$slug" params={{ slug: id }}>
            DB-Config
          </Link>

          <Link blank href={githubUrl}>
            Datensatz in Github
          </Link>

          {dataset.hideDownloadLink === true && geojsonUrl && (
            <Link
              href={getStaticDatasetUrl(id, 'geojson')}
              download={`${displayName}.geojson`}
              className="inline-flex items-center gap-1"
            >
              <ArrowDownTrayIcon className="size-3" />
              GeoJSON herunterladen
            </Link>
          )}

          {geojsonUrl && (
            <Link
              href={getStaticDatasetUrl(id, 'csv')}
              download={`${displayName}.csv`}
              className="inline-flex items-center gap-1"
            >
              <ArrowDownTrayIcon className="size-3" />
              CSV herunterladen (Beta)
            </Link>
          )}

          {geojsonUrl && (
            <div className="flex flex-col gap-1">
              <label htmlFor={`geojson-url-${id}`} className="text-xs text-pink-700">
                GeoJSON URL:
              </label>
              <input
                id={`geojson-url-${id}`}
                type="text"
                value={getStaticDatasetUrl(id, 'geojson')}
                readOnly
                className="inline-block w-full rounded-xs border-pink-500 px-0.5 py-0 text-xs text-pink-500"
              />
            </div>
          )}

          {pmtilesUrl && (
            <div className="flex flex-col gap-1">
              <label htmlFor={`pmtiles-url-${id}`} className="text-xs text-pink-700">
                PMTiles URL:
              </label>
              <input
                id={`pmtiles-url-${id}`}
                type="text"
                value={getStaticDatasetUrl(id, 'pmtiles')}
                readOnly
                className="inline-block w-full rounded-xs border-pink-500 px-0.5 py-0 text-xs text-pink-500"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
