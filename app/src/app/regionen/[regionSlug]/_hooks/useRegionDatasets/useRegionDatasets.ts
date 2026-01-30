import getUploadsForRegion, {
  RegionDataset,
} from '@/src/server/uploads/queries/getUploadsForRegion'
import { useQuery } from '@blitzjs/rpc'
import { useRegionSlug } from '../../_components/regionUtils/useRegionSlug'

export type { RegionDataset }

export const useRegionDatasets = () => {
  const regionSlug = useRegionSlug()
  const [datasets] = useQuery(
    getUploadsForRegion,
    { regionSlug: regionSlug!, systemLayer: false },
    { cacheTime: Infinity },
  )

  return datasets
}

export const useRegionDatasetsSystemLayer = () => {
  const regionSlug = useRegionSlug()
  const [datasets] = useQuery(
    getUploadsForRegion,
    { regionSlug: regionSlug!, systemLayer: true },
    { cacheTime: Infinity },
  )

  return datasets
}
