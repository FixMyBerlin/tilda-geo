import { useCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/useCategoriesConfig'
import { CategoryDisclosure } from './CategoryDisclosure'

export const Categories = () => {
  const { categoriesConfig } = useCategoriesConfig()

  if (!categoriesConfig) return null

  const activeCategoryIds = categoriesConfig
    .filter((categoryConfig) => categoryConfig.active)
    .map((categoryConfig) => categoryConfig.id)

  return (
    <nav className="relative z-0 flex flex-col">
      {categoriesConfig.map((categoryConfig) => {
        if (!categoryConfig) return null
        const active = activeCategoryIds.includes(categoryConfig.id)

        return (
          <CategoryDisclosure
            key={categoryConfig.id}
            categoryConfig={categoryConfig}
            active={active}
          />
        )
      })}
    </nav>
  )
}
