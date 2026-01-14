import { Link } from '@/src/app/_components/links/Link'
import { LinkExternal } from '@/src/app/_components/links/LinkExternal'
import { Markdown } from '@/src/app/_components/text/Markdown'
import { getStaticDatasetUrl } from '@/src/app/_components/utils/getStaticDatasetUrl'
import { useCurrentUser } from '@/src/app/_hooks/useCurrentUser'
import { isAdmin } from '@/src/app/_hooks/usersUtils'
import { ArrowDownTrayIcon, CheckIcon, LockClosedIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import { useDataParam } from '../../../_hooks/useQueryState/useDataParam'
import { useRegionDatasets } from '../../../_hooks/useRegionDatasets/useRegionDatasets'
import { createSourceKeyStaticDatasets } from '../../utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { iconFromLegend } from '../Legend/Legend'
import { LegendNameDesc } from '../Legend/LegendNameDesc'

export const SelectDataset = ({
  dataset,
}: {
  dataset: ReturnType<typeof useRegionDatasets>[number]
}) => {
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
  const currentUser = useCurrentUser()
  const userIsAdmin = isAdmin(currentUser)
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
        className={twJoin(
          'relative w-full cursor-pointer py-2 pr-2 pl-1.5 text-left leading-tight text-gray-900 select-none',
          selected ? 'bg-yellow-400' : 'hover:bg-yellow-50',
        )}
        onClick={handleClick}
      >
        <div className="justify-left relative flex items-center gap-1">
          <CheckIcon
            className={twJoin('h-5 w-5 flex-none', selected ? 'text-yellow-900' : 'text-gray-100')}
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
        <div className="prose-a:underline-offset-1 border-2 border-t-0 border-yellow-400 bg-yellow-100 px-1.5 pt-1 pb-1.5 text-xs leading-4">
          {updatedAt && <p>{updatedAt}</p>}
          {dataSourceMarkdown && (
            <Markdown markdown={dataSourceMarkdown} className="text-xs leading-4" />
            // <p className="text-xs leading-4">{dataSourceMarkdown}</p>
          )}
          {attributionHtml && (
            <>
              <p dangerouslySetInnerHTML={{ __html: attributionHtml }} />
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
          {legends && Boolean(legends?.length) && (
            <ul>
              {legends.map((legend) => {
                return (
                  <li
                    className="group relative mt-1 flex items-center leading-tight font-normal"
                    key={legend.id}
                  >
                    <div className="h-5 w-5 flex-none">{iconFromLegend(legend)}</div>
                    <LegendNameDesc name={legend.name} desc={legend.desc} />
                  </li>
                )
              })}
            </ul>
          )}

          {dataset.hideDownloadLink === false && geojsonUrl && (
            <LinkExternal
              href={getStaticDatasetUrl(id, 'geojson')}
              download={`${name}.geojson`}
              className="mt-1 inline-flex items-center gap-1"
            >
              <ArrowDownTrayIcon className="size-3" />
              GeoJSON herunterladen
            </LinkExternal>
          )}

          {userIsAdmin && (
            <details className="mt-1 bg-pink-300 p-0.5">
              <summary className="cursor-pointer underline">Admin Upload Details</summary>

              <div className="flex flex-col gap-1">
                <Link blank href={`/admin/uploads/${id}`}>
                  DB-Config
                </Link>

                <LinkExternal blank href={githubUrl}>
                  Datensatz in Github
                </LinkExternal>

                {dataset.hideDownloadLink === true && geojsonUrl && (
                  <LinkExternal
                    href={getStaticDatasetUrl(id, 'geojson')}
                    download={`${name}.geojson`}
                    className="inline-flex items-center gap-1"
                  >
                    <ArrowDownTrayIcon className="size-3" />
                    GeoJSON herunterladen
                  </LinkExternal>
                )}

                {geojsonUrl && (
                  <LinkExternal
                    href={getStaticDatasetUrl(id, 'csv')}
                    download={`${name}.csv`}
                    className="inline-flex items-center gap-1"
                  >
                    <ArrowDownTrayIcon className="size-3" />
                    CSV herunterladen (Beta)
                  </LinkExternal>
                )}

                {geojsonUrl && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-pink-700">GeoJSON URL:</label>
                    <input
                      type="text"
                      value={getStaticDatasetUrl(id, 'geojson')}
                      readOnly
                      className="inline-block w-full rounded-xs border-pink-500 px-0.5 py-0 text-xs text-pink-500"
                    />
                  </div>
                )}

                {pmtilesUrl && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-pink-700">PMTiles URL:</label>
                    <input
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
