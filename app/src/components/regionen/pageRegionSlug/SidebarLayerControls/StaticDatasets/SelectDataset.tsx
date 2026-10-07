import { ArrowDownTrayIcon, LockClosedIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import { useDataParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useDataParam'
import { useIsAdmin } from '@/components/shared/hooks/useIsAdmin'
import { Link } from '@/components/shared/links/Link'
import { getStaticDatasetUrl } from '@/components/shared/utils/getStaticDatasetUrl'
import type { RegionDataset } from '@/server/uploads/queries/getUploadsForRegion.server'
import { createSourceKeyStaticDatasets } from '../../utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { LegendItems } from '../Legend/Legend'
import { ReadMore } from './ReadMore'

export const SelectDataset = ({ dataset }: { dataset: RegionDataset }) => {
  const {
    id,
    subId,
    name,
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
  const { dataParam, setDataParam } = useDataParam()
  const selected = dataParam.includes(key)

  const handleClick = () => {
    if (selected) {
      setDataParam(dataParam.filter((param) => param !== key))
    } else {
      setDataParam([...dataParam, key])
    }
  }

  return (
    <li key={key}>
      <button
        type="button"
        className={twJoin(
          'relative w-full cursor-pointer p-2 text-left leading-tight text-gray-900 select-none',
          selected ? 'bg-yellow-400' : 'hover:bg-yellow-50',
        )}
        onClick={handleClick}
        aria-pressed={selected}
      >
        <div className="flex justify-between gap-1 font-medium">
          <span>{name}</span>
          {!dataset.public && (
            <LockClosedIcon
              className="size-4 flex-none text-gray-400"
              title="Datensatz nur für angemeldete Nutzer:innen mit Rechten für die Region sichtbar."
            />
          )}
        </div>
      </button>
      {selected && (
        <div className="flex flex-col gap-3 border-2 border-t-0 border-yellow-400 bg-yellow-100 px-1.5 pt-1.5 pb-1.5 text-xs leading-4 prose-a:underline-offset-1">
          {description && (
            <p className={description.includes('(!)') ? 'text-red-500' : undefined}>
              {description}
            </p>
          )}
          {(dataUpdatedNote || dataSourceMarkdown) && (
            <div className="flex flex-col gap-1">
              {dataUpdatedNote && <p>{dataUpdatedNote}</p>}
              {dataSourceMarkdown && (
                <ReadMore markdown={dataSourceMarkdown} fadeFromClassName="from-yellow-100" />
              )}
            </div>
          )}
          {attributionHtml && (
            <div>
              <p
                // oxlint-disable-next-line react/no-danger -- attribution from dataset config
                dangerouslySetInnerHTML={{ __html: attributionHtml }}
              />
              {licence && (
                <p>
                  Lizenz: {licence}
                  {licenceOsmCompatible === 'licence' && ' (OSM-kompatibel)'}
                  {licenceOsmCompatible === 'waiver' && ' (OSM kompatible Zusatzvereinbarung)'}
                  {licenceOsmCompatible === 'no' && ' (nicht OSM kompatibel)'}
                </p>
              )}
            </div>
          )}
          {legends && Boolean(legends?.length) && <LegendItems legendKey={key} legends={legends} />}
          {dataset.hideDownloadLink === false && geojsonUrl && (
            <Link
              href={getStaticDatasetUrl(id, 'geojson')}
              download={`${name}.geojson`}
              className="inline-flex items-center gap-1"
            >
              <ArrowDownTrayIcon className="size-3" />
              GeoJSON herunterladen
            </Link>
          )}

          {userIsAdmin && (
            <details className="bg-pink-300 p-0.5">
              <summary className="cursor-pointer underline">Admin Upload Details</summary>

              <div className="flex flex-col gap-1">
                <Link blank to="/admin/map-dataset-uploads/$slug" params={{ slug: id }}>
                  DB-Config
                </Link>

                <Link blank href={githubUrl}>
                  Datensatz in Github
                </Link>

                {dataset.hideDownloadLink === true && geojsonUrl && (
                  <Link
                    href={getStaticDatasetUrl(id, 'geojson')}
                    download={`${name}.geojson`}
                    className="inline-flex items-center gap-1"
                  >
                    <ArrowDownTrayIcon className="size-3" />
                    GeoJSON herunterladen
                  </Link>
                )}

                {geojsonUrl && (
                  <Link
                    href={getStaticDatasetUrl(id, 'csv')}
                    download={`${name}.csv`}
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
            </details>
          )}
        </div>
      )}
    </li>
  )
}
