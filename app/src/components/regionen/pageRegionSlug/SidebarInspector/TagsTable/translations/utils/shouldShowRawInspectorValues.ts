import { getDatasetOrSourceData } from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import type { RegionDataset } from '@/server/uploads/queries/getUploadsForRegion.server'

export const shouldShowRawInspectorValues = (sourceId: string, regionDatasets: RegionDataset[]) => {
  const sourceData = getDatasetOrSourceData(sourceId, regionDatasets)
  return (
    !!sourceData &&
    'disableTranslations' in sourceData.inspector &&
    sourceData.inspector.disableTranslations === true
  )
}
