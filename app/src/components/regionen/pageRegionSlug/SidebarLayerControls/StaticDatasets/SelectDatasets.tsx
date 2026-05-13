import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { ChevronDownIcon, ChevronLeftIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import { useDataParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useDataParam'
import type { RegionDataset } from '@/server/uploads/queries/getUploadsForRegion.server'
import { createSourceKeyStaticDatasets } from '../../utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { SelectDataset } from './SelectDataset'

export const SelectDatasets = ({
  category,
  datasets,
}: {
  category: string
  datasets: RegionDataset[]
}) => {
  const { dataParam, setDataParam } = useDataParam()

  const first = datasets[0]
  const categoryTitle = first?.categoryTitle ?? category
  const categorySubtitle = first?.categorySubtitle ?? undefined
  const hasFallbackTitle = category === categoryTitle

  const allDatasetKeysForThisCategory = datasets.map((d) =>
    createSourceKeyStaticDatasets(d.id, d.subId),
  )

  const allCategoryDatasetsInParam =
    allDatasetKeysForThisCategory.length > 0 &&
    allDatasetKeysForThisCategory.every((k) => dataParam.includes(k))

  const activateAll = () => {
    setDataParam([...new Set([...dataParam, ...allDatasetKeysForThisCategory])])
  }

  const deactivateAll = () => {
    setDataParam(dataParam.filter((param) => !allDatasetKeysForThisCategory.includes(param)))
  }

  const active = dataParam.some((param) => allDatasetKeysForThisCategory.includes(param))

  return (
    <Disclosure
      as="div"
      key={category}
      className="w-full border-t border-t-gray-200 first:border-t-transparent"
    >
      {({ open }) => (
        <>
          <DisclosureButton className="group flex w-full justify-between text-left hover:bg-yellow-50">
            <div
              className={twJoin(
                'ml-2 flex min-h-12 flex-col items-start text-sm leading-[17px]',
                active ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900',
                hasFallbackTitle ? 'justify-center' : 'justify-start pt-2',
              )}
            >
              <h2 className="font-semibold">{categoryTitle}</h2>
              {categorySubtitle && (
                <p
                  className={twJoin(
                    'mt-0.5 pr-1.5 text-xs leading-3 text-gray-400',
                    open ? '' : 'w-44 min-w-full overflow-hidden text-ellipsis whitespace-nowrap',
                  )}
                  title={open ? undefined : categorySubtitle}
                >
                  {categorySubtitle}
                </p>
              )}
            </div>
            <div className="flex min-h-12 flex-none items-center justify-center px-1 text-yellow-500">
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
            <DisclosurePanel static as="section" className="mt-1 mb-2">
              <div className="mx-1 mt-1 flex items-center justify-end gap-1">
                {!allCategoryDatasetsInParam && (
                  <button
                    type="button"
                    onClick={activateAll}
                    className="rounded-md border border-gray-300 bg-gray-50 px-1 py-0.5 text-xs leading-none shadow-sm hover:bg-yellow-50 focus:ring-1 focus:ring-yellow-500"
                  >
                    Alle aktivieren
                  </button>
                )}
                {active && (
                  <button
                    type="button"
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
