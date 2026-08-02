import { getBg3dModulesFromSearch } from '@/shared/regionen/regionSearchSchemas'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'
import {
  is3dActive as getIs3dActive,
  is3dBuildingActive as getIs3dBuildingActive,
  is3dTerrainActive as getIs3dTerrainActive,
  serializeBg3dParam,
  type Bg3dModule,
} from './utils/bg3dParam'

export const useBg3dParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const bg3dModules = getBg3dModulesFromSearch(search)

  const setBg3dModules = (modules: Bg3dModule[]) => {
    updateSearch({ [searchParamsRegistry.bg3d]: serializeBg3dParam(modules) }, { replace: true })
  }

  const toggleBg3dModule = (module: Bg3dModule, active: boolean) => {
    const next = active ? [...bg3dModules, module] : bg3dModules.filter((entry) => entry !== module)
    setBg3dModules(next)
  }

  const toggle3dBuildings = (active: boolean) => toggleBg3dModule('buildings', active)
  const toggle3dTerrain = (active: boolean) => toggleBg3dModule('terrain', active)

  return {
    bg3dModules,
    setBg3dModules,
    toggle3dBuildings,
    toggle3dTerrain,
    is3dBuildingActive: getIs3dBuildingActive(bg3dModules),
    is3dTerrainActive: getIs3dTerrainActive(bg3dModules),
    is3dActive: getIs3dActive(bg3dModules),
  }
}
