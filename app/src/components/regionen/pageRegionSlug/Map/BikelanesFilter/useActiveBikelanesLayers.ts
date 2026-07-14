import { useMemo } from 'react'
import { useCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/useCategoriesConfig'
import { createLayerKeyAtlasGeo } from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import { isAtlasStyleLayer } from '../SourcesAndLayers/utils/buildAtlasLayerProps'

export type ActiveBikelanesLayer = {
  layerId: string
  originalLineColor: unknown
}

// The `bikelanes` subcategory id (and its `atlas_bikelanes` source) is reused by several
// categories (`bikelanes`, `bikelanes-minimal`, and the "Radinfrastruktur" dropdown), so we
// scan all active categories rather than assuming a single fixed category id.
const BIKELANES_SUBCATEGORY_ID = 'bikelanes'

/** All currently visible `bikelanes` line layers (any active style), with their un-filtered
 * `line-color` paint value, so the filter effect can fall back to it when a feature passes. */
export const useActiveBikelanesLayers = (): ActiveBikelanesLayer[] => {
  const { categoriesConfig } = useCategoriesConfig()

  return useMemo(() => {
    const activeLayers: ActiveBikelanesLayer[] = []
    for (const category of categoriesConfig ?? []) {
      if (!category.active) continue
      for (const subcategory of category.subcategories) {
        if (subcategory.id !== BIKELANES_SUBCATEGORY_ID) continue
        for (const style of subcategory.styles) {
          if (!style.active) continue
          const layers = style.layers?.filter(isAtlasStyleLayer) ?? []
          for (const layer of layers) {
            if (layer.type !== 'line' || !layer.paint || !('line-color' in layer.paint)) continue
            activeLayers.push({
              layerId: createLayerKeyAtlasGeo(
                subcategory.sourceId,
                subcategory.id,
                style.id,
                layer.id,
              ),
              originalLineColor: layer.paint['line-color'],
            })
          }
        }
      }
    }
    return activeLayers
  }, [categoriesConfig])
}
