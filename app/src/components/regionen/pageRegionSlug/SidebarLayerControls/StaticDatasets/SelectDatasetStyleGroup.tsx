import { LockClosedIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import { useDataParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useDataParam'
import { DatasetInfoPanel } from './DatasetInfoPanel'
import {
  activeStyleKey,
  listItemDefaultKey,
  listItemKeys,
  selectStyle,
  type StaticDatasetListItem,
} from './staticDatasetListItems'

type Props = { item: Extract<StaticDatasetListItem, { type: 'styleGroup' }> }

/** One sidebar entry for several configs (styles) of a dataset; one radio button per style. */
export const SelectDatasetStyleGroup = ({ item }: Props) => {
  const { dataParam, setDataParam } = useDataParam()
  const styleKeys = listItemKeys(item)
  const activeKey = activeStyleKey(dataParam, styleKeys)
  const activeStyle = item.styles.find(({ key }) => key === activeKey)
  const isPublic = item.styles.every(({ dataset }) => dataset.public)

  const handleClick = () => {
    if (activeKey) {
      setDataParam(dataParam.filter((param) => !styleKeys.includes(param)))
    } else {
      setDataParam([...dataParam, listItemDefaultKey(item)])
    }
  }

  return (
    <li>
      <button
        type="button"
        className={twJoin(
          'relative w-full cursor-pointer p-2 text-left leading-tight text-gray-900 select-none',
          activeStyle ? 'bg-yellow-400' : 'hover:bg-yellow-50',
        )}
        onClick={handleClick}
        aria-pressed={Boolean(activeStyle)}
      >
        <div className="flex justify-between gap-1 font-medium">
          <span>{item.name}</span>
          {!isPublic && (
            <LockClosedIcon
              className="size-4 flex-none text-gray-400"
              title="Datensatz nur für angemeldete Nutzer:innen mit Rechten für die Region sichtbar."
            />
          )}
        </div>
      </button>
      {activeStyle && (
        <DatasetInfoPanel dataset={activeStyle.dataset}>
          <div role="radiogroup" aria-label={`Stil: ${item.name}`} className="flex flex-col gap-1">
            {item.styles.map(({ key, dataset }) => (
              <label key={key} className="flex cursor-pointer items-start gap-1.5">
                <input
                  type="radio"
                  name={`style-group-${item.key}`}
                  value={key}
                  checked={key === activeKey}
                  onChange={() => setDataParam(selectStyle(dataParam, styleKeys, key))}
                  className="mt-px size-3.5 shrink-0 border-gray-400 text-yellow-600 focus:ring-yellow-500"
                />
                <span className={key === activeKey ? 'font-medium text-gray-900' : 'text-gray-700'}>
                  {dataset.name}
                </span>
              </label>
            ))}
          </div>
        </DatasetInfoPanel>
      )}
    </li>
  )
}
