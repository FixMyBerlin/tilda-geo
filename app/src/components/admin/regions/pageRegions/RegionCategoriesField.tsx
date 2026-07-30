import { twJoin } from 'tailwind-merge'
import { AdminTrashIconButton } from '@/components/admin/AdminTrashIconButton'
import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import { ChoiceCheckbox } from '@/components/shared/form/fields/ChoiceCheckbox'
import { labelClass } from '@/components/shared/form/fields/sharedStyles'
import type { FormApi } from '@/components/shared/form/types'
import { Link } from '@/components/shared/links/Link'
import { SortableList } from '@/components/shared/sortable/SortableList'
import { catalogOptions, type RegionFormInput } from '@/server/regions/regionWriteSchema'
import { joinCommaList, parseCommaList } from '@/shared/orderedList/commaList'
import { removeIdFromList, reorderIds, toggleIdInList } from '@/shared/orderedList/orderedIds'

type Props = {
  form: FormApi<RegionFormInput>
}

const githubDevelopCategoriesDir =
  'https://github.com/FixMyBerlin/tilda-geo/blob/develop/app/src/components/regionen/pageRegionSlug/mapData/mapDataCategories'

const categoryLabelById = new Map(catalogOptions.categories.map((entry) => [entry.id, entry.label]))

type CategoriesFieldProps = {
  value: string
  onChange: (value: string) => void
}

function CategoriesField({ value, onChange }: CategoriesFieldProps) {
  const selected = parseCommaList(value)
  const unselected = catalogOptions.categories.filter((option) => !selected.includes(option.id))

  const setSelected = (next: string[]) => {
    onChange(joinCommaList(next))
  }

  return (
    <div className="space-y-4">
      <p className={labelClass}>Kategorien</p>
      <SortableList
        items={selected}
        getItemKey={(id) => id}
        onReorder={(next) => setSelected(reorderIds(selected, next))}
        emptyMessage={<p className="text-sm text-gray-500">Keine Kategorien ausgewählt.</p>}
        renderItem={(id, { dragHandle }) => {
          const categoryId = id as MapDataCategoryId
          return (
            <div className="flex items-center gap-2 rounded border border-gray-200 bg-white px-2 py-1.5">
              {dragHandle}
              <span className="min-w-0 flex-1 text-sm text-gray-800">
                {categoryLabelById.get(categoryId) ?? id}
              </span>
              <AdminTrashIconButton
                ariaLabel={`Kategorie ${categoryLabelById.get(categoryId) ?? id} entfernen`}
                onClick={() => setSelected(removeIdFromList(selected, id))}
              />
            </div>
          )
        }}
      />
      {unselected.length > 0 ? (
        <div className="pt-2">
          <p className="mb-2 text-sm font-medium text-gray-700">Hinzufügen</p>
          <div className="columns-2 gap-x-4">
            {unselected.map((option) => (
              <ChoiceCheckbox
                key={option.id}
                id={`categories-add-${option.id}`}
                checked={false}
                ariaLabel={option.label}
                label={option.label}
                className="mb-2 break-inside-avoid"
                onChange={() => setSelected(toggleIdInList(selected, option.id))}
              />
            ))}
          </div>
        </div>
      ) : null}
      <p className={twJoin('text-sm text-gray-500')}>
        Reihenfolge entspricht der Anordnung in der Karten-Sidebar.
      </p>
      <p className="text-sm text-gray-500">
        Die auswählbaren Kategorien sind im Code definiert — in der <code>categories</code>-Liste in{' '}
        <Link href={`${githubDevelopCategoriesDir}/categories.const.ts`} blank>
          <code>mapData/mapDataCategories/categories.const.ts</code>
        </Link>{' '}
        (IDs typisiert in{' '}
        <Link href={`${githubDevelopCategoriesDir}/MapDataCategoryId.ts`} blank>
          <code>MapDataCategoryId.ts</code>
        </Link>
        ; Parkraum/radinfra ergänzen die Liste über{' '}
        <Link href={`${githubDevelopCategoriesDir}/categoriesParkingTilda.const.ts`} blank>
          <code>categoriesParkingTilda</code>
        </Link>
        /
        <Link href={`${githubDevelopCategoriesDir}/categoriesParkingLars.const.ts`} blank>
          <code>categoriesParkingLars</code>
        </Link>
        /
        <Link href={`${githubDevelopCategoriesDir}/categoriesRadinfra.const.ts`} blank>
          <code>categoriesRadinfra</code>
        </Link>
        ). Eine neue Kategorie wird dort im Code angelegt und per Deploy verfügbar — über die
        Admin-UI lässt sie sich nicht erstellen.
      </p>
    </div>
  )
}

export function RegionCategoriesField({ form }: Props) {
  return (
    <form.Field name="categories">
      {(field) => (
        <CategoriesField
          value={String(field.state.value ?? '')}
          onChange={(next) => field.handleChange(next as typeof field.state.value)}
        />
      )}
    </form.Field>
  )
}
