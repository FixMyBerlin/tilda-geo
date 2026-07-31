import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import { getExportIdsOrderedByRegionCategories } from '@/components/regionen/pageRegionSlug/regionDatasets/deriveRegionDatasetsFromCategories'
import { CheckboxGroup } from '@/components/shared/form/fields/CheckboxGroup'
import type { FormApi } from '@/components/shared/form/types'
import { catalogOptions, type RegionFormInput } from '@/server/regions/regionWriteSchema'
import { parseCommaList } from '@/shared/orderedList/commaList'

type Props = {
  form: FormApi<RegionFormInput>
}

const exportLabelById = new Map(catalogOptions.exports.map((entry) => [entry.id, entry.label]))

export function RegionExportsField({ form }: Props) {
  return (
    <form.Subscribe selector={(state) => state.values.categories}>
      {(categoriesValue) => {
        const categories = parseCommaList(String(categoriesValue ?? '')) as MapDataCategoryId[]
        const orderedExportIds = getExportIdsOrderedByRegionCategories(categories)

        return (
          <CheckboxGroup
            form={form}
            name="exports"
            label="Export-IDs"
            options={orderedExportIds.map((exportId) => ({
              value: exportId,
              label: exportLabelById.get(exportId) ?? exportId,
            }))}
          />
        )
      }}
    </form.Subscribe>
  )
}
