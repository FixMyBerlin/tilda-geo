import { useRegionDatasetsQuery } from '@/components/regionen/pageRegionSlug/hooks/useRegionDataQueries'
import { SelectDatasets } from './SelectDatasets'

const fallbackCategory = 'Statische Daten'

export const StaticDatasetCategories = () => {
  const { data: regionDatasets } = useRegionDatasetsQuery()
  if (!regionDatasets.length) return null

  const groupedDatasets: { [category: string]: typeof regionDatasets } = {}
  regionDatasets
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((dataset) => {
      const category = (dataset.category as string) || fallbackCategory
      groupedDatasets[category] = [...(groupedDatasets[category] || []), dataset]
    })

  const sortedGroupKeys = Object.keys(groupedDatasets).sort((a, b) => {
    const da = groupedDatasets[a]?.[0]
    const db = groupedDatasets[b]?.[0]
    if (!da || !db) return a.localeCompare(b)
    const diff = da.categorySortOrder - db.categorySortOrder
    if (diff !== 0) return diff
    return a.localeCompare(b)
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
    <nav className="relative z-0 flex flex-col border-t border-t-gray-200 bg-gray-50">
      {Object.entries(sortedGroupedDatasets).map(([category, datasets]) => {
        return <SelectDatasets key={category} category={category} datasets={datasets} />
      })}
    </nav>
  )
}
