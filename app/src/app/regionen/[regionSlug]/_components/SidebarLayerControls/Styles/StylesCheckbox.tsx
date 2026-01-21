import { useCategoriesConfig } from '@/src/app/regionen/[regionSlug]/_hooks/useQueryState/useCategoriesConfig/useCategoriesConfig'
import { produce } from 'immer'
import React from 'react'
import { twJoin } from 'tailwind-merge'
import { MapDataSubcategoryConfig } from '../../../_hooks/useQueryState/useCategoriesConfig/type'
import { MapDataCategoryId } from '../../../_mapData/mapDataCategories/MapDataCategoryId'
import { createSubcatStyleKey } from '../../utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import { Legend } from '../Legend/Legend'

type Props = {
  categoryId: MapDataCategoryId
  subcatConfig: MapDataSubcategoryConfig
  disabled: boolean
}

export const StylesCheckbox = ({ categoryId, subcatConfig, disabled }: Props) => {
  const { categoriesConfig, setCategoriesConfig } = useCategoriesConfig()

  type ToggleActiveProps = {
    event: React.ChangeEvent<HTMLInputElement>
    subcatId: string
    styleId: string
  }
  const toggleActive = ({ event, subcatId, styleId }: ToggleActiveProps) => {
    const checked = event.target.checked
    const oldConfig = categoriesConfig
    const newConfig = produce(oldConfig, (draft) => {
      const subcat = draft
        ?.find((th) => th.id === categoryId)
        ?.subcategories.find((t) => t.id === subcatId)

      if (subcat) {
        subcat.styles.forEach((s) => (s.active = false))
        if (checked) {
          const style = subcat.styles.find((s) => s.id === styleId)
          style && (style.active = true)
        }
      }
    })
    void setCategoriesConfig(newConfig)
  }

  if (!subcatConfig) return null

  return (
    <div>
      {subcatConfig.styles.map((styleConfig) => {
        if (!styleConfig) return null
        const key = createSubcatStyleKey(subcatConfig.id, styleConfig.id)
        return (
          <div key={key} className="flex items-start">
            <div className="flex h-5 items-center">
              <input
                id={subcatConfig.id}
                name={subcatConfig.id}
                type="checkbox"
                className={twJoin(
                  'h-4 w-4 rounded border-gray-300',
                  disabled ? 'text-gray-400' : 'text-yellow-500 focus:shadow-md focus:outline-none',
                )}
                disabled={disabled}
                defaultChecked={styleConfig.active}
                onChange={(event) =>
                  toggleActive({
                    event,
                    subcatId: subcatConfig.id,
                    styleId: styleConfig.id,
                  })
                }
              />
            </div>

            <div className="mt-0.5 ml-2 text-sm leading-4">
              <label
                htmlFor={subcatConfig.id}
                className={twJoin('font-medium', disabled ? 'text-gray-400' : 'text-gray-700')}
              >
                {subcatConfig.name}
              </label>

              {styleConfig.active && (
                <Legend subcategoryId={subcatConfig.id} styleConfig={styleConfig} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
