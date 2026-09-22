import type { TRegion } from '@/server/regions/regionConfigMapper.server'
import type { RegionMode } from './useCurrentMode'

/** Which mode pages a region offers. The default `map` mode is always available. */
type AvailableModes = Record<Exclude<RegionMode, 'map'>, boolean>

/**
 * Mode pages a region offers besides the default map. There is no separate "enabled modes" flag,
 * except for Flächenfinder (D8, `spaceFinderEnabled`): unlike the other modes it cannot be derived
 * from data alone, because the worker that produces its results only runs on some instances.
 * - notes: OSM notes or TILDA internal notes enabled
 * - qa: at least one active QA config the current user may see
 * - reviewLists: at least one assigned list, or the user is a region member/admin (can create the first)
 * - spaceFinder: `region.spaceFinderEnabled` and the user is a region member/admin (always member-only)
 */
export const deriveAvailableModes = ({
  region,
  qaConfigsCount,
  reviewListsCount = 0,
  canManage = false,
}: {
  region: Pick<TRegion, 'notesOsm' | 'notesInternal' | 'spaceFinderEnabled'>
  qaConfigsCount: number
  reviewListsCount?: number
  /** Region member/admin. Can open Prüflisten before any list exists. */
  canManage?: boolean
}) => {
  return {
    notes: region.notesOsm || region.notesInternal,
    qa: qaConfigsCount > 0,
    reviewLists: reviewListsCount > 0 || canManage,
    spaceFinder: region.spaceFinderEnabled && canManage,
  } satisfies AvailableModes
}

/**
 * QA, Prüflisten and Flächenfinder are always member-only (every planning server function already
 * requires membership). Hinweise is member-only when the region has only internal notes.
 */
export const isMemberOnlyMode = (
  mode: Exclude<RegionMode, 'map'>,
  region: Pick<TRegion, 'notesOsm' | 'notesInternal'>,
) => {
  if (mode === 'qa' || mode === 'reviewLists' || mode === 'spaceFinder') return true
  return Boolean(region.notesInternal && !region.notesOsm)
}
