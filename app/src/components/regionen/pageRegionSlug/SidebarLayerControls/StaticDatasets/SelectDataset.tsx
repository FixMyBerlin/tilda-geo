import { ArrowDownTrayIcon, CheckIcon, LockClosedIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import { useDataParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useDataParam'
import { useIsAdmin } from '@/components/shared/hooks/useIsAdmin'
import { Link } from '@/components/shared/links/Link'
import { Markdown } from '@/components/shared/text/Markdown'
import { getStaticDatasetUrl } from '@/components/shared/utils/getStaticDatasetUrl'
import type { RegionDataset } from '@/server/uploads/queries/getUploadsForRegion.server'
import { createSourceKeyStaticDatasets } from '../../utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { iconFromLegend } from '../Legend/Legend'
import { LegendNameDesc } from '../Legend/LegendNameDesc'

export const SelectDataset = ({ dataset }: { dataset: RegionDataset }) => {
  const {
    id,
    subId,
    name,
    updatedAt,
    description,
    dataSourceMarkdown,
    attributionHtml,
    licence,
    licenceOsmCompatible,
    legends,
    isPublic,
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
          'relative w-full cursor-pointer py-2 pr-2 pl-1.5 text-left leading-tight text-gray-900 select-none',
          selected ? 'bg-yellow-400' : 'hover:bg-yellow-50',
        )}
        onClick={handleClick}
      >
        <div className="justify-left relative flex items-center gap-1">
          <CheckIcon
            className={twJoin('size-5 flex-none', selected ? 'text-yellow-900' : 'text-gray-100')}
            aria-hidden="true"
          />
          <div className="flex grow justify-between gap-1 font-medium">
            <span>{name}</span>
            {!isPublic && (
              <LockClosedIcon
                className="h-4 w-4 flex-none text-gray-400"
                title="Datensatz nur für angemeldete Nutzer:innen mit Rechten für die Region sichtbar."
              />
            )}
          </div>
        </div>
        {selected && description && (
          <p className={twJoin('mt-1', description?.includes('(!)') ? 'text-red-400' : '')}>
            {description}
          </p>
        )}
      </button>
      {selected && (
        <div className="flex flex-col gap-3 border-2 border-t-0 border-yellow-400 bg-yellow-100 px-1.5 pt-1 pb-1.5 text-xs leading-4 prose-a:underline-offset-1">
          {(updatedAt || dataSourceMarkdown || attributionHtml) && (
            <div className="flex flex-col gap-1">
              {updatedAt && <p>{updatedAt}</p>}
              {dataSourceMarkdown && (
                <Markdown markdown={dataSourceMarkdown} className="text-xs leading-4" />
              )}
              {attributionHtml && (
                <>
                  <p
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: attribution from dataset config
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
                </>
              )}
            </div>
          )}
          {legends && Boolean(legends?.length) && (
            <ul className="space-y-1.5">
              {legends.map((legend) => {
                return (
                  <li
                    className="group relative flex items-start gap-1.5 leading-tight font-normal"
                    key={legend.id}
                  >
                    <div className="size-3.5 flex-none shrink-0">{iconFromLegend(legend)}</div>
                    <LegendNameDesc name={legend.name} desc={legend.desc} />
                  </li>
                )
              })}
            </ul>
          )}

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
                <Link blank to="/admin/uploads/$slug" params={{ slug: id }}>
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
