import { useCategoriesConfig } from '@/src/app/regionen/[regionSlug]/_hooks/useQueryState/useCategoriesConfig/useCategoriesConfig'
import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { ChevronDownIcon, ChevronLeftIcon } from '@heroicons/react/20/solid'
import { produce } from 'immer'
import { Fragment } from 'react'
import { useMapActions } from '../../../_hooks/mapState/useMapState'
import { MapDataCategoryConfig } from '../../../_hooks/useQueryState/useCategoriesConfig/type'
import { SubcategoryCheckbox } from '../Subcategories/SubcategoryCheckbox'
import { SubcategoryDropdown } from '../Subcategories/SubcategoryDropdown'
import { CategoryHeadlineToggle } from './CategoryHeadlineToggle'

type Props = { categoryConfig: MapDataCategoryConfig; active: boolean }

export const CategoryDisclosure = ({ categoryConfig: currCategoryConfig, active }: Props) => {
  const { resetInspectorFeatures } = useMapActions()
  const { categoriesConfig, setCategoriesConfig } = useCategoriesConfig()

  const selectCategory = (categoryId: string) => {
    const newConfig = produce(categoriesConfig, (draft) => {
      const category = draft.find((th) => th.id === categoryId)
      if (category) {
        category.active = !category.active
      }
    })
    void setCategoriesConfig(newConfig)
    resetInspectorFeatures()
  }

  return (
    <Disclosure key={currCategoryConfig.name}>
      {({ open }) => (
        <>
          <header className="flex justify-between border-t border-t-gray-200 first:border-t-transparent">
            <CategoryHeadlineToggle
              active={active}
              handleChange={() => selectCategory(currCategoryConfig.id)}
            >
              <h2 className="font-semibold">{currCategoryConfig.name}</h2>
              <p
                className="mt-0.5 w-44 min-w-full overflow-hidden text-xs leading-3 overflow-ellipsis whitespace-nowrap text-gray-400"
                title={currCategoryConfig.desc}
              >
                {currCategoryConfig.desc}
              </p>
            </CategoryHeadlineToggle>
            <DisclosureButton className="flex flex-none cursor-pointer items-center justify-center border-l border-gray-200 px-1 text-yellow-500 hover:bg-yellow-50">
              {open ? (
                <ChevronDownIcon className="size-7" />
              ) : (
                <ChevronLeftIcon className="size-7" />
              )}
            </DisclosureButton>
          </header>

          <Transition
            show={open}
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <DisclosurePanel static as="nav" className="mt-3 mb-2 space-y-2.5">
              {currCategoryConfig.subcategories?.map((subcat) => {
                const showSpacer = currCategoryConfig.spacerAfter?.has(subcat.id)

                return (
                  <Fragment key={subcat.id}>
                    {subcat.ui === 'dropdown' ? (
                      <SubcategoryDropdown
                        categoryId={currCategoryConfig.id}
                        subcategory={subcat}
                        disabled={!active}
                      />
                    ) : (
                      <SubcategoryCheckbox
                        categoryId={currCategoryConfig.id}
                        subcategory={subcat}
                        disabled={!active}
                      />
                    )}
                    {showSpacer && <hr className="mx-2 my-2.5 border-gray-100" />}
                  </Fragment>
                )
              })}
            </DisclosurePanel>
          </Transition>
        </>
      )}
    </Disclosure>
  )
}
