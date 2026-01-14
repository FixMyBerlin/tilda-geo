import { MetaData } from '@/scripts/StaticDatasets/types'
import { Prettify } from '@/src/app/_components/types/types'
import getUploadsForRegion from '@/src/server/uploads/queries/getUploadsForRegion'
import { useQuery } from '@blitzjs/rpc'
import { MapRenderFormatEnum } from '@prisma/client'
import { useRegionSlug } from '../../_components/regionUtils/useRegionSlug'

type RegionDataset = Prettify<
  MetaData['configs'][number] & {
    isPublic: boolean
    hideDownloadLink: boolean
    id: string
    mapRenderFormat: MapRenderFormatEnum // from upload
    mapRenderUrl: string // URL for map rendering (PMTiles or GeoJSON based on mapRenderFormat)
    githubUrl: string // from upload
    geojsonUrl: string | null // from upload
    pmtilesUrl: string | null // from upload
  }
>

export const useRegionDatasets = () => {
  const regionSlug = useRegionSlug()
  const [uploads] = useQuery(
    getUploadsForRegion,
    { regionSlug: regionSlug! },
    {
      cacheTime: Infinity,
      select: (uploads) => {
        const regionDatasets: RegionDataset[] = []

        uploads.forEach((upload) => {
          const configs = upload.configs as MetaData['configs']

          configs.forEach((config) => {
            regionDatasets.push({
              ...config,
              isPublic: upload.public,
              hideDownloadLink: upload.hideDownloadLink,
              id: upload.slug,
              mapRenderFormat: upload.mapRenderFormat,
              mapRenderUrl: upload.mapRenderUrl,
              githubUrl: upload.githubUrl,
              geojsonUrl: upload.geojsonUrl,
              pmtilesUrl: upload.pmtilesUrl,
            })
          })
        })

        return regionDatasets
      },
    },
  )

  return uploads
}
