import { useMapDebugDebugLayerStyles } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapDebugState'
import type { MapDataCategoryConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'
import { useCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/useCategoriesConfig'
import { useDataParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useDataParam'
import { useShowInternalNotesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesAtlasParams'
import { useShowOsmNotesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesOsmParams'
import { useQaParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useQaParam'
import { useRegionDatasetsQuery } from '@/components/regionen/pageRegionSlug/hooks/useRegionDataQueries'
import { getSourceData } from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import { useStaticRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useStaticRegion'
import { createLayerKeyAtlasGeo } from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsAtlasGeo'
import {
  createDatasetSourceLayerKey,
  createSourceKeyStaticDatasets,
} from '@/components/regionen/pageRegionSlug/utils/sourceKeyUtils/sourceKeyUtilsStaticDataset'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { internalNotesLayerId } from '../SourcesAndLayers/SourcesLayersInternalNotes'
import { osmNotesLayerId } from '../SourcesAndLayers/SourcesLayersOsmNotes'
import { qaLayerId } from '../SourcesAndLayers/SourcesLayersQa'
import { MASK_INTERACTIVE_LAYER_IDS } from './maskLayerUtils'

type Props = { categories: MapDataCategoryConfig[] | undefined }

const collectInteractiveLayerIdsFromCategory = ({ categories }: Props) => {
  const interactiveLayerIds: string[] = []

  for (const categoryConfig of categories ?? []) {
    if (categoryConfig.active === false) continue

    for (const subcatConfig of categoryConfig?.subcategories ?? []) {
      for (const styleConfig of subcatConfig.styles) {
        if (styleConfig.id === 'hidden') continue
        if (styleConfig.active === false) continue

        for (const layerConfig of styleConfig.layers) {
          const sourceData = getSourceData(subcatConfig.sourceId)
          if (!sourceData.inspector.enabled) continue

          const layerData = styleConfig.layers.find((l) => l.id === layerConfig.id)
          if (layerData?.interactive === false) continue

          const layerKey = createLayerKeyAtlasGeo(
            subcatConfig.sourceId,
            subcatConfig.id,
            styleConfig.id,
            layerConfig.id,
          )
          interactiveLayerIds.push(layerKey)
        }
      }
    }
  }

  // For some reasons we have duplicated layerIds. Those do not show up as duplicates from <SourcesAndLayers />
  // For now, we just clean them in place…
  const duplicatesRemoved = interactiveLayerIds.filter((value, index, self) => {
    return self.indexOf(value) === index
  })

  return duplicatesRemoved
}

const collectAllLayerIdsFromConfig = ({ categories }: Props) => {
  const allLayerIds: string[] = []

  categories?.forEach((categoryConfig) => {
    categoryConfig.subcategories.forEach((subcatConfig) => {
      subcatConfig.styles.forEach((styleConfig) => {
        if (styleConfig.id === 'hidden') return

        styleConfig.layers.forEach((layerConfig) => {
          const layerKey = createLayerKeyAtlasGeo(
            subcatConfig.sourceId,
            subcatConfig.id,
            styleConfig.id,
            layerConfig.id,
          )
          allLayerIds.push(layerKey)
        })
      })
    })
  })

  return allLayerIds
}

export const useInteractiveLayers = () => {
  const hasPermissions = useHasPermissions()
  const debugLayerStyles = useMapDebugDebugLayerStyles()
  const { categoriesConfig } = useCategoriesConfig()
  const region = useStaticRegion()
  const { showOsmNotesParam } = useShowOsmNotesParam()
  const { showInternalNotesParam } = useShowInternalNotesParam()
  const { qaParamData } = useQaParam()
  const { dataParam: selectedDatasetIds } = useDataParam()
  const { data: regionDatasets } = useRegionDatasetsQuery()

  // Debug mode: return ALL layers from config
  if (debugLayerStyles && categoriesConfig) {
    return collectAllLayerIdsFromConfig({ categories: categoriesConfig })
  }

  // Standard flow: return normal interactive layers
  const activeCategoriesConfig = categoriesConfig?.filter((th) => th.active === true)

  const activeCategoryLayerIds = collectInteractiveLayerIdsFromCategory({
    categories: activeCategoriesConfig,
  })

  if (showOsmNotesParam) {
    activeCategoryLayerIds.push(osmNotesLayerId)
  }
  if (showInternalNotesParam) {
    activeCategoryLayerIds.push(internalNotesLayerId)
  }
  if (hasPermissions && qaParamData.configSlug && qaParamData.style !== 'none') {
    activeCategoryLayerIds.push(qaLayerId)
  }

  // Mask layers are systemLayer datasets with inspector.enabled: false, so they won't be included
  // via the normal dataset filtering. We need to manually add them so they're interactive.
  if (region.mask) {
    activeCategoryLayerIds.push(...MASK_INTERACTIVE_LAYER_IDS)
  }

  // active layer from datasets
  const datasetsActiveLayerIds = regionDatasets
    .filter((dataset) => dataset.inspector.enabled)
    .filter((dataset) => {
      return selectedDatasetIds?.includes(createSourceKeyStaticDatasets(dataset.id, dataset.subId))
    })
    .flatMap((dataset) => {
      return dataset.layers.map((layer) => {
        return createDatasetSourceLayerKey(dataset.id, dataset.subId, layer.id)
      })
    })

  return [...activeCategoryLayerIds, ...datasetsActiveLayerIds]
}
