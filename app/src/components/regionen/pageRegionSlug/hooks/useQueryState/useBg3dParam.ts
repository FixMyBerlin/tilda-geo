import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'

/** True while 3D is on — buildings, terrain, compass, rotate/pitch, north-reset. */
export const useBg3dParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const is3dActive = search[searchParamsRegistry.bg3d]

  const toggle3d = (active: boolean) => {
    // `|| undefined` keeps the default (false) out of the URL.
    updateSearch({ [searchParamsRegistry.bg3d]: active || undefined }, { replace: true })
  }

  return {
    is3dActive,
    toggle3d,
  }
}
