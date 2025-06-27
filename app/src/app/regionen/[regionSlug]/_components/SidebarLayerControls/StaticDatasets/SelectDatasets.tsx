import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { ChevronDownIcon, ChevronLeftIcon } from '@heroicons/react/20/solid'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { useDataParam } from '../../../_hooks/useQueryState/useDataParam'
import { useRegionDatasets } from '../../../_hooks/useRegionDatasets/useRegionDatasets'
import { staticDatasetCategories } from '../../../_mapData/mapDataStaticDatasetCategories/staticDatasetCategories.const'
import { createSourceKeyStaticDatasets } from '../../utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { SelectDataset } from './SelectDataset'

export const SelectDatasets = ({
  category,
  datasets,
}: {
  category: string
  datasets: ReturnType<typeof useRegionDatasets>
}) => {
  const { dataParam, setDataParam } = useDataParam()
  const [allActive, setAllActive] = useState(false)

  const allDatasetKeysForThisCategory = datasets.map((d) =>
    createSourceKeyStaticDatasets(d.id, d.subId),
  )

  const activateAll = () => {
    const newDataParam = [...dataParam, ...allDatasetKeysForThisCategory]
    setDataParam(newDataParam)
    setAllActive(true)
  }

  const deactivateAll = () => {
    const newDataParam = dataParam.filter((param) => !allDatasetKeysForThisCategory.includes(param))
    setDataParam(newDataParam)
    setAllActive(false)
  }

  const hasFallbackTitle = !Boolean(staticDatasetCategories[category]?.title)
  const categoryTitle = staticDatasetCategories[category]?.title || category
  const categorySubtitle: string | undefined = staticDatasetCategories[category]?.subtitle
  const active = dataParam.some((param) => allDatasetKeysForThisCategory.includes(param))

  return (
    <Disclosure key={category}>
      {({ open }) => (
        <>
          <DisclosureButton className="group flex justify-between border-t border-t-gray-200 text-left hover:bg-yellow-50">
            <div
              className={twJoin(
                'ml-2 flex min-h-[3rem] w-full flex-col items-start text-sm leading-[17px]',
                active ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900',
                hasFallbackTitle ? 'justify-center' : 'justify-start pt-2',
              )}
            >
              <h2 className="font-semibold">{categoryTitle}</h2>
              {categorySubtitle && (
                <p
                  className={twJoin(
                    'mt-0.5 pr-1.5 text-xs leading-3 text-gray-400',
                    open
                      ? ''
                      : 'w-44 min-w-full overflow-hidden overflow-ellipsis whitespace-nowrap',
                  )}
                  title={open ? undefined : categorySubtitle}
                >
                  {categorySubtitle}
                </p>
              )}
            </div>
            <div className="flex min-h-[3rem] flex-none items-center justify-center px-1 text-yellow-500">
              {open ? (
                <ChevronDownIcon className="h-7 w-7" />
              ) : (
                <ChevronLeftIcon className="h-7 w-7" />
              )}
            </div>
          </DisclosureButton>

          <Transition
            show={open}
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <DisclosurePanel static as="section" className="mb-2 mt-1">
              <div className="mx-1 mt-1 flex items-center justify-end gap-1">
                {!allActive && (
                  <button
                    onClick={activateAll}
                    className="rounded-md border border-gray-300 bg-gray-50 px-1 py-0.5 text-xs leading-none shadow-sm hover:bg-yellow-50 focus:ring-1 focus:ring-yellow-500"
                  >
                    Alle aktivieren
                  </button>
                )}
                {active && (
                  <button
                    onClick={deactivateAll}
                    className="rounded-md border border-gray-300 bg-gray-50 px-1 py-0.5 text-xs leading-none shadow-sm hover:bg-yellow-50 focus:ring-1 focus:ring-yellow-500"
                  >
                    Alle deaktivieren
                  </button>
                )}
              </div>
              <ul
                className={twJoin(
                  'py-1 text-sm focus:outline-none',
                  // Style all the hover state of all a-tags inside this element; Helps understand the click target when `attributionHtml` has embedded external links.
                  '[&_a:hover]:underline',
                )}
              >
                {datasets.map((dataset) => {
                  const key = createSourceKeyStaticDatasets(dataset.id, dataset.subId)
                  return <SelectDataset key={key} dataset={dataset} />
                })}
              </ul>
            </DisclosurePanel>
          </Transition>
        </>
      )}
    </Disclosure>
  )
}
