import { LinkExternal } from '@/src/app/_components/links/LinkExternal'
import { Markdown } from '@/src/app/_components/text/Markdown'
import { isProd } from '@/src/app/_components/utils/isEnv'
import { CheckIcon, LockClosedIcon } from '@heroicons/react/20/solid'
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
  } = dataset
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
          'relative w-full cursor-pointer select-none py-2 pl-1.5 pr-2 text-left leading-tight text-gray-900',
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
        <div className="border-2 border-t-0 border-yellow-400 bg-yellow-100 px-1.5 pb-1.5 pt-1 text-xs leading-4 prose-a:underline-offset-1">
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
                    className="group relative mt-1 flex items-center font-normal leading-tight"
                    key={legend.id}
                  >
                    <div className="h-5 w-5 flex-none">{iconFromLegend(legend)}</div>
                    <LegendNameDesc name={legend.name} desc={legend.desc} />
                  </li>
                )
              })}
            </ul>
          )}
          {!isProd && githubUrl && (
            <p>
              <LinkExternal
                blank
                href={githubUrl}
                className="text-pink-500 hover:text-pink-800"
                title='Öffne den Datensatz im "tilda-static-data" Repository auf GitHub; Link nur in Dev und Staging sichtbar.'
              >
                Github Statische Daten
              </LinkExternal>
            </p>
          )}
        </div>
      )}
    </li>
  )
}
