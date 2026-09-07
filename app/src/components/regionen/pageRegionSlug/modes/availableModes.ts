import type { TRegion } from '@/server/regions/regionConfigMapper.server'
import type { RegionMode } from './useCurrentMode'

/** Which mode pages a region offers. The default `map` mode is always available. */
type AvailableModes = Record<Exclude<RegionMode, 'map'>, boolean>

/**
 * Mode pages a region offers besides the default map. There is no separate "enabled modes" flag.
 * - notes: OSM notes or TILDA internal notes enabled
 * - qa: at least one active QA config the current user may see
 * - reviewLists: at least one assigned list, or the user is a region member/admin (can create the first)
 */
export const deriveAvailableModes = ({
  region,
  qaConfigsCount,
  reviewListsCount = 0,
  canManage = false,
}: {
  region: Pick<TRegion, 'notesOsm' | 'notesInternal'>
  qaConfigsCount: number
  reviewListsCount?: number
  /** Region member/admin. Can open Prüflisten before any list exists. */
  canManage?: boolean
}) => {
  return {
    notes: region.notesOsm || region.notesInternal,
    qa: qaConfigsCount > 0,
    reviewLists: reviewListsCount > 0 || canManage,
  } satisfies AvailableModes
}

const regionModePath = (segment: string) => new RegExp(`^/regionen/[^/]+/${segment}/?$`)

const qaModePath = regionModePath('qa')
const reviewListsModePath = regionModePath('prueflisten')
const notesModePath = regionModePath('hinweise')

/** QA and Prüflisten are always member-only. Hinweise is when the region has only internal notes. */
export const isMemberOnlyModePathname = (
  pathname: string,
  region?: Pick<TRegion, 'notesOsm' | 'notesInternal'>,
) => {
  if (qaModePath.test(pathname) || reviewListsModePath.test(pathname)) return true
  if (region?.notesInternal && !region.notesOsm && notesModePath.test(pathname)) {
    return true
  }
  return false
}
