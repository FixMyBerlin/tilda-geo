import { ArrowTopRightOnSquareIcon, MapIcon } from '@heroicons/react/24/outline'
import type React from 'react'
import { twMerge } from 'tailwind-merge'
import { useBackgroundParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBackgroundParam'
import { useMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam'
import { sourcesBackgroundsRaster } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sourcesBackgroundsRaster.const'
import { Link } from '@/components/shared/links/Link'
import {
  mapOverlayButtonElevationClassName,
  mapOverlayHairlineClassName,
} from '../mapOverlayChrome.const'
import { replaceZxy } from './utils/replaceZxy'

export const BackgroundLegend: React.FC = () => {
  const { backgroundParam } = useBackgroundParam()
  const { mapParam } = useMapParam()

  const selectedBackground = sourcesBackgroundsRaster.find((b) => b.id === backgroundParam)
  if (!selectedBackground?.legendUrl) return null
  if (!mapParam) return null

  const enhancedLink = replaceZxy({
    url: selectedBackground.legendUrl,
    zoom: mapParam.zoom,
    lat: mapParam.lat,
    lng: mapParam.lng,
  })

  return (
    <Link
      href={enhancedLink}
      blank
      classNameOverwrite={twMerge(
        'group inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-yellow-50 focus:ring-2 focus:ring-yellow-500 focus:outline-none',
        mapOverlayHairlineClassName,
        mapOverlayButtonElevationClassName,
      )}
      title={`Für die gewählte Hintergrundkarte ${selectedBackground.name} gibt es eine Legene auf einer externen Webseite.`}
    >
      <div className="relative mr-1.5 -ml-1 size-5">
        <ArrowTopRightOnSquareIcon
          className="absolute opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        />
        <MapIcon
          className="absolute opacity-100 transition-opacity group-hover:opacity-0"
          aria-hidden="true"
        />
      </div>
      Legende
    </Link>
  )
}
