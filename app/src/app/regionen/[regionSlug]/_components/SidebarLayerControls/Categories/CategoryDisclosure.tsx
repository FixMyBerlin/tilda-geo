import { useCategoriesConfig } from '@/src/app/regionen/[regionSlug]/_hooks/useQueryState/useCategoriesConfig/useCategoriesConfig'
import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { ChevronDownIcon, ChevronLeftIcon } from '@heroicons/react/20/solid'
import { produce } from 'immer'
import { useMapActions } from '../../../_hooks/mapState/useMapState'
import { MapDataCategoryConfig } from '../../../_hooks/useQueryState/useCategoriesConfig/type'
import { SubcategoriesCheckbox } from '../Subcategories/SubcategoriesCheckbox'
import { SubcategoriesDropdown } from '../Subcategories/SubcategoriesDropdown'
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

  const dropdownSubcategories = currCategoryConfig.subcategories?.filter(
    (subcat) => subcat.ui === 'dropdown',
  )
  const checkboxSubcategories = currCategoryConfig.subcategories?.filter(
    (subcat) => subcat.ui === 'checkbox',
  )

  return (
    <Disclosure key={currCategoryConfig.name}>
      {({ open }) => (
        <>
          <div className="flex justify-between border-t border-t-gray-200 first:border-t-transparent">
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
            <DisclosureButton className="flex flex-none items-center justify-center border-l border-gray-200 px-1 text-yellow-500 hover:bg-yellow-50">
              {open ? (
                <ChevronDownIcon className="h-7 w-7" />
              ) : (
                <ChevronLeftIcon className="h-7 w-7" />
              )}
            </DisclosureButton>
          </div>

          <Transition
            show={open}
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <DisclosurePanel static as="nav" className="mt-3 mb-2">
              {Boolean(dropdownSubcategories.length) && (
                <SubcategoriesDropdown
                  categoryId={currCategoryConfig.id}
                  subcategories={dropdownSubcategories}
                  disabled={!active}
                />
              )}
              {Boolean(checkboxSubcategories.length) && (
                <>
                  {Boolean(dropdownSubcategories.length) && <hr className="mx-1.5 mt-3 mb-2 h-1" />}
                  <SubcategoriesCheckbox
                    categoryId={currCategoryConfig.id}
                    subcategories={checkboxSubcategories}
                    disabled={!active}
                  />
                </>
              )}
            </DisclosurePanel>
          </Transition>
        </>
      )}
    </Disclosure>
  )
}
