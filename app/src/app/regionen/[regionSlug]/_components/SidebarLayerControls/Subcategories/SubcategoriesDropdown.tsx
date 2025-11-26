import { twJoin } from 'tailwind-merge'
import { MapDataCategoryConfig } from '../../../_hooks/useQueryState/useCategoriesConfig/type'
import { StylesDropdown } from '../Styles/StylesDropdown'

type Props = {
  categoryId: MapDataCategoryConfig['id']
  subcategories: MapDataCategoryConfig['subcategories']
  disabled: boolean
}

export const SubcategoriesDropdown = ({ categoryId, subcategories, disabled }: Props) => {
  if (!subcategories) return null

  return (
    <fieldset className="space-y-3">
      {subcategories.map((subcatConfig) => {
        const showSubheadline = subcategories.length > 1

        return (
          <div key={subcatConfig.id} className="px-2">
            <div
              className={twJoin(
                'mb-1 text-sm font-semibold leading-tight',
                disabled ? 'text-gray-400' : 'text-gray-900',
                showSubheadline ? '' : 'sr-only',
              )}
            >
              {subcatConfig.name}
            </div>

            <StylesDropdown
              categoryId={categoryId}
              subcatConfig={subcatConfig}
              disabled={disabled}
            />
          </div>
        )
      })}
    </fieldset>
  )
}
