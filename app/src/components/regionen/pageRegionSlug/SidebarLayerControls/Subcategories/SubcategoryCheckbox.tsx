import { produce } from 'immer'
import type React from 'react'
import { twJoin } from 'tailwind-merge'
import type { MapDataCategoryConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'
import { useCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/useCategoriesConfig'
import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import { Legend } from '../Legend/Legend'

type MapDataSubcategoryConfig = MapDataCategoryConfig['subcategories'][number]

type Props = {
  categoryId: MapDataCategoryId
  subcategory: MapDataSubcategoryConfig
  disabled: boolean
}

export const SubcategoryCheckbox = ({ categoryId, subcategory, disabled }: Props) => {
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
        for (const s of subcat.styles) {
          s.active = false
        }
        if (checked) {
          const style = subcat.styles.find((s) => s.id === styleId)
          if (style) style.active = true
        }
      }
    })
    void setCategoriesConfig(newConfig)
  }

  if (!subcategory) return null

  const styleConfig = subcategory.styles[0]
  if (!styleConfig) return null

  return (
    <fieldset
      className={twJoin(
        'relative flex items-start gap-2 px-2',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
      )}
    >
      <input
        id={subcategory.id}
        name={subcategory.id}
        type="checkbox"
        className={twJoin(
          'size-4 rounded border-gray-300',
          disabled
            ? 'text-gray-400'
            : 'cursor-pointer text-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-0 focus:outline-none',
        )}
        disabled={disabled}
        defaultChecked={styleConfig.active}
        onChange={(event) =>
          toggleActive({
            event,
            subcatId: subcategory.id,
            styleId: styleConfig.id,
          })
        }
      />

      <div className="text-sm leading-4">
        <label
          htmlFor={subcategory.id}
          className={twJoin(
            'font-medium',
            disabled ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer text-gray-700',
          )}
        >
          {subcategory.name}
        </label>

        {styleConfig.active && !disabled && (
          <Legend subcategoryId={subcategory.id} styleConfig={styleConfig} />
        )}
      </div>
    </fieldset>
  )
}
