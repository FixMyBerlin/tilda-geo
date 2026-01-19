import { LinkExternal } from '@/src/app/_components/links/LinkExternal'
import { useBackgroundParam } from '@/src/app/regionen/[regionSlug]/_hooks/useQueryState/useBackgroundParam'
import { useMapParam } from '@/src/app/regionen/[regionSlug]/_hooks/useQueryState/useMapParam'
import { ArrowTopRightOnSquareIcon, MapIcon } from '@heroicons/react/24/outline'
import React from 'react'
import { sourcesBackgroundsRaster } from '../../_mapData/mapDataSources/sourcesBackgroundsRaster.const'
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
    <LinkExternal
      href={enhancedLink}
      blank
      classNameOverwrite="group inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-md hover:bg-yellow-50 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
      title={`Für die gewählte Hintergrundkarte ${selectedBackground.name} gibt es eine Legene auf einer externen Webseite.`}
    >
      <div className="relative mr-1.5 -ml-1 h-5 w-5">
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
    </LinkExternal>
  )
}
