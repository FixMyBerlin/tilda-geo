import type { TRegion } from '@/server/regions/regionConfigMapper.server'
import { calculatorDatasetsForCategories } from './calculator/calculatorDatasets.const'
import type { RegionMode } from './useCurrentMode'

/** Which mode pages a region offers. The default `map` mode is always available. */
type AvailableModes = Record<Exclude<RegionMode, 'map'>, boolean>

/**
 * Mode pages a region offers besides the default map. There is no separate "enabled modes" flag.
 * - notes: OSM notes or TILDA internal notes enabled
 * - qa: at least one active QA config the current user may see
 * - reviewLists: at least one assigned list, or the user is a region member/admin (can create the first)
 * - calculator: the region has a category with a dataset that can be summed
 */
export const deriveAvailableModes = ({
  region,
  qaConfigsCount,
  reviewListsCount = 0,
  canManage = false,
}: {
  region: Pick<TRegion, 'notesOsm' | 'notesInternal' | 'categories'>
  qaConfigsCount: number
  reviewListsCount?: number
  /** Region member/admin. Can open Prüflisten before any list exists. */
  canManage?: boolean
}) => {
  return {
    notes: region.notesOsm || region.notesInternal,
    qa: qaConfigsCount > 0,
    reviewLists: reviewListsCount > 0 || canManage,
    calculator: calculatorDatasetsForCategories(region.categories).length > 0,
  } satisfies AvailableModes
}

/**
 * QA and Prüflisten are always member-only. Hinweise is when the region has only internal notes.
 * Summieren is open to everyone who can see the region.
 */
export const isMemberOnlyMode = (
  mode: Exclude<RegionMode, 'map'>,
  region: Pick<TRegion, 'notesOsm' | 'notesInternal'>,
) => {
  if (mode === 'qa' || mode === 'reviewLists') return true
  if (mode === 'calculator') return false
  return Boolean(region.notesInternal && !region.notesOsm)
}
