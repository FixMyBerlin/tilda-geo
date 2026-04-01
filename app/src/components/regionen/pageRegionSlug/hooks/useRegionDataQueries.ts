import { type DefinedUseQueryResult, useQuery } from '@tanstack/react-query'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import type {
  RegionDatasetSystemLayer,
  RegionDatasetUser,
} from '@/server/uploads/queries/getUploadsForRegion.server'
import {
  regionUploadsSystemLayerQueryOptions,
  regionUploadsUserQueryOptions,
} from '@/server/uploads/uploadsQueryOptions'

/** User uploads for the region. data is always an array (placeholderData in query options until load). */
export const useRegionDatasetsQuery = () => {
  const regionSlug = useRegionSlug()
  // Why this `as`: placeholderData does not narrow `data` in the return type.
  return useQuery(regionUploadsUserQueryOptions(regionSlug ?? '')) as DefinedUseQueryResult<
    RegionDatasetUser[],
    Error
  >
}

/** System-layer datasets for the region. data is always an array (placeholderData in query options until load). */
export const useRegionSystemLayerDatasetsQuery = () => {
  const regionSlug = useRegionSlug()
  // Why this `as`: placeholderData does not narrow `data` in the return type.
  return useQuery(regionUploadsSystemLayerQueryOptions(regionSlug ?? '')) as DefinedUseQueryResult<
    RegionDatasetSystemLayer[],
    Error
  >
}
