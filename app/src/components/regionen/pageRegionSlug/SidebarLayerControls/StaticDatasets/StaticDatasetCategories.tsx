import { useRegionDatasetsQuery } from '@/components/regionen/pageRegionSlug/hooks/useRegionDataQueries'
import { staticDatasetCategories } from '@/components/regionen/pageRegionSlug/mapData/mapDataStaticDatasetCategories/staticDatasetCategories.const'
import { SelectDatasets } from './SelectDatasets'

const fallbackCategory = 'Statische Daten'

export const StaticDatasetCategories = () => {
  const { data: regionDatasets } = useRegionDatasetsQuery()
  if (!regionDatasets.length) return null

  // The catgory can be null, which is our default Category.
  // The .category is also used as the named _for_now_ (in a cleaned up version).
  const groupedDatasets: { [category: string]: typeof regionDatasets } = {}
  regionDatasets
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((dataset) => {
      const category = (dataset.category as string) || fallbackCategory
      groupedDatasets[category] = [...(groupedDatasets[category] || []), dataset]
    })

  // We sort the categories by the `order` defined in `staticDatasetCategories`
  const sortedGroupKeys = Object.keys(groupedDatasets).sort((a, b) => {
    const orderA = staticDatasetCategories[a]?.order || Infinity
    const orderB = staticDatasetCategories[b]?.order || Infinity
    return orderA - orderB
  })
  const sortedGroupedDatasets: { [category: string]: typeof regionDatasets } = {}
  for (const key of sortedGroupKeys) {
    const value = groupedDatasets[key]
    if (value) sortedGroupedDatasets[key] = value
  }
  if (groupedDatasets[fallbackCategory]) {
    sortedGroupedDatasets[fallbackCategory] = groupedDatasets[fallbackCategory]
  }

  return (
    <nav className="relative z-0 flex flex-col bg-gray-50">
      {Object.entries(sortedGroupedDatasets).map(([category, datasets]) => {
        return <SelectDatasets key={category} category={category} datasets={datasets} />
      })}
    </nav>
  )
}
