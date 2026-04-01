import { Menu, MenuButton, MenuHeading, MenuItem, MenuItems, MenuSection } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { produce } from 'immer'
import { twJoin } from 'tailwind-merge'
import type { MapDataCategoryConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'
import { useCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/useCategoriesConfig'
import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import { createSubcatStyleKey } from '../../utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import { Legend } from '../Legend/Legend'

type MapDataSubcategoryConfig = MapDataCategoryConfig['subcategories'][number]

type Props = {
  categoryId: MapDataCategoryId
  subcategory: MapDataSubcategoryConfig
  disabled: boolean
}

export const SubcategoryDropdown = ({ categoryId, subcategory, disabled }: Props) => {
  const { categoriesConfig, setCategoriesConfig } = useCategoriesConfig()

  type SelectActiveProps = { subcatId: string; styleId: string }
  const selectActive = ({ subcatId, styleId }: SelectActiveProps) => {
    const oldConfig = categoriesConfig
    const newConfig = produce(oldConfig, (draft) => {
      const subcat = draft
        ?.find((th) => th.id === categoryId)
        ?.subcategories.find((t) => t.id === subcatId)

      if (subcat) {
        const style = subcat.styles.find((s) => s.id === styleId)
        for (const s of subcat.styles) {
          s.active = false
        }
        if (style) style.active = true
      }
    })
    void setCategoriesConfig(newConfig)
  }

  if (!subcategory) return null

  const activeStyleConfig = subcategory.styles.find((s) => s.active)

  const groupedStyles: Map<string, typeof subcategory.styles> = new Map([])
  subcategory.styles.forEach((style) => {
    const category = style?.category || 'fallback'
    if (!groupedStyles.has(category)) {
      groupedStyles.set(category, [])
    }
    groupedStyles.get(category)?.push(style)
  })

  return (
    <fieldset className="overflow-hidden px-2">
      <legend
        className={twJoin(
          'mb-1 text-sm leading-4 font-medium',
          disabled ? 'cursor-not-allowed text-gray-500' : 'cursor-pointer text-gray-900',
        )}
      >
        {subcategory.name}
      </legend>

      <Menu as="div" className="relative inline-block text-left">
        {({ open }) => (
          <>
            <MenuButton
              disabled={disabled}
              // `w-*` has to be set fo the `truncate` to work
              className={twJoin(
                'inline-flex w-50 justify-between rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium shadow-sm',
                open ? 'shadow-md' : '',
                disabled
                  ? 'cursor-not-allowed bg-gray-50 text-gray-400'
                  : 'cursor-pointer bg-white text-gray-700 hover:bg-gray-50 focus:shadow-md focus:outline-none',
              )}
            >
              <div className="flex gap-1 truncate">
                <span className="truncate">{activeStyleConfig?.name}</span>
              </div>
              <ChevronDownIcon className="-mr-1 ml-0.5 size-5" aria-hidden="true" />
            </MenuButton>

            <MenuItems
              anchor="bottom start"
              className="z-40 rounded-md bg-white py-1 shadow-lg ring-1 ring-gray-300 [--anchor-gap:8px] focus:outline-none"
            >
              {Array.from(groupedStyles.entries()).map(([group, styles]) => {
                const showHeadline = group !== 'fallback'

                return (
                  <MenuSection key={group}>
                    {showHeadline && (
                      <MenuHeading className="px-3 py-2 text-left text-sm font-semibold text-gray-400">
                        {group}:
                      </MenuHeading>
                    )}

                    {styles.map((styleConfig) => {
                      if (!styleConfig) return null
                      const key = createSubcatStyleKey(subcategory.id, styleConfig.id)

                      return (
                        <MenuItem key={key}>
                          {({ focus }) => (
                            <button
                              type="button"
                              onClick={() =>
                                selectActive({
                                  subcatId: subcategory.id,
                                  styleId: styleConfig.id,
                                })
                              }
                              className={twJoin(
                                styleConfig.active
                                  ? 'bg-yellow-400 text-gray-900'
                                  : 'text-gray-700',
                                focus ? 'bg-yellow-50' : '',
                                'block w-full cursor-pointer py-2 pr-3 text-left text-sm',
                                'pl-3',
                              )}
                            >
                              {styleConfig.name}
                            </button>
                          )}
                        </MenuItem>
                      )
                    })}
                  </MenuSection>
                )
              })}
            </MenuItems>
          </>
        )}
      </Menu>

      {!disabled && (
        <div className="ml-6">
          <Legend subcategoryId={subcategory.id} styleConfig={activeStyleConfig} />
        </div>
      )}
    </fieldset>
  )
}
