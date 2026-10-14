import { useCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/useCategoriesConfig'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { CategoryDisclosure } from './CategoryDisclosure'

export const Categories = () => {
  const { categoriesConfig } = useCategoriesConfig()
  const { isCalculator } = useCurrentMode()

  if (!categoriesConfig) return null

  const activeCategoryIds = categoriesConfig
    .filter((categoryConfig) => categoryConfig.active)
    .map((categoryConfig) => categoryConfig.id)

  return (
    <nav className="relative z-0 flex flex-col">
      {isCalculator && (
        <p className="border-b border-gray-200 bg-fuchsia-50 px-3 py-2 text-xs text-gray-700">
          Im Modus Summieren zeigt die Karte nur die Daten, die summiert werden. Die Kategorien sind
          solange ausgeblendet.
        </p>
      )}
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
