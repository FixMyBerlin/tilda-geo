import type { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { bikelanesDefaultStyle, bikelanesDetailsStyle } from './subcat_bikelanes.const'

const subcatId = 'bikelanes'
const source = 'atlas_bikelanes'
// const sourceLayer = 'bikelanes'
export type SubcatRainfraBikelanesId = typeof subcatId
export type SubcatRainfraBikelanesStyleIds = 'default' | 'details'

export const subcat_radinfra_bikelanes: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Radinfrastruktur',
  ui: 'dropdown',
  sourceId: source,
  beforeId: 'atlas-app-beforeid-top',
  styles: [defaultStyleHidden, bikelanesDefaultStyle, bikelanesDetailsStyle],
}
