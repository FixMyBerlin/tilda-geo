import type { MapDataCategoryId } from '../../../mapData/mapDataCategories/MapDataCategoryId'
import type { StyleId, SubcategoryId } from '../../../mapData/typeId'
import type { StaticMapDataCategory } from '../../../mapData/types'

// ========
// Category config as URL params — what is returned by `stringify`/`serialize`
// ========

export type MapDataCategoryParam = {
  id: MapDataCategoryId
  active: boolean
  subcategories: MapDataSubcategoryParam[]
}

type MapDataSubcategoryParam = {
  id: SubcategoryId
  styles: {
    id: StyleId
    active: boolean
  }[]
}

// ========
// Category config als object — what is returned by `parse`
// ========

export type MapDataCategoryConfig = Omit<StaticMapDataCategory, 'subcategories'> & {
  active: boolean
  // open: boolean // TODO: We will probably want to add this to handle to Disclosure open/close state separate from the active state.
  subcategories: MapDataSubcategoryConfig[]
}

type MergeSubcategory = StaticMapDataCategory['subcategories'][number]
export type MapDataSubcategoryConfig = Omit<MergeSubcategory, 'styles'> & {
  styles: MapDataSubcategoryStyleConfig[]
}

type MergeStyle = StaticMapDataCategory['subcategories'][number]['styles'][number]
type MapDataSubcategoryStyleConfig = MergeStyle & {
  active: boolean
}
