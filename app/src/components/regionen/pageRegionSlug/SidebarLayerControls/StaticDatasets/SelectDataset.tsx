import { LockClosedIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import { useDataParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useDataParam'
import type { RegionDataset } from '@/server/uploads/queries/getUploadsForRegion.server'
import { createSourceKeyStaticDatasets } from '../../utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { DatasetInfoPanel } from './DatasetInfoPanel'

export const SelectDataset = ({ dataset }: { dataset: RegionDataset }) => {
  const key = createSourceKeyStaticDatasets(dataset.id, dataset.subId)
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
          <span>{dataset.name}</span>
          {!dataset.public && (
            <LockClosedIcon
              className="size-4 flex-none text-gray-400"
              title="Datensatz nur für angemeldete Nutzer:innen mit Rechten für die Region sichtbar."
            />
          )}
        </div>
      </button>
      {selected && <DatasetInfoPanel dataset={dataset} />}
    </li>
  )
}
